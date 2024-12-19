import { Icon } from '@iconify/react';
import { BlockType } from '$lib/block/type';
import { draggingStore, useBlocksStore } from '$lib/store';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DraggingStore } from '$lib/type/store';
import { ColorPalette, getColor } from '$lib/utils/color';
import useDrag from '$lib/utils/useDrag';
import { BlockStore } from '$lib/block/store';

interface BlockProps {
	id: string;
}

const Block: React.FC<BlockProps> = ({ id }) => {
	const [isFlag, setIsFlag] = useState(false);
	const store = BlockStore.getInstance();

	const blockRef = useRef<HTMLDivElement>(null);
	const [content, setContent] = useState<BlockType>(store.getBlock(id)!);
	const [blockContent, setBlockContent] = useState<BlockType>(content);

	useEffect(() => {
		const unsubscribe = store.subscribe((event) => {
			if (event.id === id) {
				switch (event.type) {
					case 'update':
						if (event.block) {
							const updatedBlock = event.block;
							setBlockContent(updatedBlock);
							console.log(blockContent);
						}
						break;
				}
			} else {
				switch (event.type) {
					case 'remove':
						const block = store.getBlock(id);
						if (block) {
							setBlockContent(block);
						}
				}
			}
		});

		return () => {
			unsubscribe();
		};
	}, [id]);

	const [size, setSize] = useState(blockContent.size);

	useEffect(() => {
		const store = BlockStore.getInstance();

		setSize(blockContent.size);

		const unsubscribe = store.subscribe((event) => {
			if (event.id === blockContent.id && event.type === 'update') {
				if (event.block?.size) {
					setSize(event.block.size);
				}
			}
		});

		return () => {
			unsubscribe();
		};
	}, [blockContent.id]);

	const updateSize = useCallback(() => {
		if (blockRef.current) {
			const rect = blockRef.current.getBoundingClientRect();
			const newWidth = rect.width;
			const newHeight = rect.height + 8;

			if (newWidth !== size.width || newHeight !== size.height) {
				console.log(newWidth, newHeight);
				store.updateBlock(blockContent.id, {
					size: { width: newWidth, height: newHeight }
				});
				console.log(store.getBlock(blockContent.id));
				const newBlock = store.getBlock(blockContent.id);
				if (newBlock) {
					setBlockContent(newBlock);
				}
				console.log(blockContent.size);
			}
		}
	}, [blockContent.id, size]);

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

	const getPath = useCallback(() => {
		return isFlag
			? `M 14 2 L 42 2 L ${size.width - 14} 2 Q ${size.width} 2 ${size.width} 14 L ${size.width} ${size.height - 18} Q ${size.width} ${size.height - 14} ${size.width - 4} ${size.height - 14} L 40 ${size.height - 14} L 40 ${size.height - 10} Q 40 ${size.height - 8} 36 ${size.height - 8} L 20 ${size.height - 8} Q 16 ${size.height - 8} 16 ${size.height - 10} L 16 ${size.height - 14} L 4 ${size.height - 14} Q 2 ${size.height - 14} 2 ${size.height - 18} L 2 14 Q 2 2 14 2 Z`
			: `M 4 2 L 14 2 L 14 4 Q 14 8 20 8 L 38 8 Q 42 8 42 4 L 42 2 L ${size.width - 4} 2 Q ${size.width} 2 ${size.width} 4 L ${size.width} ${size.height - 18} Q ${size.width} ${size.height - 14} ${size.width - 4} ${size.height - 14} L 40 ${size.height - 14} L 40 ${size.height - 10} Q 40 ${size.height - 8} 36 ${size.height - 8} L 20 ${size.height - 8} Q 16 ${size.height - 8} 16 ${size.height - 10} L 16 ${size.height - 14} L 4 ${size.height - 14} Q 2 ${size.height - 14} 2 ${size.height - 18} L 2 4 Q 2 2 4 2 Z`;
	}, [size.width, size.height, isFlag]);

	const { updateContent, getBlock, draggingBlock, setDraggingBlock, clearDraggingBlock } =
		useBlocksStore();

	useDrag(blockRef, {
		bounds: 'parent',
		position: { x: blockContent.position.x, y: blockContent.position.y },
		content: blockContent,
		onDrag: () => {},
		onStart: (event) => {
			const offset = blockRef.current!.getBoundingClientRect();
			setDraggingBlock(blockContent.id, {
				x: event.clientX - offset.left,
				y: event.clientY - offset.top
			});
		},
		onEnd: (event) => {
			const finalPosition = {
				x: event.clientX - draggingBlock!.offset.x,
				y: event.clientY - draggingBlock!.offset.y
			};
			store.updateBlock(blockContent.id, { position: finalPosition });
			clearDraggingBlock();
		}
	});

	useEffect(() => {
		const block = blockContent;
		if (block) {
			blockContent.position.x = block.position.x;
			blockContent.position.y = block.position.y;
		}
	}, [getBlock, blockContent.id]);

	useEffect(() => {
		const unsubscribe = draggingStore.subscribe((state: DraggingStore) => {});

		return () => {
			unsubscribe();
		};
	}, [blockContent.id]);

	useEffect(() => {
		setIsFlag(blockContent.type === 'flag');
	}, [blockContent.type]);

	useEffect(() => {
		updateSize();
	}, []);

	return (
		<div
			ref={blockRef}
			className="cancel absolute"
			style={{
				zIndex: blockContent.zIndex,
				left: blockContent.position.x,
				top: blockContent.position.y
			}}
		>
			<div
				className="relative flex h-12 w-fit cursor-pointer items-center justify-center rounded-md px-2.5 pb-1 align-middle"
				data-id={blockContent.id}
			>
				{blockContent.connections.input && (
					<span
						data-id={blockContent.id}
						className="input absolute h-2 w-6"
						style={{
							left: blockContent.connections.input.x,
							top: blockContent.connections.input.y
						}}
					></span>
				)}
				{blockContent.connections.output && (
					<span
						data-id={blockContent.id}
						className="output absolute h-2 w-6"
						style={{
							bottom: blockContent.connections.output.y,
							left: blockContent.connections.output.x
						}}
					></span>
				)}
				<div className="absolute left-0 top-0 -z-10 h-0 w-full">
					<svg
						className=""
						height={size.height}
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
					className="flex h-full w-full flex-row items-center justify-center gap-4 align-middle"
					style={{ color: ColorPalette[getColor(blockContent.type)].text }}
				>
					<div className="whitespace-nowrap font-bold">{blockContent.title}</div>
					<div className="flex flex-row gap-2 align-middle">
						{blockContent.contents.map((item, index) => (
							<React.Fragment key={index}>
								{item.type === 'separator' ? (
									<div className="h-5 w-[1px] bg-blue-950"></div>
								) : (
									<div className="flex flex-row items-center justify-center gap-1.5">
										<div className="whitespace-nowrap">{item.content.title}</div>
										<div
											className="flex items-center justify-center rounded-full border-2 px-2 focus:outline-none"
											style={{
												backgroundColor: ColorPalette[getColor(blockContent.type)].text,
												borderColor: ColorPalette[getColor(blockContent.type)].border
											}}
										>
											<input
												type="text"
												className="bg-transparent text-slate-900"
												style={{ width: `${item.content.value.length + 1}ch` }}
												onChange={(e) => {
													e.target.style.width = `${e.target.value.length + 1}ch`;
												}}
											/>
										</div>
									</div>
								)}
							</React.Fragment>
						))}
					</div>
					{isFlag && (
						<button
							className="flex items-center justify-center rounded-full border-2 p-1"
							style={{
								backgroundColor: ColorPalette[getColor(blockContent.type)].text,
								borderColor: ColorPalette[getColor(blockContent.type)].border
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

export default Block;
