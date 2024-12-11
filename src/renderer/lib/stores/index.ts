import type { Writable } from 'svelte/store';
import { writable } from 'svelte/store';
import type { Block, WorkspaceState } from '$lib/types';
import { atom } from 'nanostores';

type Store<T> = {
	subscribe: (fn: (value: T) => void) => () => void;
	set: (value: T) => void;
	update: (fn: (value: T) => T) => void;
	blockUpdate: (id: string, block: Block) => void;
	get: () => T;
	delete: (id: string) => void;
};

const store = (initialValue: WorkspaceState) => {
	const subscribers = new Set<(value: WorkspaceState) => void>();
	let currentValue = initialValue;

	const notify = () => {
		subscribers.forEach((fn: (value: WorkspaceState) => void) => fn(currentValue));
	};

	const subscribe = (fn: (value: WorkspaceState) => void) => {
		subscribers.add(fn);
		fn(currentValue);
		return () => subscribers.delete(fn);
	};

	const set = (newValue: WorkspaceState) => {
		if (newValue === currentValue) return;
		currentValue = newValue;
		notify();
	};

	const update = (fn: (value: WorkspaceState) => WorkspaceState) => {
		const newValue = fn(currentValue);
		set(newValue);
	};

	const blockUpdate = (id: string, block: Block) => {
		update((ws) => {
			const newBlocks = new Map(ws.blocks);
			newBlocks.set(id, block);
			return {
				...ws,
				blocks: newBlocks
			};
		});
	};

	const get = () => {
		return currentValue;
	};

	return {
		subscribe,
		set,
		update,
		blockUpdate,
		get,
		delete: (id: string) => {
			update((ws) => {
				const newBlocks = new Map(ws.blocks);
				newBlocks.delete(id);
				return {
					...ws,
					blocks: newBlocks
				};
			});
		}
	};
};

const workspace: Store<WorkspaceState> = store({
	blocks: new Map<string, Block>(),
	title: 'Untitled'
});

const blockspace: Writable<HTMLElement | null> = writable(null);

const bgscale: Writable<number> = writable(1);

const canvasPosition: Writable<{ x: number; y: number }> = writable({ x: 0, y: 0 });

const pointerPosition: Writable<{ x: number; y: number }> = writable({ x: 0, y: 0 });

const newBlockPosition: Writable<{ x: number; y: number }> = writable({ x: 0, y: 0 });

const output: Writable<string> = writable('');

interface HistoryState {
	blocks: Map<string, Block>;
	positions: Map<string, { x: number; y: number }>;
}

const history = atom<{
	undo: HistoryState[];
	redo: HistoryState[];
}>({
	undo: [],
	redo: []
});

const createHistoryState = (state: Writable<WorkspaceState>): HistoryState => {
	let historyState: HistoryState = { blocks: new Map(), positions: new Map() };
	state.subscribe((ws) => {
		const positions = new Map<string, { x: number; y: number }>();
		ws.blocks.forEach((block, key) => {
			positions.set(key, { ...block.position });
		});
		historyState = {
			blocks: new Map(ws.blocks),
			positions
		};
	})();
	return historyState;
};

const restoreState = (state: HistoryState): WorkspaceState => {
	let title = 'Untitled';
	workspace.subscribe((ws) => {
		title = ws.title;
	});
	const blocks = new Map(state.blocks);
	blocks.forEach((block, key) => {
		const position = state.positions.get(key);
		if (position) {
			block.position = { ...position };
		}
	});
	return { blocks, title };
};

const areStatesIdentical = (state1: HistoryState, state2: HistoryState): boolean => {
	if (
		state1.blocks.size !== state2.blocks.size ||
		state1.positions.size !== state2.positions.size
	) {
		return false;
	}

	for (const [key, block1] of state1.blocks) {
		const block2 = state2.blocks.get(key);
		if (!block2 || JSON.stringify(block1) !== JSON.stringify(block2)) {
			return false;
		}
	}

	for (const [key, pos1] of state1.positions) {
		const pos2 = state2.positions.get(key);
		if (!pos2 || pos1.x !== pos2.x || pos1.y !== pos2.y) {
			return false;
		}
	}

	return true;
};

const pushUndo = () => {
	const currentWorkspace = workspace;
	const currentHistory = history.get();
	const currentState = createHistoryState(currentWorkspace);

	// 最後の状態と異なる場合のみ追加
	if (
		currentHistory.undo.length === 0 ||
		!areStatesIdentical(currentHistory.undo[currentHistory.undo.length - 1], currentState)
	) {
		currentHistory.undo.push(currentState);

		// 履歴スタックの最大長を保持
		const maxHistory = 30;
		if (currentHistory.undo.length > maxHistory) {
			currentHistory.undo.shift();
		}

		// redoスタックをクリア
		currentHistory.redo = [];
		history.set(currentHistory);
	}
};

const undo = () => {
	const currentHistory = history.get();
	if (currentHistory.undo.length === 0) return;

	const currentState = createHistoryState(workspace);

	const previousState = currentHistory.undo.pop();
	if (previousState) {
		currentHistory.redo.push(currentState);
		workspace.set(restoreState(previousState));
	}

	history.set(currentHistory);
};

const redo = () => {
	const currentHistory = history.get();
	if (currentHistory.redo.length === 0) return;

	const currentState = createHistoryState(workspace);

	const nextState = currentHistory.redo.pop();
	if (nextState) {
		currentHistory.undo.push(currentState);
		workspace.set(restoreState(nextState));
	}

	history.set(currentHistory);
};

export {
	workspace,
	blockspace,
	bgscale,
	pointerPosition,
	canvasPosition,
	newBlockPosition,
	output,
	history,
	undo,
	redo,
	pushUndo
};