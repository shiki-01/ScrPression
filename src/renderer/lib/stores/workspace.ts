import { createStore, Store } from '$lib/stores/Store';
import type { Block, BlockContent, WorkspaceState } from '../types';

class WorkspaceStore extends Store<WorkspaceState> {
	constructor() {
		super({
			blocks: new Map(),
			history: [],
			currentIndex: -1,
			title: '',
			positions: new Map()
		});
	}

	blockUpdate(id: string, block: Block) {
		this.update((ws) => {
			const newBlocks = new Map(ws.blocks);
			newBlocks.set(id, structuredClone(block));
			return { ...ws, blocks: newBlocks, title: ws.title };
		});
	}

	delete(id: string) {
		this.update((ws) => {
			const newBlocks = new Map(ws.blocks);
			newBlocks.delete(id);
			return { ...ws, blocks: newBlocks, title: ws.title };
		});
	}

	setTitle(title: string) {
		this.update((ws) => ({
			...ws,
			title
		}));
	}

	clear() {
		this.set({
			blocks: new Map(),
			history: [],
			currentIndex: -1,
			title: '',
			positions: new Map()
		});
	}

	updateBlock(id: string, param2: { contents: ('space' | BlockContent)[] }) {
		this.update((ws) => {
			const block = ws.blocks.get(id);
			if (!block) return ws;
			block.contents = param2.contents;
			const newBlocks = new Map(ws.blocks);
			newBlocks.set(id, block);
			return { ...ws, blocks: newBlocks, title: ws.title };
		});
	}
}

export const workspace = new WorkspaceStore();
export const blockspace = createStore<HTMLElement | null>(null);
export const bgscale = createStore<number>(1);
export const canvasPosition = createStore<{ x: number; y: number }>({ x: 0, y: 0 });
export const pointerPosition = createStore<{ x: number; y: number }>({ x: 0, y: 0 });
export const output = createStore<string>('');
