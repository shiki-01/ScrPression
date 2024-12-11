import type { WorkspaceStore } from '$lib/types';

export class HistoryManager {
	private workspace: WorkspaceStore;

	constructor(workspace: WorkspaceStore) {
		this.workspace = workspace;
	}

	push() {
		const state = this.workspace.get();
		const blocks = new Map(state.blocks);
		const positions = new Map(state.positions);
		this.workspace.updateState((state) => ({
			...state,
			history: [...state.history, { blocks, positions }],
			currentIdx: state.history.length
		}));
	}

	undo() {
		const state = this.workspace.get();
		if (state.currentIndex === 0) return;
		const history = state.history[state.currentIndex - 1];
		this.workspace.set({
			...state,
			blocks: history.blocks,
			positions: history.positions,
			currentIndex: state.currentIndex - 1
		});
	}

	redo() {
		const state = this.workspace.get();
		if (state.currentIndex === state.history.length - 1) return;
		const history = state.history[state.currentIndex + 1];
		this.workspace.set({
			...state,
			blocks: history.blocks,
			positions: history.positions,
			currentIndex: state.currentIndex + 1
		});
	}
}
