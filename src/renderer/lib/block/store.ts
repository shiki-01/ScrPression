import { writable, get } from 'svelte/store';
import type { BlockType } from './type';

class BlockStore {
    private static instance: BlockStore;
    private readonly _blocks = writable<Map<string, BlockType>>(new Map());
    subscribe: (this: void, run: import("svelte/store").Subscriber<Map<string, BlockType>>, invalidate?: ((value?: Map<string, BlockType>) => void) | undefined) => import("svelte/store").Unsubscriber;

    private constructor() {
        this._blocks = writable(new Map());
        this.subscribe = this._blocks.subscribe;
    }

    static getInstance(): BlockStore {
        if (!BlockStore.instance) {
            BlockStore.instance = new BlockStore();
        }
        return BlockStore.instance;
    }

    addBlock(block: BlockType) {
        this._blocks.update(blocks => {
            blocks.set(block.id, block);
            return blocks;
        });
    }

    removeBlock(id: string) {
        this._blocks.update(blocks => {
            blocks.delete(id);
            return blocks;
        });
    }

    getBlock(id: string): BlockType | undefined {
        const blocks = get(this._blocks);
        return blocks.get(id);
    }

    getBlocks(): Map<string, BlockType> {
        return new Map(get(this._blocks));
    }

    updateBlock(id: string, updatedBlock: Partial<BlockType>) {
        this._blocks.update(blocks => {
            const block = blocks.get(id);
            if (block) {
                blocks.set(id, { ...block, ...updatedBlock });
            }
            return blocks;
        });
    }

    subscribeBlocks(callback: (value: Map<string, BlockType>) => void) {
        return this._blocks.subscribe(callback);
    }
}

export { BlockStore };