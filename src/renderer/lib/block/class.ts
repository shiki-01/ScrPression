import type { BlockType, Position } from "./type";

class Block {
    private _block: BlockType;

    constructor(block: BlockType) {
        this._block = block;
    }

    static createBlock(block: BlockType, id: string, position: Position) {
        return new Block({
                ...block,
                id,
                position,
                zIndex: 0,
                depth: 0,
                parentId: '',
                childId: ''
            })
    }

    get block() {
        return this._block;
    }

    set position(position: Position) {
        this._block.position = position;
    }

    set zIndex(zIndex: number) {
        this._block.zIndex = zIndex;
    }

    set parentId(id: string) {
        this._block.parentId = id;
    }

    set childId(id: string) {
        this._block.childId = id;
    }

    set depth(depth: number) {
        this._block.depth = depth;
    }
}