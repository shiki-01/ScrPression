import React, { PointerEventHandler, useCallback, useEffect, useRef, useState } from 'react';
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
	initialPosition?: { x: number; y: number };
	onEnd?: (position: { x: number; y: number }) => void;
}

/**
 * ブロックコンポーネント
 */
const Block: React.FC<BlockProps> = ({ id, initialPosition, onEnd }) => {
	const { getDraggingBlock, clearDraggingBlock } = draggingStore();
	const blockStore = BlockStore.getInstance();
	const canvasStore = CanvasStore.getInstance();
	const blockRef = useRef<HTMLDivElement>(null);
	const initialized = useRef(false);

	// ブロックの状態
	const [blockContent, setBlockContent] = useState(blockStore.getBlock(id) || defaultBlock);
	const [size, setSize] = useState(blockContent.size);
	const [isFlag, setIsFlag] = useState(blockContent.type === 'flag');

	const [position, setPosition] = useState(blockContent.position || { x: 0, y: 0 });
	const [isDragging, setIsDragging] = useState(true); // マウント時点でドラッグ状態
	const [isPlaced, setIsPlaced] = useState(false);
	const [draggingOffset, setDraggingOffset] = useState<Position>({ x: 0, y: 0 });

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

	useEffect(() => {
		// 新しいブロックの場合は初期化状態をリセット
		const draggingBlock = getDraggingBlock();
		if (draggingBlock?.id === id) {
			initialized.current = false;
		}
	}, [id]);

	useEffect(() => {
		console.log('initialize', initialPosition, initialized.current, isDragging, getDraggingBlock(), BlockStore.getInstance().getBlock(id));

		const draggingBlock = getDraggingBlock();
		const isMyBlock = draggingBlock?.id === id;

		// より厳密な条件チェック
		if (initialPosition &&
			!initialized.current &&
			isMyBlock &&
			initialPosition.x !== undefined &&
			initialPosition.y !== undefined) {

			const offset = draggingBlock?.offset || { x: 0, y: 0 };
			setDraggingOffset(offset);
			const newPosition = {
				x: initialPosition.x - offset.x,
				y: initialPosition.y - offset.y
			};
			setPosition(newPosition);
			initialized.current = true;
			setIsDragging(true);
			console.log('Block initialized with position:', newPosition);
		}
	}, [initialPosition, id]);


	// ポインターダウンイベント（配置後のドラッグ開始用）
	const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
		if (isPlaced && blockRef.current) {
			const newPosition = {
				x: position.x + 250,
				y: position.y + 50
			}
			setPosition(newPosition);
			setIsDragging(true);
			event.preventDefault();
		}
	};

	// ポインタームーブイベント
	const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
		if (isDragging) {
			const newPosition = {
				x: event.clientX - draggingOffset.x,
				y: event.clientY - draggingOffset.y
			};
			setPosition(newPosition);
		}
	};

	// ポインターアップイベント
	const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
		if (isDragging) {
			setIsDragging(false);
			setIsPlaced(true);
			// 最終位置を設定
			const newPosition = {
				x: event.clientX - 250 - draggingOffset.x,
				y: event.clientY - 50 - draggingOffset.y
			};
			setPosition(newPosition);

			if (onEnd) {
				onEnd(newPosition);
			}
		}
	};

	// ブロックのレンダリング
	return (
		<div
			ref={blockRef}
			className="cancel"
			style={{
				position: isDragging ? 'fixed' : 'absolute',
				zIndex: 100,
				left: position.x,
				top: position.y,
				filter:
					isDragging
						? `drop-shadow(${ColorPalette[getColor(blockContent.type)].shadow})`
						: 'none',
				touchAction: 'none',
				transform: isDragging ? 'translateY(-1px)' : 'none',
				transition: 'transform 0.2s ease, filter 0.1s ease',
			}}
			onPointerMove={handlePointerMove}
			onPointerUp={handlePointerUp}
		>
			<div
				onPointerDown={handlePointerDown}
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
								if (isDragging) return;
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
