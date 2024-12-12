import type { constants } from "original-fs";
import type { BlockType } from "./type";
import { type Writable, writable } from 'svelte/store';

class BlockStore {
    private _blocks: Writable<Map<string, BlockType>> = writable(new Map());

    subscribe = this._blocks.subscribe;

    addBlock(block: BlockType) {
        this._blocks.update(blocks => {
            blocks.set(block.id, block)
            return blocks;
        });
    }

    removeBlock(id: string) {
        this._blocks.update(blocks => {
            blocks.delete(id);
            return blocks;
        })
    }

    getBlock(id: string): BlockType | undefined {
        let block: BlockType | undefined;
        this._blocks.update(blocks => {
            block = blocks.get(id);
            return blocks;
        })
        return block;
    }

    getBlocks(): Map<string, BlockType> {
        let blocksCopy: Map<string, BlockType> = new Map();
        this._blocks.update(blocks => {
            blocksCopy = new Map(blocks);
            return blocks;
        });
        return blocksCopy;
    }

    clearBlocks() {
        this._blocks.update(blocks => {
            blocks.clear();
            return blocks;
        })
    }

    updateBlock(id: string, block: BlockType) {
        this._blocks.update(blocks => {
            blocks.set(id, block);
            return blocks;
        })
    }
}