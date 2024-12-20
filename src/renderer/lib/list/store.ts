import { v4 as uuid } from 'uuid';
import { BlockStoreEvent, BlockType } from '$lib/block/type';

class ListStore {
	private static instance: ListStore;
	private list: Map<string, BlockType> = new Map();
	private idList: string[] = [];
	private listeners: Set<(event: BlockStoreEvent) => void> = new Set();

	private constructor() {
		this.clearList();
	}

	public static getInstance(): ListStore {
		if (!ListStore.instance) {
			ListStore.instance = new ListStore();
		}
		return ListStore.instance;
	}

	public getList(id: string): BlockType | undefined {
		return this.list.get(id);
	}

	public getLists(): string[] {
		return this.idList;
	}

	public addList(block: BlockType) {
		const newBlocks = new Map(this.list);
		const newIdList = [...this.idList];
		const newId = uuid();
		newBlocks.set(newId, block);
		this.list = newBlocks;
		this.idList = [...newIdList, newId];
		this.notifyListeners({ type: 'add', id: newId, block });
	}

	public removeList(id: string) {
		const newBlocks = new Map(this.list);
		const newIdList = this.idList.filter((v) => v !== id);
		newBlocks.delete(id);
		this.list = newBlocks;
		this.idList = [...newIdList];
		this.notifyListeners({ type: 'remove', id });
	}

	public updateList(id: string, partialList: Partial<BlockType>) {
		const block = this.list.get(id);
		if (block) {
			const newList = new Map(this.list);
			const newIdList = [...this.idList];
			const updatedList = { ...block, ...partialList };
			newList.set(id, updatedList);
			this.list = newList;
			this.idList = [...newIdList];
			this.notifyListeners({ type: 'update', id, block: updatedList });
		}
	}

	public clearList() {
		this.list = new Map();
		this.idList = [];
		this.notifyListeners({ type: 'clear' });
	}

	public subscribe(listener: (event: BlockStoreEvent) => void) {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	private notifyListeners(event: BlockStoreEvent) {
		this.listeners.forEach((listener) => listener(event));
	}
}

export { ListStore };
