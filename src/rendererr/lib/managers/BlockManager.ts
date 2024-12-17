import type { Block, WorkspaceState } from '$lib/types';
import type { Store } from '$lib/stores/Store';

export class BlockManager {
  static store: Store<WorkspaceState>;
  private connections: Map<string, Set<string>>;

  constructor() {
    this.connections = new Map();
  }

  static createBlock(template: Block): Block {
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

  static connectBlocks(sourceId: string, targetId: string): boolean {
    const state = this.store.get();
    const sourceBlock = state.blocks.get(sourceId);
    const targetBlock = state.blocks.get(targetId);

    if (!sourceBlock || !targetBlock) return false;
    return !this.wouldCreateCycle(sourceId, targetId);
  }

  static updateBlock(id: string, updates: Partial<Block>) {
    const state = this.store.get();
    const block = state.blocks.get(id);
    if (!block) return;

    const newBlock = { ...block, ...updates };
    this.store.update((ws) => {
      const newBlocks = new Map(ws.blocks);
      newBlocks.set(id, newBlock);
      return { ...ws, blocks: newBlocks };
    });

    if (updates.children) {
      this.updateBlockZIndex(updates.children);
    }
  }

  static getNextZIndex(): number {
    const blocks = Array.from(this.store.get().blocks.values());
    return Math.max(...blocks.map((b) => b.zIndex), 0) + 1;
  }

  static wouldCreateCycle(sourceId: string, targetId: string) {
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

  static updateBlockZIndex(children: string) {
    const state = this.store.get();
    const sortedBlocks = new Map(Array.from(state.blocks.entries()).sort(([, a], [, b]) => a.zIndex - b.zIndex));
    let currentIndex = 0;

    const updateBlockZIndex = (blockId: string) => {
      const block = state.blocks.get(blockId);
      if (!block) return;

      block.zIndex = currentIndex++;
      this.updateBlock(block.id, block);

      if (block.children) {
        updateBlockZIndex(block.children);
      }
    };

    updateBlockZIndex(children);
    this.store.set({ ...state, blocks: sortedBlocks });
  }
}

// BlockManager.store を初期化するコード
import { workspace } from '$lib/stores/workspace';
BlockManager.store = workspace;