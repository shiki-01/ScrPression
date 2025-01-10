import type { BlockType, ConstructorBlockType } from '$lib/block/type';
import { v4 as uuid } from 'uuid';

class Block {
	private readonly _block: BlockType;

	constructor(readonlyBlock: ConstructorBlockType) {
		const id = uuid();
		this._block = {
			...readonlyBlock,
			id,
			position: { x: 0, y: 0 },
			size: { width: 0, height: 0 },
			childId: '',
			parentId: '',
			depth: 0,
			zIndex: 0,
			enclose: {
				offset: { x: 8, y: 0 },
				connections: {
					output: { x: 0, y: 0 }
				},
				contents: []
			}
		};
	}

	public get get(): Readonly<BlockType> {
		return { ...this._block };
	}
}

export { Block };
