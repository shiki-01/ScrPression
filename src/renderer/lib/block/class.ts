import type { BlockType, ReadonlyBlockType } from '$lib/block/type';
import { BlockEventEmitter } from '$lib/block/event';
import { v4 as uuid } from 'uuid';

class Block {
	private readonly _block: BlockType;
	private eventEmitter: BlockEventEmitter;

	constructor(readonlyBlock: ReadonlyBlockType) {
		const id = uuid();
		this._block = {
			...readonlyBlock,
			id,
			position: { x: 0, y: 0 },
			size: { width: 0, height: 0 },
			childId: '',
			parentId: '',
			depth: 0,
			zIndex: 0
		};
		this.eventEmitter = BlockEventEmitter.getInstance();
	}

	public get get(): Readonly<BlockType> {
		return { ...this._block };
	}
}

export { Block };
