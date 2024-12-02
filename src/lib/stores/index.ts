import type { Writable } from 'svelte/store';
import type { WorkspaceState, Block } from '$lib/types';
import { writable } from 'svelte/store';

const workspace: Writable<WorkspaceState> = writable({
	blocks: new Map<string, Block>()
});

export { workspace };