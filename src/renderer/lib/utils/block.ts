import { blockspace, output } from '$lib/stores';
import { workspace } from '$lib/stores/workspace';
import type { Block, WorkspaceState } from '$lib/types';
import { writable, type Writable } from 'svelte/store';
import { toast } from 'svelte-sonner';
import { HistoryManager } from '$lib/managers/HistoryManager';
import { BlockManager } from '$lib/managers/BlockManager';
import type { BlockType } from '$lib/block/type';

const timeoutState: Writable<boolean> = writable(false);
const offset = 40;

const addBlock = (content: Block) => {
	const newId = Math.random().toString(36).substring(7);
	let newCon = BlockManager.createBlock({...content, id: newId});
	workspace.blockUpdate(newId, newCon);
	HistoryManager.push();
};

const removeBlock = (blockId: string) => {
	const block = workspace.get().blocks.get(blockId) as Block;
	if (!block) return;

	if (block.parentId) {
		const parentBlock = workspace.get().blocks.get(block.parentId);
		if (parentBlock) {
			parentBlock.children = '';
		}
	}

	const removeChildren = (id: string) => {
		const childBlock = workspace.get().blocks.get(id) as Block;
		if (childBlock && childBlock.children) {
			removeChildren(childBlock.children);
		}
		workspace.delete(id);
	};

	removeChildren(blockId);

	workspace.get().blocks.forEach((b) => {
		updateBlockPositions(b.id);
	});

	workspace.delete(blockId);
	workspace.set({ ...workspace.get() });
	HistoryManager.push();
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
	const block = workspace.get().blocks.get(content.id) as Block;
	if (!block) return;

	updateChildrenPositions(block);
	updateZIndex(content.id);

	handleConnections(content);
};

const onDragStart = (content: Block) => {
	const block = workspace.get().blocks.get(content.id) as Block;
	if (!block) return;
	console.log('drag start', block, workspace.get().blocks);
	if (block.parentId) {
		timeoutState.set(true);
		const parentBlock = workspace.get().blocks.get(block.parentId);
		if (parentBlock) {
			parentBlock.children = '';
			workspace.blockUpdate(parentBlock.id, parentBlock);
		}
		block.parentId = '';
	}
	workspace.blockUpdate(content.id, block);
};

const onDragEnd = (
	event: { clientX: number; clientY: number },
	content: Block,
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
	HistoryManager.push();
};

const updateChildrenPositions = (block: Block) => {
	let currentBlock = block;
	let currentOffset = offset;

	while (currentBlock.children) {
		const childBlock = workspace.get().blocks.get(currentBlock.children);
		if (!childBlock) break;

		childBlock.position = {
			x: block.position.x,
			y: block.position.y + currentOffset
		};

		workspace.blockUpdate(childBlock.id, childBlock);
		currentBlock = childBlock;
		currentOffset += offset;
	}
};

const updateZIndex = (blockId: string) => {
	const blocks = Array.from(workspace.get().blocks.entries());
	const sortedBlocks = new Map(blocks.sort((a, b) => a[1].zIndex - b[1].zIndex));

	let currentIndex = 1;
	const updateBlockZIndex = (id: string) => {
		const block = sortedBlocks.get(id);
		if (!block) return;

		block.zIndex = currentIndex++;
		workspace.blockUpdate(id, block);

		if (block.children) {
			updateBlockZIndex(block.children);
		}
	};

	updateBlockZIndex(blockId);
	workspace.set({ ...workspace.get(), blocks: sortedBlocks });
};

const findRootBlock = (
	ws: WorkspaceState,
	blockId: string,
	visited: Set<string> = new Set()
): Block | null => {
	if (visited.has(blockId)) return null;

	const block = ws.blocks.get(blockId);
	if (!block) return null;

	visited.add(blockId);

	if (!block.parentId) return block;

	return findRootBlock(ws, block.parentId, visited);
};

const updateBlockPositions = (blockId: string) => {
	const block = workspace.get().blocks.get(blockId);
	if (!block) return;

	const updateChildrenPositions = (parentId: string, depth: number = 0) => {
		const parent = workspace.get().blocks.get(parentId);
		if (!parent?.children) return;

		const child = workspace.get().blocks.get(parent.children);
		if (!child) return;

		child.position = {
			x: parent.position.x,
			y: parent.position.y + 40 * (depth + 1)
		};
		child.depth = depth + 1;

		workspace.blockUpdate(child.id, child);
		updateChildrenPositions(child.id, depth + 1);
	};

	updateChildrenPositions(blockId);
	workspace.set({ ...workspace.get() });
};

const handleBlockConnection = (sourceId: string, targetId: string) => {
	const sourceBlock = structuredClone(workspace.get().blocks.get(sourceId));
	const targetBlock = structuredClone(workspace.get().blocks.get(targetId));

	if (!sourceBlock || !targetBlock) return false;
	if (sourceBlock.children || targetId === sourceId) return false;

	if (targetBlock.parentId) {
		const oldParent = workspace.get().blocks.get(targetBlock.parentId);
		if (oldParent) {
			oldParent.children = '';
			workspace.blockUpdate(oldParent.id, oldParent);
		}
	}

	sourceBlock.children = targetId;
	targetBlock.parentId = sourceId;

	targetBlock.position = {
		x: sourceBlock.position.x,
		y: sourceBlock.position.y + offset
	};

	workspace.blockUpdate(sourceId, sourceBlock);
	workspace.blockUpdate(targetId, targetBlock);

	updateBlockPositions(sourceId);
	updateZIndex(sourceId);

	return true;
};

const handleConnections = (content: BlockType) => {
	let space: HTMLElement | null = null;
	blockspace.subscribe((blockspace) => {
		space = blockspace;
	});

	if (!space) return;

	const inputs = (space as HTMLElement).querySelectorAll('.input');
	const outputs = (space as HTMLElement).querySelectorAll('.output');

	inputs.forEach((inputElement) => {
		outputs.forEach((outputElement) => {
			const targetID = (outputElement as HTMLElement).dataset.id;
			if (!targetID || targetID === content.id) return;

			if (overlap(outputElement as HTMLElement, inputElement as HTMLElement)) {
				handleBlockConnection(targetID, content.id);
				console.log('connected', targetID, content.id);
			}
		});
	});
};

const formatOutput = (blocks: Block[]) => {
	const outputText = blocks
		.filter((block) => block.type !== 'flag')
		.map((block) => {
			let blockOutput = block.output;
			block.contents.forEach((content) => {
				if (content === 'space') return;
				const regex = new RegExp(`\\$\\{${content.id}\\}`, 'g');
				blockOutput = blockOutput.replace(regex, content.value);
			});
			return blockOutput;
		})
		.join('\n');

	output.set(outputText.trim());
};

export {
	addBlock,
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
