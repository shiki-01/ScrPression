import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import AutoResizeInput from '$lib/components/AutoResizeInput';
import { BlockType, Position, Size } from '$lib/block/type';
import { BlockStore } from '$lib/block/store';
import { draggingStore } from '$lib/store';
import { ColorPalette, getColor } from '$lib/utils/color';
import { path } from '$lib/utils/path';
import { CanvasStore } from '$lib/canvas/store.ts';
import { defaultBlock } from '$lib/block';

/**
 * ブロックのドラッグ処理を管理するカスタムフック
 */
const useBlockDrag = (
	blockRef: React.RefObject<HTMLElement | null>,
	blockContent: BlockType,
	type: 'block' | 'drag',
	position: Position,
	setPosition: (pos: Position) => void,
	onDragStart: (event: PointerEvent, offset: Position) => void,
	onDragEnd: (event: PointerEvent, position: Position) => void,
) => {
	const blockStore = BlockStore.getInstance();
	const canvasStore = CanvasStore.getInstance();
	const [isDragging, setIsDragging] = useState(false);
	const startPos = useRef({ x: 0, y: 0 });
	const dragOffset = useRef({ x: 0, y: 0 });
	console.log('useBlockDrag');

	const handlePointerDown = useCallback(
		(e: PointerEvent) => {
			if (e.button !== 0 || !blockRef.current) return;

			const rect = blockRef.current.getBoundingClientRect();
			dragOffset.current = {
				x: e.clientX - rect.left,
				y: e.clientY - rect.top
			};

			startPos.current = {
				x: type === 'drag' ? position.x : blockContent.position.x,
				y: type === 'drag' ? position.y : blockContent.position.y
			};

			blockRef.current.setPointerCapture(e.pointerId);
			setIsDragging(true);

			if (onDragStart) {
				onDragStart(e, dragOffset.current);
			}

			e.stopPropagation();
			e.preventDefault();
		},
		[blockContent.position, type, position, onDragStart]
	);

	const handlePointerMove = useCallback(
		(e: PointerEvent) => {
			console.log('handlePointerMove');
			if (!isDragging) return;
			console.log('isDragging', isDragging);

			if (type === 'drag') {
				// ドラッグタイプは直接position stateを更新
				setPosition({
					x: e.clientX - dragOffset.current.x,
					y: e.clientY - dragOffset.current.y
				});
			} else {
				// 通常ブロックはstoreを通じて更新
				const canvasPos = canvasStore.getCanvasPos();
				const newPosition = {
					x: e.clientX - dragOffset.current.x - canvasPos.x,
					y: e.clientY - dragOffset.current.y - canvasPos.y
				};
				blockStore.updateBlock(blockContent.id, { position: newPosition });
				updateChildrenPositions(blockContent.id, {
					x: e.clientX - dragOffset.current.x,
					y: e.clientY - dragOffset.current.y
				});
			}
		},
		[isDragging, type, setPosition, blockContent.id, canvasStore, blockStore]
	);

	const handlePointerUp = useCallback(
		(e: PointerEvent) => {
			if (!isDragging || !blockRef.current) return;

			blockRef.current.releasePointerCapture(e.pointerId);
			setIsDragging(false);

			if (onDragEnd) {
				onDragEnd(e, {
					x: e.clientX - dragOffset.current.x,
					y: e.clientY - dragOffset.current.y
				});
			}

			e.stopPropagation();
			e.preventDefault();
		},
		[isDragging, onDragEnd]
	);

	// 子ブロックの位置を更新する関数
	const updateChildrenPositions = useCallback(
		(parentId: string, parentPosition: Position) => {
			const block = blockStore.getBlock(parentId);
			if (!block) return;

			if (block.childId) {
				let childId = block.childId;
				let offset = 42;

				while (childId) {
					const childBlock = blockStore.getBlock(childId);
					if (!childBlock) break;

					const newPos = {
						x: parentPosition.x - 250 - canvasStore.getCanvasPos().x,
						y: parentPosition.y + offset - 50 - canvasStore.getCanvasPos().y
					};

					blockStore.updateBlock(childId, { position: newPos });

					childId = childBlock.childId || '';
					offset += 42;
				}
			}

			if (block.type === 'loop' && block.enclose) {
				const encloseOffset = block.enclose.offset;
				let offset = 0;

				block.enclose.contents.forEach((innerBlock) => {
					offset += 42;
					const newPos = {
						x: parentPosition.x + encloseOffset.x - canvasStore.getCanvasPos().x,
						y: parentPosition.y + offset + encloseOffset.y - canvasStore.getCanvasPos().y
					};

					blockStore.updateBlock(innerBlock.id, { position: newPos });
				});
			}
		},
		[blockStore, canvasStore]
	);

	// イベントハンドラを設定
	useEffect(() => {
		const element = blockRef.current;
		if (!element) return;

		console.log('addEventListener');

		element.addEventListener('pointerdown', handlePointerDown, { passive: false });
		element.addEventListener('pointermove', handlePointerMove, { passive: false });
		element.addEventListener('pointerup', handlePointerUp, { passive: false });

		return () => {
			element.removeEventListener('pointerdown', handlePointerDown);
			element.removeEventListener('pointermove', handlePointerMove);
			element.removeEventListener('pointerup', handlePointerUp);
		};
	}, [handlePointerDown, handlePointerMove, handlePointerUp]);

	return { isDragging };
};

/**
 * ブロックのリサイズを監視するカスタムフック
 */
const useBlockResize = (blockRef: React.RefObject<HTMLDivElement | null>, onResize: (size: Size) => void) => {
	useEffect(() => {
		const resizeObserver = new ResizeObserver((entries) => {
			for (const entry of entries) {
				if (entry.target === blockRef.current) {
					requestAnimationFrame(() => {
						const rect = entry.contentRect;
						onResize({
							width: rect.width,
							height: rect.height + 8
						});
					});
				}
			}
		});

		if (blockRef.current) {
			resizeObserver.observe(blockRef.current);
		}

		return () => {
			resizeObserver.disconnect();
		};
	}, [onResize]);
};

interface BlockProps {
	id: string;
	type: 'block' | 'drag';
	initialPosition?: { x: number; y: number };
	onEnd?: (position: { x: number; y: number }) => void;
}

/**
 * ブロックコンポーネント
 */
const Block: React.FC<BlockProps> = ({ id, type, initialPosition, onEnd }) => {
	const { setDraggingBlock, clearDraggingBlock } = draggingStore();
	const blockStore = BlockStore.getInstance();
	const canvasStore = CanvasStore.getInstance();
	const blockRef = useRef<HTMLDivElement>(null);

	// ブロックの状態
	const [blockContent, setBlockContent] = useState(blockStore.getBlock(id) || defaultBlock);
	const [size, setSize] = useState(blockContent.size);
	const [isFlag, setIsFlag] = useState(blockContent.type === 'flag');

	// ドラッグ用の位置状態
	const [position, setPosition] = useState({
		x: type === 'drag' && initialPosition ? initialPosition.x : blockContent.position.x,
		y: type === 'drag' && initialPosition ? initialPosition.y : blockContent.position.y
	});

	// ブロックとブロックの接続を処理
	const handleConnect = useCallback(() => {
		let connected = false;
		const inputs = document.querySelectorAll('.input');
		const outputs = document.querySelectorAll('.output');

		outputs.forEach((output) => {
			const targetID = (output as HTMLElement).dataset.id;
			if (!targetID || targetID === blockContent.id || blockStore.getBlock(targetID)?.childId)
				return;

			inputs.forEach((input) => {
				const rect1 = output.getBoundingClientRect();
				const rect2 = input.getBoundingClientRect();

				const tolerance = 20;
				const isOverlapping = !(
					rect1.right < rect2.left - tolerance ||
					rect1.left > rect2.right + tolerance ||
					rect1.bottom < rect2.top - tolerance ||
					rect1.top > rect2.bottom + tolerance
				);

				if (isOverlapping) {
					const targetBlock = blockStore.getBlock(targetID);

					if (targetBlock && targetBlock.type === 'loop') {
						if (targetBlock.enclose) {
							blockStore.updateBlock(targetBlock.id, {
								enclose: {
									...targetBlock.enclose,
									contents: [...targetBlock.enclose.contents, blockContent]
								}
							});
						} else {
							blockStore.updateBlock(targetBlock.id, {
								enclose: {
									offset: { x: 0, y: 0 },
									connections: {
										output: { x: 0, y: 0 }
									},
									contents: [blockContent]
								}
							});
						}
					} else {
						blockStore.updateBlock(blockContent.id, { parentId: targetID });
						blockStore.updateBlock(targetID, { childId: blockContent.id });
					}

					updateConnectedPosition(targetID);
					connected = true;
				}
			});
		});

		return connected;
	}, [blockContent, blockStore]);

	const handleDragStart = useCallback(
		(_e: PointerEvent, offset: Position) => {
			setDraggingBlock(blockContent.id, offset);

			if (blockContent.parentId) {
				const parentBlock = blockStore.getBlock(blockContent.parentId);
				if (parentBlock) {
					blockStore.updateBlock(blockContent.id, { parentId: '' });
					blockStore.updateBlock(parentBlock.id, { childId: '' });
				}
			}
		},
		[blockContent.id, blockContent.parentId, blockStore, setDraggingBlock]
	);

	const handleDragEnd = useCallback(
		(e: PointerEvent, finalPosition: Position) => {
			const elements = document.elementsFromPoint(e.clientX, e.clientY);
			const shouldRemove = elements.some(
				(element) => element.classList.contains('trash') || element.classList.contains('block-list')
			);

			if (shouldRemove) {
				blockStore.removeBlock(blockContent.id);
				clearDraggingBlock();
				return;
			}

			const connected = handleConnect();

			if (!connected) {
				const canvasPos = canvasStore.getCanvasPos();
				blockStore.updateBlock(blockContent.id, {
					position: {
						x: finalPosition.x - 250 - canvasPos.x,
						y: finalPosition.y - 50 - canvasPos.y
					}
				});
				blockStore.updateZIndex(blockContent.id);
			}

			if (onEnd) {
				onEnd(finalPosition);
			}

			clearDraggingBlock();
		},
		[blockContent.id, blockStore, canvasStore, clearDraggingBlock, handleConnect, onEnd]
	);

	const updateConnectedPosition = useCallback(
		(parentId: string) => {
			const parentBlock = blockStore.getBlock(parentId);
			if (!parentBlock) return;

			if (parentBlock.enclose && parentBlock.type === 'loop') {
				blockStore.updateBlock(blockContent.id, {
					position: {
						x: parentBlock.position.x + parentBlock.enclose.offset.x,
						y: parentBlock.position.y + 42
					}
				});
			} else {
				blockStore.updateBlock(blockContent.id, {
					position: {
						x: parentBlock.position.x,
						y: parentBlock.position.y + 42
					}
				});
			}
		},
		[blockContent.id, blockStore]
	);

	const handleResize = useCallback(
		(newSize: Size) => {
			if (newSize.width !== size.width || newSize.height !== size.height) {
				blockStore.updateBlock(blockContent.id, {
					size: newSize
				});
				setSize(newSize);
			}
		},
		[blockContent.id, blockStore, size.height, size.width]
	);

	// フラグブロックの出力フォーマット処理
	const formatOutput = useCallback(() => {
		const searchAllChildren = (blockId: string) => {
			const children: BlockType[] = [];
			blockStore.getBlocks().idList.forEach((id) => {
				const block = blockStore.getBlock(id);
				if (block?.parentId === blockId) {
					children.push(block);
					children.push(...searchAllChildren(block.id));
				}
			});
			return children;
		};

		const children = searchAllChildren(blockContent.id);
		const outputText = [blockContent, ...children]
			.map((block) => {
				let output = block.output;

				if (block.type === 'loop' && block.enclose) {
					const encloseOutput = block.enclose.contents
						.map((contentBlock) => {
							let contentOutput = contentBlock.output;
							contentBlock.contents.forEach((content) => {
								if (content.type === 'value') {
									const regex = new RegExp(`\\$\\{${content.id}\\}`, 'g');
									contentOutput = contentOutput.replace(regex, content.content.value);
								}
							});
							return contentOutput;
						})
						.join('\n');

					output = output.replace('${&&}', '\n\t' + encloseOutput + '\n');
				}

				block.contents.forEach((content) => {
					if (content.type === 'value') {
						const regex = new RegExp(`\\$\\{${content.id}\\}`, 'g');
						output = output.replace(regex, content.content.value);
					}
				});

				return output;
			})
			.join('\n');

		blockStore.clearOutput();
		blockStore.setOutput(outputText);

		return outputText;
	}, [blockContent, blockStore]);

	// サイズ変更の監視を設定
	useBlockResize(blockRef, handleResize);

	// ドラッグ処理を設定（type関係なく常に設定）
	console.log('useBlockDrag');
	useBlockDrag(
		blockRef,
		blockContent,
		type,
		position,
		setPosition,
		handleDragStart,
		handleDragEnd
	);

	// ブロックの更新を監視
	useEffect(() => {
		return blockStore.subscribe((event) => {
			if (event.id === id && event.type === 'update' && event.block) {
				setBlockContent(event.block);
				if (event.block.size) {
					setSize(event.block.size);
				}
				setIsFlag(event.block.type === 'flag');
			}
		});
	}, [blockStore, id]);

	// ブロックのパスを取得
	const getBlockPath = useCallback(() => {
		return path(blockContent.type, size);
	}, [blockContent.type, size]);

	// 現在の位置を取得（typeに応じて切り替え）
	const getCurrentPosition = () => {
		return type === 'drag' ? position : blockContent.position;
	};

	const currentPosition = getCurrentPosition();

	// ブロックのレンダリング
	return (
		<div
			ref={blockRef}
			className="cancel"
			style={{
				position: type === 'drag' ? 'fixed' : 'absolute',
				zIndex: type === 'drag' ? 100 : blockContent.zIndex,
				left: currentPosition.x,
				top: currentPosition.y,
				filter:
					type === 'drag'
						? `drop-shadow(${ColorPalette[getColor(blockContent.type)].shadow})`
						: 'none',
				touchAction: 'none'
			}}
		>
			<div
				className="rel flex h:48px w:fit align-items:center justify-content:center r:6px px:10px pb:4px vertical:middle"
				data-id={blockContent.id}
			>
				{/* 入力コネクタ */}
				{blockContent.connections.input && (
					<span
						data-id={blockContent.id}
						className="input abs h:8px w:24px"
						style={{
							left: blockContent.connections.input.x,
							top: blockContent.connections.input.y
						}}
					></span>
				)}

				{/* 出力コネクタ */}
				{blockContent.connections.output && (
					<span
						data-id={blockContent.id}
						className="output abs h:8px w:24px"
						style={{
							bottom: blockContent.connections.output.y,
							left: blockContent.connections.output.x
						}}
					></span>
				)}

				{/* ブロック背景 */}
				<div className="abs left:0 top:0 z:-10 h:0 w:full">
					<svg
						className="pointer-events:none"
						height={size.height + 55}
						width={size.width + 2}
						role="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d={getBlockPath()}
							fill={ColorPalette[getColor(blockContent.type)].bg}
							stroke={ColorPalette[getColor(blockContent.type)].border}
							strokeWidth="2"
							style={{
								filter: `drop-shadow(0 4px 0 ${ColorPalette[getColor(blockContent.type)].border})`
							}}
						></path>
					</svg>
				</div>

				{/* ブロックコンテンツ */}
				<div
					className="flex h:full w:full flex:row align-items:center justify-content:center gap:16px vertical:middle"
					style={{
						color: ColorPalette[getColor(blockContent.type)].text
					}}
				>
					<div className="white-space:nowrap font:bold">{blockContent.title}</div>

					{/* フィールド */}
					<div className="flex flex:row gap:8px vertical:middle">
						{blockContent.contents.map((item, index) => (
							<React.Fragment key={index}>
								{item.type === 'separator' ? (
									<div className="h:20px w:1px bg:#172554"></div>
								) : (
									<div className="flex flex:row align-items:center justify-content:center gap:6px">
										<div className="white-space:nowrap">{item.content.title}</div>
										<div
											className="field flex h:full align-items:center justify-content:center rounded b:2px px:8px"
											style={{
												backgroundColor: ColorPalette[getColor(blockContent.type)].text,
												borderColor: ColorPalette[getColor(blockContent.type)].border
											}}
										>
											<AutoResizeInput
												initialValue={item.content.value}
												type="text"
												className="bg:transparent f:#0f172a outline:none:focus"
												onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
													blockStore.updateValue(blockContent.id, item.id, e.currentTarget.value);
												}}
											/>
										</div>
									</div>
								)}
							</React.Fragment>
						))}
					</div>

					{/* フラグアイコン */}
					{isFlag && (
						<button
							className="field flex align-items:center justify-content:center rounded b:2px p:4px"
							style={{
								backgroundColor: ColorPalette[getColor(blockContent.type)].text,
								borderColor: ColorPalette[getColor(blockContent.type)].border
							}}
							onClick={() => {
								if (type !== 'block') return;
								const output = formatOutput();
								navigator.clipboard.writeText(output).then((r) => r);
							}}
						>
							<Icon icon="ic:round-flag" className="field h:20px w:20px f:#4ade80" />
						</button>
					)}
				</div>
			</div>
		</div>
	);
};

export default Block;
