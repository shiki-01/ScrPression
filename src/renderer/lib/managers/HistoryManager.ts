import type { WorkspaceStore } from '$lib/types';

export class HistoryManager {
  static workspace: WorkspaceStore;

  static initialize(workspace: WorkspaceStore) {
    this.workspace = workspace;
  }

  static push() {
    const state = this.workspace.get();
    const blocks = new Map(state.blocks);
    const positions = new Map(state.positions);
    this.workspace.update((state) => ({
      ...state,
      history: [...state.history, { blocks, positions }],
      currentIdx: state.history.length
    }));
  }

  static undo() {
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

  static redo() {
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