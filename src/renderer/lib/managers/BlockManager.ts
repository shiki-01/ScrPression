import type { Block, WorkspaceStore } from '$lib/types';

export class BlockManager {
	private store: WorkspaceStore;
	private connections: Map<string, Set<string>>;

	constructor(store: WorkspaceStore) {
		this.store = store;
		this.connections = new Map();
	}

	createBlock(template: Block): Block {
		return {
			...template,
			id: crypto.randomUUID(),
			position: { ...template.position },
			children: '',
			parentId: '',
			depth: 0,
			zIndex: this.getNextZIndex()
		};
	}

	connectBlocks(sourceId: string, targetId: string): boolean {
		const state = this.store.get();
		const sourceBlock = state.blocks.get(sourceId);
		const targetBlock = state.blocks.get(targetId);

		if (!sourceBlock || !targetBlock) return false;
		return !this.wouldCreateCycle(sourceId, targetId);
	}

	updateBlock(id: string, updates: Partial<Block>) {
		this.store.updateBlock(id, updates);
	}

	private getNextZIndex(): number {
		const blocks = Array.from(this.store.get().blocks.values());
		return Math.max(...blocks.map((b) => b.zIndex), 0) + 1;
	}

	private wouldCreateCycle(sourceId: string, targetId: string) {
		const visited = new Set<string>();
		const dfs = (blockId: string): '' | boolean => {
			if (visited.has(blockId)) return false;
			visited.add(blockId);

			const block = this.store.get().blocks.get(blockId);
			if (!block) return false;

			if (block.id === targetId) return true;

			return block.children && dfs(block.children);
		};

		return dfs(targetId);
	}
}
