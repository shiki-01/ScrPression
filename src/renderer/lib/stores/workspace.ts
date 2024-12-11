import { createStore, Store } from '$lib/stores/Store';
import type { Block, BlockContent, WorkspaceState } from '../types';

const MAX_HISTORY = 50;

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

	pushHistory() {
		this.update((ws) => ({
			...ws,
			history: [...ws.history.slice(0, ws.currentIndex + 1), structuredClone(ws)].slice(
				-MAX_HISTORY
			),
			currentIndex: Math.min(ws.currentIndex + 1, MAX_HISTORY - 1),
			title: ws.title
		}));
	}

	undo() {
		this.update((ws) => {
			if (ws.currentIndex <= 0) return ws;
			const previousState = ws.history[ws.currentIndex - 1];
			return {
				...previousState,
				history: ws.history,
				currentIndex: ws.currentIndex - 1,
				title: ws.title
			};
		});
	}

	redo() {
		this.update((ws) => {
			if (ws.currentIndex >= ws.history.length - 1) return ws;
			const nextState = ws.history[ws.currentIndex + 1];
			return {
				...nextState,
				history: ws.history,
				currentIndex: ws.currentIndex + 1,
				title: ws.title
			};
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

	updateState(fn: (ws: WorkspaceState) => WorkspaceState) {
		this.update(fn);
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
