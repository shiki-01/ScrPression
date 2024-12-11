import { blockspace, output, pushUndo, workspace } from '$lib/stores';
import type { Block, WorkspaceState } from '$lib/types';
import { writable, type Writable } from 'svelte/store';
import { toast } from 'svelte-sonner';

const timeoutState: Writable<boolean> = writable(false);
const offset = 40;

const addBlock = (content: Block) => {
	const newId = Math.random().toString(36).substring(7);
	let newCon = JSON.parse(JSON.stringify(content));
	newCon.id = newId;
	workspace.set({
		...workspace.get(),
		blocks: new Map(workspace.get().blocks).set(newId, newCon)
	});
	console.log(workspace.get());
	pushUndo();
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
		updateBlockPositions(workspace.get(), b.id);
	});

	workspace.delete(blockId);
	workspace.set({ ...workspace.get() });
	pushUndo();
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

const onDrag = (content: Block) => {
	const block = workspace.get().blocks.get(content.id) as Block;
	if (!block) return;

	updateChildrenPositions(workspace.get(), block);
	updateZIndex(workspace.get(), content.id);

	block.position.x = content.position.x;
	block.position.y = content.position.y;

	workspace.blockUpdate(content.id, block);

	handleConnections(content);
};

const onDragStart = (content: Block) => {
	const block = workspace.get().blocks.get(content.id) as Block;
	if (!block) return;
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

const onDragEnd = (event: { clientX: number; clientY: number }, content: Block) => {
	timeoutState.set(false);

	document.elementsFromPoint(event.clientX, event.clientY).forEach((element) => {
		if (element.classList.contains('trash')) {
			removeBlock(content.id);
			toast.success('Block removed');
		}
	});
	pushUndo();
};

const updateChildrenPositions = (ws: WorkspaceState, block: Block) => {
	let currentBlock = block;
	let currentOffset = offset;

	while (currentBlock.children) {
		const childBlock = ws.blocks.get(currentBlock.children);
		if (!childBlock) break;

		childBlock.position = {
			x: block.position.x,
			y: block.position.y + currentOffset
		};
		ws.blocks.set(childBlock.id, childBlock);
		currentBlock = childBlock;
		currentOffset += offset;
	}
};

const updateZIndex = (ws: WorkspaceState, blockId: string) => {
	const block = ws.blocks.get(blockId);
	if (!block) return;

	ws.blocks.forEach((b) => {
		b.zIndex = 0;
		ws.blocks.set(b.id, b);
	});

	let zIndex = 1;
	const setZIndex = (id: string) => {
		const b = ws.blocks.get(id);
		if (!b) return;
		b.zIndex = zIndex++;
		ws.blocks.set(id, b);
		if (b.children) setZIndex(b.children);
	};

	setZIndex(blockId);
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

const updateBlockPositions = (ws: WorkspaceState, blockId: string, depth: number = 0) => {
	const block = ws.blocks.get(blockId);
	if (!block) return;

	const offsetY = offset + depth * 2;

	if (block.children) {
		const childBlock = ws.blocks.get(block.children);
		if (childBlock) {
			childBlock.position = {
				x: block.position.x,
				y: block.position.y + offsetY
			};
			childBlock.depth = depth + 1;
			ws.blocks.set(block.children, childBlock);

			updateBlockPositions(ws, block.children, depth + 1);
		}
	}
};

const handleBlockConnection = (ws: WorkspaceState, sourceId: string, targetId: string) => {
	const sourceBlock = ws.blocks.get(sourceId);
	const targetBlock = ws.blocks.get(targetId);

	if (!sourceBlock || !targetBlock) return false;

	let timeout = false;
	timeoutState.subscribe((state) => {
		timeout = state;
	})();

	if (timeout || sourceBlock.children || targetId === sourceId) return false;

	console.log('connecting', sourceBlock, targetBlock);
	const checkCircularReference = (blockId: string, targetId: string): boolean => {
		let current: Block | undefined = ws.blocks.get(blockId);
		while (current) {
			if (current.id === targetId) return true;
			current = current.parentId ? ws.blocks.get(current.parentId) : undefined;
		}
		return false;
	};

	if (checkCircularReference(targetId, sourceId)) return false;

	if (targetBlock.parentId) {
		const oldParent = ws.blocks.get(targetBlock.parentId);
		if (oldParent) {
			oldParent.children = '';
			ws.blocks.set(oldParent.id, oldParent);
		}
	}

	sourceBlock.children = targetId;
	targetBlock.parentId = sourceId;

	updateBlockPositions(ws, sourceId);
	updateZIndex(ws, sourceId);

	ws.blocks.set(sourceId, sourceBlock);
	ws.blocks.set(targetId, targetBlock);

	return true;
};

const handleConnections = (content: Block) => {
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
				handleBlockConnection(workspace.get(), targetID, content.id);
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