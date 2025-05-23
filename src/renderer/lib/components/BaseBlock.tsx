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
 * ブロックの接続を管理するカスタムフック
 * @param blockContent ブロックの内容
 * @param onConnect 接続時のコールバック
 * @returns 接続処理のハンドラ
 */
const useBlockConnections = (blockContent: BlockType, onConnect: (targetID: string) => void) => {
	// 要素の重なりを検出する関数
	const detectOverlap = useCallback((node: Element, target: Element) => {
		const nodeRect = node.getBoundingClientRect();
		const targetRect = target.getBoundingClientRect();
		return !(
			nodeRect.right < targetRect.left ||
			nodeRect.left > targetRect.right ||
			nodeRect.bottom < targetRect.top ||
			nodeRect.top > targetRect.bottom
		);
	}, []);

	// ドロップ時の接続処理
	const handleConnect = useCallback(
		() => {
			const inputs = document.querySelectorAll('.input');
			const outputs = document.querySelectorAll('.output');
			let connected = false;

			inputs.forEach((inputElement) => {
				outputs.forEach((outputElement) => {
					const targetID = (outputElement as HTMLElement).dataset.id;
					if (!targetID || targetID === blockContent.id) return;

					if (detectOverlap(outputElement, inputElement)) {
						onConnect(targetID);
						connected = true;
					}
				});
			});

			return connected;
		},
		[blockContent.id, detectOverlap, onConnect]
	);

	return { handleConnect };
};

/**
 * ブロックのドラッグ処理を管理するカスタムフック
 * @param blockRef ブロックの参照
 * @param blockContent ブロックの内容
 * @param onDragStart ドラッグ開始時のコールバック
 * @param onDragEnd ドラッグ終了時のコールバック
 */
const useBlockDrag = (
	blockRef: React.RefObject<HTMLElement | null>,
	blockContent: BlockType,
	onDragStart: (event: PointerEvent, offset: Position) => void,
	onDragEnd: (event: PointerEvent, position: Position) => void,
) => {
	const blockStore = BlockStore.getInstance();
	const canvasStore = CanvasStore.getInstance();
	const [isDragging, setIsDragging] = useState(false);
	const startPos = useRef({ x: 0, y: 0 });
	const dragOffset = useRef({ x: 0, y: 0 });

	// ポインターキャプチャを使用して、より安定したドラッグを実現
	const handlePointerDown = useCallback(
		(e: PointerEvent) => {
			if (e.button !== 0 || !blockRef.current) return; // 左クリックのみ処理

			const rect = blockRef.current.getBoundingClientRect();
			dragOffset.current = {
				x: e.clientX - rect.left,
				y: e.clientY - rect.top
			};

			startPos.current = {
				x: blockContent.position.x,
				y: blockContent.position.y
			};

			// ポインターキャプチャを設定（これにより他の要素にマウスが移動しても追跡可能）
			blockRef.current.setPointerCapture(e.pointerId);
			setIsDragging(true);

			if (onDragStart) {
				onDragStart(e, dragOffset.current);
			}

			e.stopPropagation();
			e.preventDefault();
		},
		[blockContent.position.x, blockContent.position.y, onDragStart]
	);

	const handlePointerMove = useCallback(
		(e: PointerEvent) => {
			if (!isDragging) return;

			const canvasPos = canvasStore.getCanvasPos();
			const newPosition = {
				x: e.clientX - dragOffset.current.x - canvasPos.x,
				y: e.clientY - dragOffset.current.y - canvasPos.y
			};

			// 位置の更新（実際のDOM更新はStateを通じて行う）
			blockStore.updateBlock(blockContent.id, {
				position: newPosition
			});

			// 子ブロックの位置も更新
			updateChildrenPositions(blockContent.id, {
				x: e.clientX - dragOffset.current.x,
				y: e.clientY - dragOffset.current.y
			});

			e.stopPropagation();
			e.preventDefault();
		},
		[isDragging, blockContent.id, canvasStore]
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

			// 子ブロックの位置を更新
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

			// Loop型の場合は内部ブロックも更新
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

		element.addEventListener('pointerdown', handlePointerDown);
		element.addEventListener('pointermove', handlePointerMove);
		element.addEventListener('pointerup', handlePointerUp);

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
 * @param blockRef ブロックの参照
 * @param onResize リサイズ時のコールバック
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
	}, [blockRef, onResize]);
};

interface BlockProps {
	id: string;
	type: 'block' | 'drag';
	initialPosition?: { x: number; y: number };
	onEnd?: (position: { x: number; y: number }) => void;
}

/**
 * ブロックコンポーネント
 * @param id ブロックのID
 * @param type ブロックの種類
 * @param initialPosition ドラッグ開始時の初期位置
 * @param onEnd ドラッグ終了時のコールバック
 */
const Block: React.FC<BlockProps> = ({ id, type, initialPosition, onEnd }) => {
	const { setDraggingBlock, clearDraggingBlock } = draggingStore();
	const blockStore = BlockStore.getInstance();
	const canvasStore = CanvasStore.getInstance();
	const blockRef = useRef(null);

	// ブロックの状態
	const [blockContent, setBlockContent] = useState(blockStore.getBlock(id) || defaultBlock);
	const [size, setSize] = useState(blockContent.size);
	const [isFlag, setIsFlag] = useState(blockContent.type === 'flag');

	// ドラッグ用の初期位置（ドラッグプレビュー用）
	const [position, setPosition] = useState({
		x: type === 'drag' && initialPosition ? initialPosition.x : 0,
		y: type === 'drag' && initialPosition ? initialPosition.y : 0
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

				// 重なりの検出に余裕を持たせる（px単位）
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
						// ループブロックの内部に配置
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
						// 通常の親子関係を設定
						blockStore.updateBlock(blockContent.id, { parentId: targetID });
						blockStore.updateBlock(targetID, { childId: blockContent.id });
					}

					// 接続後の位置調整
					updateConnectedPosition(targetID);
					connected = true;
				}
			});
		});

		return connected;
	}, [blockContent, blockStore]);

	// ブロックのドラッグ開始時のハンドラ
	const handleDragStart = useCallback(
		(_e: PointerEvent, offset: Position) => {
			setDraggingBlock(blockContent.id, offset);

			// 親子関係をリセット
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

	// ブロックのドラッグ終了時のハンドラ
	const handleDragEnd = useCallback(
		(e: PointerEvent, finalPosition: Position) => {
			// ゴミ箱や他のエリアにドロップされたかチェック
			const elements = document.elementsFromPoint(e.clientX, e.clientY);
			const shouldRemove = elements.some(
				(element) => element.classList.contains('trash') || element.classList.contains('block-list')
			);

			if (shouldRemove) {
				blockStore.removeBlock(blockContent.id);
				clearDraggingBlock();
				return;
			}

			// 接続の試行
			const connected = handleConnect();

			// 接続されなかった場合は位置を更新
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

	// 接続後の位置を調整
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

	// ブロックのサイズが変更されたときの処理
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

				// ループブロックの特殊処理
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

				// 変数置換
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

	// ドラッグタイプのブロックはドラッグ処理を追加
	if (type === 'drag') {
		// ドラッグハンドラを設定
		useBlockDrag(blockRef, blockContent, handleDragStart, handleDragEnd);
	}

	// ブロックのレンダリング
	return (
		<div
			ref={blockRef}
			className="cancel"
			style={{
				position: type === 'drag' ? 'fixed' : 'absolute',
				zIndex: type === 'drag' ? 100 : blockContent.zIndex,
				left: type === 'drag' ? position.x : blockContent.position.x,
				top: type === 'drag' ? position.y : blockContent.position.y,
				filter:
					type === 'drag'
						? `drop-shadow(${ColorPalette[getColor(blockContent.type)].shadow})`
						: 'none',
				touchAction: 'none' // ポインターイベント処理のためにタッチアクションを無効化
			}}
		>
			<div
				className="rel flex h:48px w:fit  align-items:center justify-content:center r:6px px:10px pb:4px vertical:middle"
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
					className="flex h:full w:full flex:row align-items:center justify-content:center  gap:16px vertical:middle"
					style={{
						color: ColorPalette[getColor(blockContent.type)].text
					}}
				>
					<div className="white-space:nowrap font:bold">{blockContent.title}</div>

					{/* フィールド */}
					<div className="flex flex:row  gap:8px vertical:middle">
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
