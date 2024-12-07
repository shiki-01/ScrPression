import { blockspace, output, workspace } from '$lib/stores';
import type { Block, WorkspaceState } from '$lib/types';
import { writable, type Writable } from 'svelte/store';
import { toast } from 'svelte-sonner';

const timeoutState: Writable<boolean> = writable(false);

const addBlock = (content: Block) => {
	const newId = Math.random().toString(36).substring(7);
	workspace.update((ws) => {
		let newCon = JSON.parse(JSON.stringify(content));
		newCon.id = newId;
		ws.blocks.set(newId, newCon);
		return ws;
	});
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

let offset = 40;

const onDrag = (e: { offsetX: number; offsetY: number }, content: Block) => {
	workspace.update((ws) => {
		const block = ws.blocks.get(content.id);
		if (block) {
			if (block.parentId) {
				//　魔法のことば。消したら動かない。多分。
				const parentBlock = ws.blocks.get(block.parentId);
				if (parentBlock) {
					parentBlock.children = '';
					ws.blocks.set(parentBlock.id, parentBlock);
				}
				block.parentId = '';
			}

			block.position.x = e.offsetX;
			block.position.y = e.offsetY;
			ws.blocks.set(content.id, block);

			// 子ブロックの位置を更新
			let currentBlock = block;
			while (currentBlock.children) {
				const childBlock = ws.blocks.get(currentBlock.children);
				if (!childBlock) break;

				childBlock.position = {
					x: currentBlock.position.x,
					y: currentBlock.position.y + offset
				};
				ws.blocks.set(childBlock.id, childBlock);
				currentBlock = childBlock;
			}
		}
		return ws;
	});

	workspace.subscribe((ws) => {
		updateZIndex(ws, content.id);
	});
	handleConnections(content);
};

const onDragStart = (strict: boolean, content: Block) => {
	if (strict) return;
	workspace.update((ws) => {
		const block = ws.blocks.get(content.id);
		if (block) {
			// 親ブロックとの接続を解除
			if (block.parentId) {
				timeoutState.set(true);
				const parentBlock = ws.blocks.get(block.parentId);
				if (parentBlock) {
					parentBlock.children = '';
					ws.blocks.set(parentBlock.id, parentBlock);
				}
				block.parentId = '';
			}
		}
		return ws;
	});
};

const onDragEnd = (event: { clientX: number; clientY: number }, content: Block) => {
	timeoutState.set(false);

	const dropZone = document.elementsFromPoint(event.clientX, event.clientY);
	dropZone.forEach((element) => {
		if (element.classList.contains('trash')) {
			removeBlock(content.id);
			toast.success('Block removed');
		}
	});
};

const removeBlock = (blockId: string) => {
	workspace.update((ws) => {
		const block = ws.blocks.get(blockId);
		if (!block) return ws;

		ws.blocks.delete(block.id);

		if (block.children) {
			removeBlock(block.children);
		}

		return ws;
	});
};

const updateZIndex = (ws: WorkspaceState, blockId: string) => {
	const block = ws.blocks.get(blockId);
	if (!block) return;

	ws.blocks.forEach((b) => {
		b.zIndex = 0;
		ws.blocks.set(b.id, b);
	});

	let zIndex = 1;
	const setZIndex = (blockId: string) => {
		const block = ws.blocks.get(blockId);
		if (!block) return;

		block.zIndex = zIndex++;
		ws.blocks.set(block.id, block);

		if (block.children) {
			setZIndex(block.children);
		}
	};

	setZIndex(blockId);
};

const findRootBlock = (
	ws: WorkspaceState,
	blockId: string,
	visited: Set<string> = new Set()
): Block | null => {
	// 既に訪れたブロックなら無限ループを防ぐためにnullを返す
	if (visited.has(blockId)) return null;

	const block = ws.blocks.get(blockId);
	if (!block) return null;

	// 現在のブロックを訪問済みとしてマーク
	visited.add(blockId);

	// ルートブロック（親を持たない）を見つけたら返す
	if (!block.parentId) return block;

	// 親ブロックを再帰的に探索
	return findRootBlock(ws, block.parentId, visited);
};

const updateBlockPositions = (
	strict: boolean,
	ws: WorkspaceState,
	blockId: string,
	depth: number = 0
) => {
	if (strict) return;
	const block = ws.blocks.get(blockId);
	if (!block) return;

	// 深さに応じてオフセットを調整
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

			// 再帰的に子ブロックの位置を更新
			updateBlockPositions(strict, ws, block.children, depth + 1);
		}
	}
};

const handleBlockConnection = (ws: WorkspaceState, sourceId: string, targetId: string) => {
	const sourceBlock = ws.blocks.get(sourceId);
	const targetBlock = ws.blocks.get(targetId);
	let timeout = false;
	timeoutState.subscribe((state) => {
		timeout = state;
	});

	if (!sourceBlock || !targetBlock || timeout) return false;

	if (sourceBlock.children) {
		return false;
	}

	// 既存の接続を解除
	if (targetBlock.parentId) {
		const oldParent = ws.blocks.get(targetBlock.parentId);
		if (oldParent) {
			oldParent.children = '';
			ws.blocks.set(oldParent.id, oldParent);
		}
	}

	// 新しい接続を作成
	sourceBlock.children = targetId;
	targetBlock.parentId = sourceId;

	// 接続時に位置を更新
	targetBlock.position = {
		x: sourceBlock.position.x,
		y: sourceBlock.position.y + offset
	};

	// 子ブロックの位置も再帰的に更新
	let currentBlock = targetBlock;
	let currentOffset = offset;

	while (currentBlock.children) {
		const childBlock = ws.blocks.get(currentBlock.children);
		if (!childBlock) break;

		currentOffset += offset;
		childBlock.position = {
			x: sourceBlock.position.x,
			y: sourceBlock.position.y + currentOffset
		};
		ws.blocks.set(childBlock.id, childBlock);
		currentBlock = childBlock;
	}

	ws.blocks.set(sourceId, sourceBlock);
	ws.blocks.set(targetId, targetBlock);

	updateZIndex(ws, sourceId);

	return true;
};

const handleConnections = (content: Block) => {
	workspace.update((ws) => {
		let space: HTMLElement | null = null;
		blockspace.subscribe((blockspace) => {
			space = blockspace;
		});

		if (!space) return ws;
		const inputs = (space as HTMLElement).querySelectorAll('.input');
		const outputs = (space as HTMLElement).querySelectorAll('.output');

		inputs.forEach((inputElement) => {
			outputs.forEach((outputElement) => {
				const targetID = (outputElement as HTMLElement).dataset.id;
				if (!targetID || targetID === content.id) return;

				if (overlap(outputElement as HTMLElement, inputElement as HTMLElement)) {
					handleBlockConnection(ws, targetID, content.id);
				}
			});
		});
		return ws;
	});
};

const formatOutput = (blocks: Block[]) => {
	let outputText = '';
	blocks.forEach((block) => {
		if (block.type === 'flag') return;
		let blockOutput = block.output;
		block.contents.forEach((content) => {
			if (content === 'space') return;
			const regex = new RegExp(`\\$\\{${content.id}\\}`, 'g');
			blockOutput = blockOutput.replace(regex, content.value);
		});
		outputText += blockOutput + '\n';
	});
	output.set(outputText.trim());
};

export {
	addBlock,
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