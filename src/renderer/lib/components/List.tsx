import { BlockType } from '$lib/block/type';
import { Icon } from '@iconify/react';
import { ColorPalette, getColor } from '$lib/utils/color';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { draggingStore } from '$lib/store';
import { BlockStore } from '$lib/block/store';
import { ListStore } from '$lib/list/store';
import { path } from '$lib/utils/path';
import AutoResizeInput from '$lib/components/AutoResizeInput';

interface ListProps {
	id: string;
}

/**
 * List
 * @param id ID
 * @constructor List
 */
const List: React.FC<ListProps> = ({ id }) => {
	const listStore = ListStore.getInstance();
	const content = listStore.getList(id) as BlockType;
	const blockRef = useRef<HTMLDivElement>(null);
	const [blockContent, setBlockContent] = useState<BlockType>(listStore.getList(id) as BlockType);
	const [size, setSize] = useState(blockContent.size);
	const [isFlag, setIsFlag] = useState(false);

	const { setDraggingBlock } = draggingStore();

	// ドラッグ状態を管理するref
	const dragStateRef = useRef({
		isDragging: false,
		hasCreatedBlock: false,
		startPosition: { x: 0, y: 0 },
		blockId: ''
	});

	const updateSize = useCallback(() => {
		const store = ListStore.getInstance();
		if (blockRef.current) {
			const rect = blockRef.current.getBoundingClientRect();
			const newWidth = rect.width;
			const newHeight = rect.height + 8;

			if (newWidth !== size.width || newHeight !== size.height) {
				store.updateList(id, {
					size: { width: newWidth, height: newHeight }
				});
				const newBlock = store.getList(blockContent.id);
				if (newBlock) {
					setBlockContent(newBlock);
				}
			}
		}
	}, [blockContent.id, size]);

	const getPath = useCallback(() => {
		return path(blockContent.type, size);
	}, [blockContent.type, size]);

	useEffect(() => {
		setIsFlag(content.type === 'flag');
	}, [content.type]);

	useEffect(() => {
		const store = ListStore.getInstance();
		setSize(blockContent.size);

		const unsubscribe = store.subscribe((event) => {
			if (event.id === id && event.type === 'update') {
				if (event.block?.size) {
					setSize(event.block.size);
				}
			}
		});

		return () => {
			unsubscribe();
		};
	}, [id]);

	useEffect(() => {
		updateSize();
	}, [blockContent.contents, updateSize]);

	useEffect(() => {
		const resizeObserver = new ResizeObserver((entries) => {
			for (const entry of entries) {
				if (entry.target === blockRef.current) {
					requestAnimationFrame(() => {
						updateSize();
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
	}, [updateSize]);

	// ブロックを作成してドラッグ開始
	const createAndStartDrag = useCallback((event: PointerEvent) => {
		if (dragStateRef.current.hasCreatedBlock) return;

		const blockStore = BlockStore.getInstance();
		const newBlockId = blockStore.addBlock(content);

		if (!blockRef.current) return;

		// ブロックを作成時にドラッグ可能な位置に配置（重要：初期位置を画面座標で設定）
		blockStore.updateBlock(newBlockId, {
			position: {
				x: event.clientX ,
				y: event.clientY
			}
		});

		// ドラッグオフセットをブロックの中心に設定
		const rect = blockRef.current.getBoundingClientRect();
		setDraggingBlock(newBlockId, {
			x: event.clientX - rect.left,
			y: event.clientY - rect.top
		});

		dragStateRef.current = {
			isDragging: true,
			hasCreatedBlock: true,
			startPosition: { x: event.clientX, y: event.clientY },
			blockId: newBlockId
		};
	}, [content, setDraggingBlock]);

	// ポインターダウンイベントハンドラ
	const handlePointerDown = useCallback((event: React.PointerEvent) => {
		if (event.button !== 0) return; // 左クリックのみ

		// ドラッグ状態をリセット
		dragStateRef.current = {
			isDragging: false,
			hasCreatedBlock: false,
			startPosition: { x: event.clientX, y: event.clientY },
			blockId: ''
		};

		// イベントリスナーを追加
		const handlePointerMove = (moveEvent: PointerEvent) => {
			if (!dragStateRef.current.isDragging) {
				// 最小限の移動距離（5px）を超えた場合にドラッグ開始
				const deltaX = Math.abs(moveEvent.clientX - dragStateRef.current.startPosition.x);
				const deltaY = Math.abs(moveEvent.clientY - dragStateRef.current.startPosition.y);

				if (deltaX > 5 || deltaY > 5) {
					createAndStartDrag(moveEvent);
				}
			}
		};

		const handlePointerUp = () => {
			// イベントリスナーをクリーンアップ
			document.removeEventListener('pointermove', handlePointerMove);
			document.removeEventListener('pointerup', handlePointerUp);

			// ドラッグ状態をリセット
			dragStateRef.current = {
				isDragging: false,
				hasCreatedBlock: false,
				startPosition: { x: 0, y: 0 },
				blockId: ''
			};
		};

		// グローバルイベントリスナーを追加
		document.addEventListener('pointermove', handlePointerMove, { passive: false });
		document.addEventListener('pointerup', handlePointerUp, { passive: false });

		event.preventDefault();
		event.stopPropagation();
	}, [createAndStartDrag]);

	// クリーンアップ用のuseEffect
	useEffect(() => {
		return () => {
			// コンポーネントがアンマウントされる際にイベントリスナーをクリーンアップ
			document.removeEventListener('pointermove', () => { });
			document.removeEventListener('pointerup', () => { });
		};
	}, []);

	return (
		<div
			ref={blockRef}
			className="cancel"
			onPointerDown={handlePointerDown}
			role="button"
			style={{
				zIndex: content.zIndex,
				touchAction: 'none', // タッチデバイスでのスクロールを防止
				userSelect: 'none' // テキスト選択を防止
			}}
			tabIndex={0}
		>
			<div
				className="rel flex h:48px w:fit cursor:pointer align-items:center justify-content:center r:6px px:10px pb:4px vertical:middle"
				data-id={content.id}
			>
				<div className="abs left:0 top:0 z:-10 h:0 w:full">
					<svg
						className="pointer-events:none"
						height={size.height + 100}
						width={size.width + 2}
						role="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d={getPath()}
							fill={ColorPalette[getColor(blockContent.type)].bg}
							stroke={ColorPalette[getColor(blockContent.type)].border}
							strokeWidth="2"
							style={{
								filter: `drop-shadow(0 4px 0 ${ColorPalette[getColor(blockContent.type)].border})`
							}}
						></path>
					</svg>
				</div>
				<div
					className="flex h:full w:full flex:row align-items:center justify-content:center gap:16px vertical:middle"
					style={{ color: ColorPalette[getColor(content.type)].text }}
				>
					<div className="whitespace-nowrap font-bold">{content.title}</div>
					<div className="flex flex:row gap:8px vertical:middle">
						{content.contents.map((item, index) => (
							<div key={index} className="flex flex:row align-items:center justify-content:center gap:4px">
								{item.type === 'separator' ? (
									<div className="h:20px w:1px bg:#172554"></div>
								) : (
									<>
										<div>{item.content.title}</div>
										<div
											className="flex align-items:center justify-content:center rounded b:2px px:8px outline:none:focus"
											style={{
												backgroundColor: ColorPalette[getColor(content.type)].text,
												borderColor: ColorPalette[getColor(content.type)].border
											}}
										>
											<AutoResizeInput
												initialValue={item.content.value}
												type="text"
												className="bg:transparent fg:#0f172a outline:none:focus"
												onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
													// 必要に応じて値の更新処理を追加
													console.log('Input changed:', e.target.value);
												}}
											/>
										</div>
									</>
								)}
							</div>
						))}
					</div>
					{isFlag && (
						<button
							className="flex align-items:center justify-content:center rounded b:2px p:4px"
							style={{
								backgroundColor: ColorPalette[getColor(content.type)].text,
								borderColor: ColorPalette[getColor(content.type)].border
							}}
							onClick={(e) => {
								e.stopPropagation(); // ボタンクリックがドラッグイベントを起動しないようにする
							}}
						>
							<Icon icon="ic:round-flag" className="h:20px w:20px f:#4ade80" />
						</button>
					)}
				</div>
			</div>
		</div>
	);
};

export default List;
