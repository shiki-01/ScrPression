import React, { useCallback, useEffect, useRef, useState } from 'react';

import { Icon } from '@iconify/react';
import AutoResizeInput from '$lib/components/AutoResizeInput';

import { BlockType } from '$lib/block/type';
import { BlockStore } from '$lib/block/store';
import { draggingStore } from '$lib/store';

import { ColorPalette, getColor } from '$lib/utils/color';
import { path } from '$lib/utils/path';
import useDrag from '$lib/hooks/useDrag';

interface BlockProps {
	id: string;
	type: 'block' | 'drag';
	initialPosition?: { x: number; y: number };
	onEnd?: (position: { x: number; y: number }) => void;
}

const Block: React.FC<BlockProps> = ({ id, type, initialPosition, onEnd }) => {
	const { draggingBlock, setDraggingBlock, clearDraggingBlock, getDraggingBlock } = draggingStore();
	const store = BlockStore.getInstance();

	const content = store.getBlock(id) as BlockType;
	const blockRef = useRef<HTMLDivElement>(null);
	const [blockContent, setBlockContent] = useState<BlockType>(content);
	const [size, setSize] = useState(blockContent.size);
	const [isFlag, setIsFlag] = useState(false);
	const isDragging = useRef(true);
	const offset = draggingBlock ? draggingBlock.offset : { x: 0, y: 0 };
	const [position, setPosition] = useState({
		x: (type === 'drag' ? initialPosition!.x : 0) - offset.x,
		y: (type === 'drag' ? initialPosition!.y : 0) - offset.y
	});

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

	const getPath = useCallback(() => {
		return path(blockContent.type, size);
	}, [size.width, size.height, isFlag]);

	const searchAllChildren = (id: string) => {
		const children: BlockType[] = [];
		store.getBlocks().idList.forEach((blockId) => {
			const block = store.getBlock(blockId);
			if (block?.parentId === id) {
				children.push(block);
				children.push(...searchAllChildren(block.id));
			}
		});
		return children;
	};

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

	const overlap = (node: HTMLElement, target: HTMLElement) => {
		const nodeRect = node.getBoundingClientRect();
		const targetRect = target.getBoundingClientRect();
		return !(
			nodeRect.right < targetRect.left ||
			nodeRect.left > targetRect.right ||
			nodeRect.bottom < targetRect.top ||
			nodeRect.top > targetRect.bottom
		);
	};

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
					case 'remove': {
						const block = store.getBlock(id);
						if (block) {
							setBlockContent(block);
						}
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
	}, [id]);

	useEffect(() => {
		if (type !== 'drag') return;
		const onMouseMove = (event: PointerEvent) => {
			if (!isDragging.current) return;

			const newPosition = {
				x: event.clientX - offset.x,
				y: event.clientY - offset.y
			};

			if (store.getBlock(blockContent.id)?.parentId) {
				const parentBlock = store.getBlock(store.getBlock(blockContent.id)!.parentId) as BlockType;

				store.updateBlock(blockContent.id, { parentId: '' });
				store.updateBlock(parentBlock.id, { childId: '' });
			}

			if (store.getBlock(blockContent.id)?.childId) {
				let childId = store.getBlock(blockContent.id)!.childId;
				let offset = 42;

				const updateChildPosition = (id: string) => {
					const childBlock = store.getBlock(id) as BlockType;
					if (!childBlock) return;
					store.updateBlock(childBlock.id, {
						position: {
							x: newPosition.x - 250 - store.getCanvasPos().x,
							y: newPosition.y + offset - 50 - store.getCanvasPos().y
						}
					});
				};

				while (childId) {
					updateChildPosition(childId);
					childId = store.getBlock(childId)!.childId;
					offset += 42;
				}
			}

			setPosition(newPosition);
		};
		const onMouseUp = (event: PointerEvent) => {
			const newDraggingBlock = getDraggingBlock();
			if (!isDragging.current || !newDraggingBlock) return;

			isDragging.current = false;
			const finalPosition = {
				x: event.clientX - newDraggingBlock.offset.x - 250 - store.getCanvasPos().x,
				y: event.clientY - newDraggingBlock.offset.y - 50 - store.getCanvasPos().y
			};

			const elements = document.elementsFromPoint(event.clientX, event.clientY);
			const shouldRemove = elements.some(
				(element) => element.classList.contains('trash') || element.classList.contains('block-list')
			);

			if (shouldRemove) {
				store.removeBlock(blockContent.id);
			} else {
				const inputs = document.querySelectorAll('.input');
				const outputs = document.querySelectorAll('.output');

				inputs.forEach((inputElement) => {
					outputs.forEach((outputElement) => {
						const targetID = (outputElement as HTMLElement).dataset.id;
						if (!targetID || targetID === blockContent.id || store.getBlock(targetID)!.childId)
							return;

						if (overlap(outputElement as HTMLElement, inputElement as HTMLElement)) {
							store.updateBlock(blockContent.id, { parentId: targetID });
							store.updateBlock(targetID, { childId: blockContent.id });
						}
					});
				});
				if (store.getBlock(blockContent.id)?.parentId) {
					const parentBlock = store.getBlock(
						store.getBlock(blockContent.id)!.parentId
					) as BlockType;
					const parentPosition = {
						x: parentBlock.position.x,
						y: parentBlock.position.y
					};
					store.updateBlock(blockContent.id, {
						position: { x: parentPosition.x, y: parentPosition.y + 42 }
					});
				} else {
					store.updateBlock(blockContent.id, { position: finalPosition });
				}
				store.updateZIndex(blockContent.id);
				if (onEnd) {
					onEnd(finalPosition);
				}
			}

			clearDraggingBlock();
			window.removeEventListener('pointermove', onMouseMove);
			window.removeEventListener('pointerup', onMouseUp);
		};

		window.addEventListener('pointermove', onMouseMove);
		window.addEventListener('pointerup', onMouseUp);

		return () => {
			window.removeEventListener('pointermove', onMouseMove);
			window.removeEventListener('pointerup', onMouseUp);
		};
	}, [id, onEnd]);

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

	useEffect(() => {
		const block = blockContent;
		if (block && type === 'block') {
			blockContent.position.x = block.position.x;
			blockContent.position.y = block.position.y;
		}
	}, [id]);

	useEffect(() => {
		setIsFlag(blockContent.type === 'flag');
	}, [blockContent.type]);

	useEffect(() => {
		updateSize();
	}, []);

	if (type === 'block') {
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
	}

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
						: 'none'
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
					style={{
						color: ColorPalette[getColor(blockContent.type)].text
					}}
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
											className="field flex h-full items-center justify-center rounded-full border-2 px-2"
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
								if (type !== 'block') return;
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
