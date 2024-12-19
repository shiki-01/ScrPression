import { BlockType } from './type';
import { Block } from '$lib/block/class';

class BlockStore {
	private static instance: BlockStore;
	private blocks: Map<string, BlockType> = new Map();
	private idList: string[] = [];
	private listeners: Set<(event: { type: string; id: string; block?: BlockType }) => void> =
		new Set();

	private constructor() {
		this.clearBlocks();
	}

	public static getInstance(): BlockStore {
		if (!BlockStore.instance) {
			BlockStore.instance = new BlockStore();
		}
		return BlockStore.instance;
	}

	public addBlock(block: BlockType) {
		const newBlock = new Block(block);

		const newBlocks = new Map(this.blocks);
		const newIdList = [...this.idList];

		newBlocks.set(newBlock.get.id, newBlock.get);
		newIdList.push(newBlock.get.id);

		this.blocks = newBlocks;
		this.idList = newIdList;

		this.notifyListeners({ type: 'add', id: newBlock.get.id, block: newBlock.get });
		return newBlock.get.id;
	}

	public removeBlock(id: string) {
		const newBlocks = new Map(this.blocks);
		newBlocks.delete(id);

		const newIdList = this.idList.filter((v) => v !== id);

		this.blocks = new Map<string, BlockType>(newBlocks);
		this.idList = [...newIdList];

		console.log('removeBlock', this.blocks, this.idList);
		this.notifyListeners({ type: 'remove', id });
	}

	public updateBlock(id: string, partialBlock: Partial<BlockType>) {
		const block = this.blocks.get(id);
		if (block) {
			const newBlocks = new Map(this.blocks);
			const updatedBlock = { ...block, ...partialBlock };
			newBlocks.set(id, updatedBlock);

			this.blocks = newBlocks;

			console.log(partialBlock, updatedBlock);
			this.notifyListeners({ type: 'update', id, block: updatedBlock });
		}
	}

	public getBlock(id: string): BlockType | undefined {
		const block = this.blocks.get(id);
		return block ? block : undefined;
	}

	public getBlocks(): { blocks: BlockType[]; idList: string[] } {
		return {
			blocks: Array.from(this.blocks.values()),
			idList: [...this.idList]
		};
	}

	public clearBlocks() {
		this.blocks = new Map();
		this.idList = [];

		this.notifyListeners({ type: 'clear', id: '' });
	}

	public subscribe(listener: (event: { type: string; id: string; block?: BlockType }) => void) {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	private notifyListeners(event: { type: string; id: string; block?: BlockType }) {
		this.listeners.forEach((listener) => listener(event));
	}
}

export { BlockStore };
