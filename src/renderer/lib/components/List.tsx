import { BlockType } from '$lib/block/type';
import { Icon } from '@iconify/react';
import { ColorPalette, getColor } from '$lib/utils/color';
import React, { useEffect, useRef, useState } from 'react';
import { useBlocksStore } from '$lib/store';
import { BlockStore } from '$lib/block/store';

interface ListProps {
	content: BlockType;
}

const List: React.FC<ListProps> = ({ content }) => {
	const [listWidth, setListWidth] = useState(200);
	const [listHeight, setListHeight] = useState(58);
	const [isFlag, setIsFlag] = useState(false);

	const { draggingBlock, setDraggingBlock, getDraggingBlock, clearDraggingBlock } =
		useBlocksStore();

	const blockRef = useRef<HTMLDivElement>(null);

	const [isDragging, setIsDragging] = useState(false);
	const blockAddedRef = useRef(false);

	useEffect(() => {
		setIsFlag(content.type === 'flag');
	}, [content.type]);

	const addBlock = (event: PointerEvent) => {
		const blockStore = BlockStore.getInstance()
		cons;t newId = blockStore.addBlock(content)
		cons;t offset = blockRef.current!.getBoundingClientRect();
		setDraggingBlock(newId, { x: event.clientX - offset.left, y: event.clientY - offset.top });
	};

	const handlePointerDown = () => {
		setIsDragging(true);
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
		setIsDragging(false);
	};

	const updateSize = () => {
		if (blockRef.current) {
			setListWidth(blockRef.current.offsetWidth);
			setListHeight(blockRef.current.offsetHeight + 8);
		}
	};

	useEffect(() => {
		updateSize();
	}, []);

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
				className="relative flex h-12 w-fit cursor-pointer items-center justify-center rounded-md px-2.5 pb-1 align-middle"
				data-id={content.id}
			>
				<div className="absolute left-0 top-0 -z-10 h-0 w-full">
					<svg
						className=""
						height={listHeight}
						role="none"
						width={listWidth + 2}
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d={
								isFlag
									? `M 14 2 L 42 2 L ${listWidth - 14} 2 Q ${listWidth} 2 ${listWidth} 14 L ${listWidth} ${listHeight - 18} Q ${listWidth} ${listHeight - 14} ${listWidth - 4} ${listHeight - 14} L 40 ${listHeight - 14} L 40 ${listHeight - 10} Q 40 ${listHeight - 8} 36 ${listHeight - 8} L 20 ${listHeight - 8} Q 16 ${listHeight - 8} 16 ${listHeight - 10} L 16 ${listHeight - 14} L 4 ${listHeight - 14} Q 2 ${listHeight - 14} 2 ${listHeight - 18} L 2 14 Q 2 2 14 2 Z`
									: `M 4 2 L 14 2 L 14 4 Q 14 8 20 8 L 38 8 Q 42 8 42 4 L 42 2 L ${listWidth - 4} 2 Q ${listWidth} 2 ${listWidth} 4 L ${listWidth} ${listHeight - 18} Q ${listWidth} ${listHeight - 14} ${listWidth - 4} ${listHeight - 14} L 40 ${listHeight - 14} L 40 ${listHeight - 10} Q 40 ${listHeight - 8} 36 ${listHeight - 8} L 20 ${listHeight - 8} Q 16 ${listHeight - 8} 16 ${listHeight - 10} L 16 ${listHeight - 14} L 4 ${listHeight - 14} Q 2 ${listHeight - 14} 2 ${listHeight - 18} L 2 4 Q 2 2 4 2 Z`
							}
							fill={ColorPalette[getColor(content.type)].bg}
							stroke={ColorPalette[getColor(content.type)].border}
							strokeWidth="2"
							style={{
								filter: `drop-shadow(0 4px 0 ${ColorPalette[getColor(content.type)].border})`
							}}
						></path>
					</svg>
				</div>
				<div
					className="flex h-full w-full flex-row items-center justify-center gap-4 align-middle"
					style={{ color: ColorPalette[getColor(content.type)].text }}
				>
					<div className="whitespace-nowrap font-bold">{content.title}</div>
					<div className="flex flex-row gap-2 align-middle">
						{content.contents.map((item, index) => (
							<div key={index} className="flex flex-row items-center justify-center gap-1">
								{item.type === 'separator' ? (
									<div className="h-5 w-[1px] bg-blue-950"></div>
								) : (
									<>
										<div>{item.content.title}</div>
										<div
											className="flex items-center justify-center rounded-full border-2 px-2 focus:outline-none"
											style={{
												backgroundColor: ColorPalette[getColor(content.type)].text,
												borderColor: ColorPalette[getColor(content.type)].border
											}}
										>
											<input
												type="text"
												className="bg-transparent text-slate-900"
												style={{ width: `${item.content.value.length + 1}ch` }}
												onChange={(e) => {
													e.target.style.width = `${e.target.value.length + 1}ch`;
													setListWidth(blockRef.current!.offsetWidth);
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
							className="flex items-center justify-center rounded-full border-2 p-1"
							style={{
								backgroundColor: ColorPalette[getColor(content.type)].text,
								borderColor: ColorPalette[getColor(content.type)].border
							}}
						>
							<Icon icon="ic:round-flag" className="h-5 w-5 text-green-400" />
						</button>
					)}
				</div>
			</div>
		</div>
	);
};

export default List;
