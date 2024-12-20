import { Icon } from '@iconify/react';
import { BlockType } from '$lib/block/type';
import { draggingStore, useBlocksStore } from '$lib/store';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DraggingStore } from '$lib/type/store';
import { ColorPalette, getColor } from '$lib/utils/color';
import useDrag from '$lib/utils/useDrag';
import { BlockStore } from '$lib/block/store';
import { path } from '$lib/utils/path';
import AutoResizeInput from '$lib/components/AutoResizeInput';

interface BlockProps {
	id: string;
}

const Block: React.FC<BlockProps> = ({ id }) => {
	const [isFlag, setIsFlag] = useState(false);
	const store = BlockStore.getInstance();

	const blockRef = useRef<HTMLDivElement>(null);
	const [content, setContent] = useState<BlockType>(store.getBlock(id)!);
	const [blockContent, setBlockContent] = useState<BlockType>(content);
	const [size, setSize] = useState(blockContent.size);

	useEffect(() => {
		const unsubscribe = store.subscribe((event) => {
			if (event.id === id) {
				switch (event.type) {
					case 'update':
						if (event.block) {
							const updatedBlock = event.block;
							setBlockContent(updatedBlock);
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
				store.updateBlock(blockContent.id, {
					size: { width: newWidth, height: newHeight }
				});
				const newBlock = store.getBlock(blockContent.id);
				if (newBlock) {
					setBlockContent(newBlock);
				}
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
		return path(isFlag, size);
	}, [size.width, size.height, isFlag]);

	const { draggingBlock, setDraggingBlock, clearDraggingBlock } = useBlocksStore();

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
	}, [blockContent.id]);

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

	function searchAllChildren(id: string) {
		const children: BlockType[] = [];
		store.getBlocks().idList.forEach((blockId) => {
			const block = store.getBlock(blockId);
			if (block?.parentId === id) {
				children.push(block);
				children.push(...searchAllChildren(block.id));
			}
		});
		return children;
	}

	const formatOutput = (blocks: BlockType[]) => {
		const outputText = blocks
			.filter((block) => block.type !== 'flag')
			.map((block) => {
				let blockOutput = block.output;
				block.contents.forEach((content) => {
					if (content.type === 'separator') {
						return;
					} else if (content.type === 'value') {
						const regex = new RegExp(`\\$\\{${content.id}\\}`, 'g');
						blockOutput = blockOutput.replace(regex, content.content.value);
					}
				});
				return blockOutput;
			})
			.join('\n');

		store.clearOutput();
		store.setOutput(outputText.trim());
	};

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
											className="field h-full flex items-center justify-center rounded-full border-2 px-2"
											style={{
												backgroundColor: ColorPalette[getColor(blockContent.type)].text,
												borderColor: ColorPalette[getColor(blockContent.type)].border
											}}
										>
											<AutoResizeInput
											initialValue={item.content.value}
												type="text"
												className="bg-transparent text-slate-900 focus:outline-none"
												onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
													const value = e.currentTarget.value;
													store.updateValue(blockContent.id, item.id, value);
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
							className="field flex items-center justify-center rounded-full border-2 p-1"
							style={{
								backgroundColor: ColorPalette[getColor(blockContent.type)].text,
								borderColor: ColorPalette[getColor(blockContent.type)].border
							}}
							onClick={() => {
								const children = searchAllChildren(content.id);
								formatOutput(children);
								window.navigator.clipboard.writeText(store.getOutput()).then((r) => r);
							}}
						>
							<Icon icon="ic:round-flag" className="field h-5 w-5 text-green-400" />
						</button>
					)}
				</div>
			</div>
		</div>
	);
};

export default Block;
