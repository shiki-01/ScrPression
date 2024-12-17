import { Icon } from '@iconify/react';
import { BlockType } from '$lib/type/block';
import { ColorPalette, getColor } from '$lib/utils/color';
import React, { useEffect, useRef, useState } from 'react';
import { useBlocksStore } from '$lib/store';

interface DragProps {
	content: BlockType;
	initialPosition: { x: number; y: number };
	onEnd: (position: { x: number; y: number }) => void;
}

const Drag: React.FC<DragProps> = ({ content, initialPosition, onEnd }) => {
	const [position, setPosition] = useState(initialPosition);
	const blockRef = useRef<HTMLDivElement>(null);
	const isDragging = useRef(true);
	const { updateContent, removeContent, draggingBlock, clearDraggingBlock } = useBlocksStore();

	useEffect(() => {
		const onMouseMove = (event: MouseEvent) => {
			if (!isDragging.current) return;

			const offset = draggingBlock!.offset;
			const newPosition = {
				x: event.clientX - offset.x,
				y: event.clientY - offset.y
			};
			setPosition(newPosition);
		};

		const onMouseUp = (event: MouseEvent) => {
			if (!isDragging.current || !draggingBlock) return;

			isDragging.current = false;
			const finalPosition = {
				x: event.clientX - draggingBlock.offset.x - 250,
				y: event.clientY - draggingBlock.offset.y - 50
			};

			const elements = document.elementsFromPoint(event.clientX, event.clientY);
			const shouldRemove = elements.some(
				(element) => element.classList.contains('trash') || element.classList.contains('block-list')
			);

			if (shouldRemove) {
				removeContent(content.id);
			} else {
				updateContent(content.id, { position: finalPosition });
				onEnd(finalPosition);
			}

			clearDraggingBlock();
			window.removeEventListener('mousemove', onMouseMove);
			window.removeEventListener('mouseup', onMouseUp);
		};

		window.addEventListener('mousemove', onMouseMove);
		window.addEventListener('mouseup', onMouseUp);

		return () => {
			window.removeEventListener('mousemove', onMouseMove);
			window.removeEventListener('mouseup', onMouseUp);
		};
	}, [content.id, onEnd]);

	const [width, setWidth] = useState(200);
	const [height, setHeight] = useState(58);
	const [isFlag, setIsFlag] = useState(false);

	useEffect(() => {
		setIsFlag(content.type === 'flag');
	}, [content.type]);

	const updateSize = () => {
		if (blockRef.current) {
			setWidth(blockRef.current.offsetWidth);
			setHeight(blockRef.current.offsetHeight + 8);
		}
	};

	useEffect(() => {
		updateSize();
	}, []);

	return (
		<div
			ref={blockRef}
			className="cancel fixed"
			style={{ zIndex: content.zIndex, left: position.x, top: position.y }}
		>
			<div
				className="relative flex h-12 w-fit cursor-pointer items-center justify-center rounded-md px-2.5 pb-1 align-middle"
				data-id={content.id}
			>
				{content.connections.input && (
					<span
						data-id={content.id}
						className="input absolute h-2 w-6"
						style={{
							left: content.connections.input.x,
							top: content.connections.input.y
						}}
					></span>
				)}
				{content.connections.output && (
					<span
						data-id={content.id}
						className="output absolute h-2 w-6"
						style={{
							bottom: content.connections.output.x,
							top: content.connections.output.y
						}}
					></span>
				)}
				<div className="absolute left-0 top-0 -z-10 h-0 w-full">
					<svg
						className=""
						height={height}
						role="none"
						width={width + 2}
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d={
								isFlag
									? `M 14 2 L 42 2 L ${width - 14} 2 Q ${width} 2 ${width} 14 L ${width} ${height - 18} Q ${width} ${height - 14} ${width - 4} ${height - 14} L 40 ${height - 14} L 40 ${height - 10} Q 40 ${height - 8} 36 ${height - 8} L 20 ${height - 8} Q 16 ${height - 8} 16 ${height - 10} L 16 ${height - 14} L 4 ${height - 14} Q 2 ${height - 14} 2 ${height - 18} L 2 14 Q 2 2 14 2 Z`
									: `M 4 2 L 14 2 L 14 4 Q 14 8 20 8 L 38 8 Q 42 8 42 4 L 42 2 L ${width - 4} 2 Q ${width} 2 ${width} 4 L ${width} ${height - 18} Q ${width} ${height - 14} ${width - 4} ${height - 14} L 40 ${height - 14} L 40 ${height - 10} Q 40 ${height - 8} 36 ${height - 8} L 20 ${height - 8} Q 16 ${height - 8} 16 ${height - 10} L 16 ${height - 14} L 4 ${height - 14} Q 2 ${height - 14} 2 ${height - 18} L 2 4 Q 2 2 4 2 Z`
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
							<React.Fragment key={index}>
								{item.type === 'separator' ? (
									<div className="h-5 w-[1px] bg-blue-950"></div>
								) : (
									<div className="flex flex-row items-center justify-center gap-1.5">
										<div className="whitespace-nowrap">{item.content.title}</div>
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
													setWidth(blockRef.current!.offsetWidth);
												}}
											/>
										</div>
									</div>
								)}
							</React.Fragment>
						))}
					</div>
					{content.type === 'flag' && (
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

export default Drag;
