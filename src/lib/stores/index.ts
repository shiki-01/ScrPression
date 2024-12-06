import type { Writable } from 'svelte/store';
import type { WorkspaceState, Block } from '$lib/types';
import { writable } from 'svelte/store';

const workspace: Writable<WorkspaceState> = writable({
	blocks: new Map<string, Block>()
});

const blockspace: Writable<HTMLElement | null> = writable(null);

const bgscale: Writable<number> = writable(1);

const canvasPosition: Writable<{ x: number, y: number }> = writable({ x: 0, y: 0 });

const output: Writable<string> = writable('');

export { workspace, blockspace, bgscale, canvasPosition, output };