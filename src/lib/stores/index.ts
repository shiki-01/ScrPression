import type { Writable } from 'svelte/store';
import type { WorkspaceState, Block } from '$lib/types';
import { writable } from 'svelte/store';

const workspace: Writable<WorkspaceState> = writable({
	blocks: new Map<string, Block>()
});

const blockspace: Writable<HTMLElement | null> = writable(null);

const bgsize: Writable<{width: number, height: number}> = writable({width: 0, height: 0});
const bgscale: Writable<number> = writable(1);
const uisize: Writable<{width: number, height: number}> = writable({width: 0, height: 0});

export { workspace, blockspace, bgsize, bgscale, uisize };