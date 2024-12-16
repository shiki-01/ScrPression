import { blockspace, output } from '$lib/stores';
import { writable, type Writable } from 'svelte/store';
import { toast } from 'svelte-sonner';
import type { BlockType } from '$lib/block/type';
import { BlockStore } from '$lib/block/store';

const timeoutState: Writable<boolean> = writable(false);
const offset = 40;
const blockStore = BlockStore.getInstance();

const removeBlock = (blockId: string) => {
	const block = blockStore.getBlock(blockId);
	if (!block) return;

	if (block.parentId) {
		const parentBlock = blockStore.getBlock(block.parentId) as BlockType;
		if (parentBlock) {
			parentBlock.childId = '';
			blockStore.updateBlock(parentBlock.id, parentBlock);
		}
	}

	const removeChildren = (id: string) => {
		const childBlock = blockStore.getBlock(id);
		if (childBlock && childBlock.childId) {
			removeChildren(childBlock.childId);
		}
		blockStore.removeBlock(id);
	};

	removeChildren(blockId);

	blockStore.getBlocks().forEach((b) => {
		updateBlockPositions(b.id);
	});

	blockStore.removeBlock(blockId);
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

const onDrag = (content: BlockType) => {
	const block = blockStore.getBlock(content.id) as BlockType;
	if (!block) return;

	updateChildrenPositions(block);
	updateZIndex(content.id);

	handleConnections(content);
};

const onDragStart = (content: BlockType) => {
	const block = blockStore.getBlock(content.id) as BlockType;
	if (!block) return;
	if (block.parentId) {
		timeoutState.set(true);
		const parentBlock = blockStore.getBlock(block.parentId) as BlockType;
		if (parentBlock) {
			blockStore.updateBlock(parentBlock.id, { childId: '' });
		}
		blockStore.updateBlock(block.id, { parentId: '' });
	}
};

const onDragEnd = (
	event: { clientX: number; clientY: number },
	content: BlockType,
	strict: boolean = true
) => {
	timeoutState.set(false);

	if (!strict) return;
	document.elementsFromPoint(event.clientX, event.clientY).forEach((element) => {
		if (element.classList.contains('trash') || element.classList.contains('block-list')) {
			removeBlock(content.id);
			toast.success('Block removed');
		}
	});
};

const updateChildrenPositions = (block: BlockType) => {
	let currentBlock = block;

	while (currentBlock.childId) {
		const childBlock = blockStore.getBlock(currentBlock.childId) as BlockType;
		if (!childBlock) break;

		blockStore.updateBlock(childBlock.id, {
			position: { x: currentBlock.position.x, y: currentBlock.position.y + offset },
		});
		currentBlock = childBlock;
	}
};

const updateZIndex = (blockId: string) => {
	const blocks = Array.from(blockStore.getBlocks().entries());
	const sortedBlocks = new Map(blocks.sort((a, b) => a[1].zIndex - b[1].zIndex));

	let currentIndex = 1;
	const updateBlockZIndex = (id: string) => {
		const block = sortedBlocks.get(id);
		if (!block) return;

		block.zIndex = currentIndex++;
		blockStore.updateBlock(block.id, block);

		if (block.childId) {
			updateBlockZIndex(block.childId);
		}
	};

	updateBlockZIndex(blockId);
};

const findRootBlock = (blockId: string, visited: Set<string> = new Set()): BlockType | null => {
	if (visited.has(blockId)) return null;

	const block = blockStore.getBlock(blockId);
	if (!block) return null;

	visited.add(blockId);

	if (!block.parentId) return block;

	return findRootBlock(block.parentId, visited);
};

const updateBlockPositions = (blockId: string) => {
	const block = blockStore.getBlock(blockId);
	if (!block) return;

	const updateChildrenPositions = (parentId: string, depth: number = 0) => {
		const parent = blockStore.getBlock(parentId);
		if (!parent?.childId) return;

		const child = blockStore.getBlock(parent.childId);
		if (!child) return;

		child.position = {
			x: parent.position.x,
			y: parent.position.y + 40 * (depth + 1)
		};
		child.depth = depth + 1;

		blockStore.updateBlock(child.id, child);
		updateChildrenPositions(child.id, depth + 1);
	};

	updateChildrenPositions(blockId);
	blockStore.updateBlock(blockId, block);
};

const handleBlockConnection = (sourceId: string, targetId: string) => {
	const sourceBlock = structuredClone(blockStore.getBlock(sourceId));
	const targetBlock = structuredClone(blockStore.getBlock(targetId));

	if (!sourceBlock || !targetBlock) return false;
	if (sourceBlock.childId || targetId === sourceId) return false;

	if (targetBlock.parentId) {
		const oldParent = blockStore.getBlock(targetBlock.parentId);
		if (oldParent) {
			oldParent.childId = '';
			blockStore.updateBlock(oldParent.id, oldParent);
		}
	}

	sourceBlock.childId = targetId;
	targetBlock.parentId = sourceId;

	blockStore.updateBlock(sourceId, sourceBlock);
	blockStore.updateBlock(targetId, targetBlock);
	console.log('connected', sourceBlock, targetBlock);

	updateBlockPositions(sourceId);
	updateZIndex(sourceId);

	return true;
};

const handleConnections = (content: BlockType) => {
	let space: HTMLElement | null = null;
	blockspace.subscribe((blockspace) => {
		space = blockspace;
	});

	let isTimeout: boolean = false;
	timeoutState.subscribe((state) => {
		isTimeout = state;
	});

	if (!space || isTimeout) return;

	const inputs = (space as HTMLElement).querySelectorAll('.input');
	const outputs = (space as HTMLElement).querySelectorAll('.output');

	inputs.forEach((inputElement) => {
		outputs.forEach((outputElement) => {
			const targetID = (outputElement as HTMLElement).dataset.id;
			if (!targetID || targetID === content.id) return;

			if (overlap(outputElement as HTMLElement, inputElement as HTMLElement)) {
				handleBlockConnection(targetID, content.id);
			}
		});
	});
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

	output.set(outputText.trim());
};

export {
	removeBlock,
	formatOutput,
	onDrag,
	onDragStart,
	onDragEnd,
	updateBlockPositions,
	findRootBlock,
	handleBlockConnection,
	handleConnections,
	updateZIndex
};
