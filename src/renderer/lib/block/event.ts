import { BlockStoreEvent } from '$lib/block/type';

class BlockEventEmitter {
	private static instance: BlockEventEmitter;
	private listeners: Set<(event: BlockStoreEvent) => void> = new Set();

	private constructor() {}

	public static getInstance(): BlockEventEmitter {
		if (!BlockEventEmitter.instance) {
			BlockEventEmitter.instance = new BlockEventEmitter();
		}
		return BlockEventEmitter.instance;
	}

	public emit(event: BlockStoreEvent) {
		this.listeners.forEach((listener) => listener(event));
	}

	public subscribe(callback: (event: BlockStoreEvent) => void) {
		this.listeners.add(callback);
		return () => this.listeners.delete(callback);
	}
}

export { BlockEventEmitter };
