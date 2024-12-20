import { BlockStoreEvent, BlockType } from './type';
import { Block } from '$lib/block/class';

class BlockStore {
	private static instance: BlockStore;
	private blocks: Map<string, BlockType> = new Map();
	private idList: string[] = [];
	private output: string = '';
	private canvasPos: { x: number; y: number } = { x: 0, y: 0 };
	private listeners: Set<(event: BlockStoreEvent) => void> = new Set();

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

		this.notifyListeners({ type: 'remove', id });
	}

	public updateBlock(id: string, partialBlock: Partial<BlockType>) {
		const block = this.blocks.get(id);
		if (block) {
			const newBlocks = new Map(this.blocks);
			const updatedBlock = { ...block, ...partialBlock };
			newBlocks.set(id, updatedBlock);

			this.blocks = newBlocks;

			this.notifyListeners({ type: 'update', id, block: updatedBlock });
		}
	}

	public updateValue(id: string, contentId: string, value: string) {
		const block = this.blocks.get(id);
		if (block) {
			const newBlocks = new Map(this.blocks);
			const updatedBlock = {
				...block,
				contents: block.contents.map((content) => {
					if (content.id === contentId) {
						if (content.type === 'separator') {
							return content;
						} else if (content.type === 'value') {
							return { ...content, content: { ...content.content, value } };
						} else if (content.type === 'select') {
							return content;
						}
					}
					return content;
				})
			};
			newBlocks.set(id, updatedBlock);

			this.blocks = newBlocks;

			this.notifyListeners({ type: 'update', id, block: updatedBlock });
		}
	}

	public updateZIndex(id: string) {
		const newBlocks = new Map(this.blocks);
		const newIdList = [...this.idList];
		const maxZIndex = newIdList.length;

		const collectAllChildIds = (blockId: string): string[] => {
			const block = newBlocks.get(blockId);
			if (block && block.childId) {
				return [blockId, ...collectAllChildIds(block.childId)];
			}
			return [blockId];
		};

		const block = newBlocks.get(id);
		if (block) {
			const currentZIndex = block.zIndex;
			const targetIds = collectAllChildIds(id);

			targetIds.forEach((blockId, index) => {
				const targetBlock = newBlocks.get(blockId);
				if (targetBlock) {
					targetBlock.zIndex = maxZIndex + index;
					newBlocks.set(blockId, targetBlock);
				}
			});

			newIdList.forEach((blockId) => {
				if (!targetIds.includes(blockId)) {
					const otherBlock = newBlocks.get(blockId);
					if (otherBlock && otherBlock.zIndex > currentZIndex) {
						otherBlock.zIndex -= targetIds.length;
						newBlocks.set(blockId, otherBlock);
					}
				}
			});
		}

		this.blocks = newBlocks;
		this.notifyListeners({ type: 'update', id, block: block });
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

	public subscribe(listener: (event: BlockStoreEvent) => void) {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	private notifyListeners(event: BlockStoreEvent) {
		this.listeners.forEach((listener) => listener(event));
	}

	public getOutput(): string {
		return this.output;
	}

	public setOutput(output: string) {
		this.output = output;
		this.notifyListeners({ type: 'output', id: '', output });
	}

	public clearOutput() {
		this.output = '';
		this.notifyListeners({ type: 'output', id: '', output: '' });
	}

	public getCanvasPos(): { x: number; y: number } {
		return this.canvasPos;
	}

	public setCanvasPos(pos: { x: number; y: number }) {
		this.canvasPos = pos;
		this.notifyListeners({ type: 'canvas', id: '', block: undefined });
	}
}

export { BlockStore };
