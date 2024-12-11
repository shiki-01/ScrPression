import type { Writable } from 'svelte/store';
import { writable } from 'svelte/store';

const blockspace: Writable<HTMLElement | null> = writable(null);

const bgscale: Writable<number> = writable(1);

const canvasPosition: Writable<{ x: number; y: number }> = writable({ x: 0, y: 0 });

const pointerPosition: Writable<{ x: number; y: number }> = writable({ x: 0, y: 0 });

const newBlockPosition: Writable<{ x: number; y: number }> = writable({ x: 0, y: 0 });

const output: Writable<string> = writable('');

export { blockspace, bgscale, pointerPosition, canvasPosition, newBlockPosition, output };