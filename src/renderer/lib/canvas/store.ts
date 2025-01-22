import { ListenerManager } from '$lib/utils/ListenerManager.ts';
import { CanvasStoreEvent } from '$lib/block/type.ts';

class CanvasStore {
	private static instance: CanvasStore;
	private canvasPos: { x: number; y: number } = { x: 0, y: 0 };
	private canvasSize: { width: number; height: number } = { width: 0, height: 0 };
	private listenerManager: ListenerManager<CanvasStoreEvent> = new ListenerManager();

	private constructor() {}

	public static getInstance(): CanvasStore {
		if (!CanvasStore.instance) {
			CanvasStore.instance = new CanvasStore();
		}
		return CanvasStore.instance;
	}

	public getCanvasPos(): { x: number; y: number } {
		return this.canvasPos;
	}

	public setCanvasPos(pos: { x: number; y: number }) {
		this.canvasPos = pos;
		this.listenerManager.notifyListeners({ type: 'canvas', id: '' });
	}

	public getCanvasSize(): { width: number; height: number } {
		return this.canvasSize;
	}

	public setCanvasSize(size: { width: number; height: number }) {
		this.canvasSize = size;
		this.listenerManager.notifyListeners({ type: 'canvas', id: '' });
	}

	public subscribe(listener: (event: CanvasStoreEvent) => void) {
		return this.listenerManager.subscribe(listener);
	}
}

export { CanvasStore };