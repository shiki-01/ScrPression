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

	const blockAddedRef = useRef(false);

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
	}, [size.width, size.height, isFlag]);

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

	const addBlock = (event: PointerEvent) => {
		const blockStore = BlockStore.getInstance();
		const newId = blockStore.addBlock(content);
		const offset = blockRef.current!.getBoundingClientRect();
		setDraggingBlock(newId, { x: event.clientX - offset.left, y: event.clientY - offset.top });
	};

	const handlePointerDown = () => {
		blockAddedRef.current = false;
		window.addEventListener('pointermove', handlePointerMove);
		window.addEventListener('pointerup', handlePointerUp);
	};

	const handlePointerMove = (event: PointerEvent) => {
		if (!blockAddedRef.current) {
			addBlock(event);
			blockAddedRef.current = true;
		}
	};

	const handlePointerUp = () => {
		window.removeEventListener('pointermove', handlePointerMove);
		window.removeEventListener('pointerup', handlePointerUp);
	};

	return (
		<div
			ref={blockRef}
			className="cancel"
			onPointerDown={handlePointerDown}
			role="button"
			style={{ zIndex: content.zIndex }}
			tabIndex={0}
		>
			<div
				className="rel flex h:48px w:fit cursor:pointer align-items:center justify-content:center r:6px px:10px pb:4px vertical:middle"
				data-id={content.id}
			>
				<div className="abs left:0 top:0 z:-10 h:0 w:full">
					<svg
						className=""
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
					className="flex h:full w:full flex:row align-items:center justify-content:center  gap:16px vertical:middle"
					style={{ color: ColorPalette[getColor(content.type)].text }}
				>
					<div className="whitespace-nowrap font-bold">{content.title}</div>
					<div className="flex flex:row  gap:8px vertical:middle">
						{content.contents.map((item, index) => (
							<div key={index} className="flex flex:row align-items:center justify-content:center  gap:4px">
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
