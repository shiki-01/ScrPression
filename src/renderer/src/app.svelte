<script lang="ts">
	import './app.css';
	import Icon from '@iconify/svelte';
	import ContextMenu from '$lib/components/ContextMenu.svelte';
	import Block from '$lib/block/Block.svelte';
	import List from '$lib/block/List.svelte';
	import type { WorkspaceState } from '$lib/types';
	import { bgscale, blockspace, canvasPosition, output, pointerPosition } from '$lib/stores';
	import { workspace } from '$lib/stores/workspace';
	import { useCanvas } from '$lib/utils/useCanvas';
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import { Toaster } from 'svelte-sonner';
	import { HistoryManager } from '$lib/managers/HistoryManager';

	import type { BlockType } from '$lib/block/type';
	import { BlockStore } from '$lib/block/store';
	import { writable, type Writable } from 'svelte/store';

	const content: BlockType = {
		id: '',
		title: 'random',
		output: 'wiggle(${x}, ${y});',
		type: 'move',
		contents: [
			{
				id: 'x',
				type: 'value',
				content: {
					title: 'X',
					value: '0',
					placeholder: 'X'
				}
			},
			{
				id: 'y',
				type: 'value',
				content: {
					title: 'Y',
					value: '0',
					placeholder: 'Y'
				}
			}
		],
		connections: {
			input: {
				x: 16,
				y: 0
			},
			output: {
				x: 16,
				y: 0
			}
		},
		position: {
			x: 10,
			y: 10
		},
		childId: '',
		parentId: '',
		depth: 0,
		zIndex: 0
	};

	const content2: BlockType = {
		id: '',
		title: 'null comp',
		output: 'comp("${part}").layer("${null}").transform.${propate};',
		type: 'composition',
		contents: [
			{
				id: 'part',
				type: 'value',
				content: {
					title: 'Part',
					value: '',
					placeholder: 'Part'
				}
			},
			{
				id: 'null',
				type: 'value',
				content: {
					title: 'Null',
					value: '',
					placeholder: 'Null'
				}
			},
			{
				id: 'propate',
				type: 'value',
				content: {
					title: 'Propate',
					value: '',
					placeholder: 'Propate'
				}
			}
		],
		connections: {
			input: {
				x: 16,
				y: 0
			},
			output: {
				x: 16,
				y: 0
			}
		},
		position: {
			x: 10,
			y: 10
		},
		childId: '',
		parentId: '',
		depth: 0,
		zIndex: 0
	};

	const content3: BlockType = {
		id: '',
		title: '干渉',
		output: 'value / length(toComp([0,0]), toComp([0.7071,0.7071])) || 0.001;',
		type: 'works',
		contents: [],
		connections: {
			input: {
				x: 16,
				y: 0
			},
			output: {
				x: 16,
				y: 0
			}
		},
		position: {
			x: 10,
			y: 10
		},
		childId: '',
		parentId: '',
		depth: 0,
		zIndex: 0
	};

	const content5: BlockType = {
		id: '',
		title: 'Start',
		output: '',
		type: 'flag',
		contents: [],
		connections: {
			input: {
				x: 0,
				y: 0
			},
			output: {
				x: 16,
				y: 0
			}
		},
		position: {
			x: 10,
			y: 10
		},
		childId: '',
		parentId: '',
		depth: 0,
		zIndex: 0
	};

	const blockList: Writable<BlockType[]> = writable([content, content2, content3, content5]);

	let width = 2000;
	let height = 2000;

	let main: HTMLElement;
	let scrollX: HTMLElement;
	let scrollY: HTMLElement;

	function updateCanvasSize(workspace: WorkspaceState) {
		const blocks = Array.from(workspace.blocks.values());
		if (blocks.length === 0) return;

		const xs = blocks.map((block) => Math.abs(block.position.x));
		const ys = blocks.map((block) => Math.abs(block.position.y));
		const maxX = Math.max(...xs);
		const maxY = Math.max(...ys);

		width = Math.max(2000, maxX * 2 + 1000);
		height = Math.max(2000, maxY * 2 + 1000);
	}

	const scroll = (position: { x: number; y: number }) => {
		if (scrollX && scrollY && main) {
			const clientWidth = main.clientWidth - 250 - 16 - 16 - 16;
			const clientHeight = main.clientHeight - 250 - 50 - 16 - 16 - 16;

			const xBarWidth = (width * $bgscale) / clientWidth;
			const yBarHeight = (height * $bgscale) / clientHeight;

			scrollX.style.width = `${clientWidth / xBarWidth}px`;
			scrollY.style.height = `${clientHeight / yBarHeight}px`;

			const xBarPosX = position.x / xBarWidth;
			const yBarPosY = position.y / yBarHeight;

			scrollX.style.transform = `translateX(calc(${-xBarPosX}px))`;
			scrollY.style.transform = `translateY(calc(${-yBarPosY}px))`;
		}
	};

	$: scroll($canvasPosition);

	onMount(() => {
		updateCanvasSize($workspace);
		scroll($canvasPosition);
	});

	const adjustPosition = () => {
		if (!main || !main.parentElement) return;
		const rect = main.getBoundingClientRect();
		const parentRect = main.parentElement.getBoundingClientRect();

		if (rect.width * $bgscale < parentRect.width) {
			canvasPosition.update((pos) => ({ ...pos, x: 0 }));
		}
		if (rect.height * $bgscale < parentRect.height) {
			canvasPosition.update((pos) => ({ ...pos, y: 0 }));
		}
	};

	let isContextMenuOpen = false;
	let isContextX = 0;
	let isContextY = 0;

	let isAdd: boolean = false;

	let blocks: Writable<[string, BlockType][]> = writable([]);

	const blockStore = BlockStore.getInstance();
	
	$: blockStore.subscribeBlocks((value) => {
        blocks.set(Array.from(value.entries()));
    });

	const parseClipboardContent = (content: string) => {
		const jsonString = content
			.replace(/(\w+):/g, '"$1":')
			.replace(/'/g, '"');
		return JSON.parse(jsonString);
	};
</script>

<svelte:window on:mousemove={(e) => pointerPosition.set({ x: e.clientX, y: e.clientY })} />

<Toaster />

{#if isAdd}
	<div
		transition:fly={{ y: -10, duration: 200 }}
		class="fixed right-20 top-[40px] z-10 flex flex-col gap-2 rounded-xl bg-slate-200 px-4 py-2"
	>
		<button class="justify-bewteen flex flex-row items-center gap-2">
			Project
			<Icon icon="ic:round-insert-drive-file" class="h-6 w-6" />
		</button>
		<span class="h-[1px] w-full bg-slate-800"></span>
		<button
			on:click={async () => {
				try {
					const newContentText = (await window.navigator.clipboard.readText()).trim();
					console.log('Clipboard content:', newContentText);
					const newContent = parseClipboardContent(newContentText);
					console.log('Parsed content:', newContent);
					if (newContent) {
						blockList.update((list) => [...list, newContent]);
					}
				} catch (error) {
					console.error('Failed to parse clipboard content as JSON:', error);
				}
			}}
			class="flex flex-row items-center justify-between gap-2"
		>
			Block
			<Icon icon="ic:round-code" class="h-6 w-6" />
		</button>
	</div>
{/if}

<ContextMenu bind:isOpen={isContextMenuOpen} clientX={isContextX} clientY={isContextY} />

<main
	bind:this={main}
	class="relative grid h-[100svh] w-[100svw] touch-none select-none grid-rows-[50px_1fr] overflow-hidden"
>
	<div class="flex h-full w-full flex-row justify-between bg-slate-500 px-5">
		<div class="flex flex-row gap-4">
			<div class="h-full w-[100px]">
				<img src="https://placehold.jp/200x200" alt="logo" class="h-full w-full object-cover" />
			</div>
			<div class="flex flex-row gap-2 py-2">
				<div>
					<input type="text" class="h-full w-[200px] px-2" placeholder={$workspace.title} />
				</div>
				<div class="flex h-full flex-row items-center justify-center gap-2 text-slate-50">
					<button on:click={HistoryManager.undo}>
						<Icon icon="ic:round-chevron-left" class="h-6 w-6" />
					</button>
					<button on:click={HistoryManager.redo}>
						<Icon icon="ic:round-chevron-right" class="h-6 w-6" />
					</button>
					<button>
						<Icon icon="ic:round-save" class="h-6 w-6" />
					</button>
				</div>
			</div>
		</div>
		<div class="flex h-full touch-auto flex-row items-center justify-center gap-4 text-slate-50">
			<button
				on:click={() => (isAdd = !isAdd)}
				class="flex h-full w-full items-center justify-center"
			>
				<Icon icon="ic:round-add-box" class="h-6 w-6" />
			</button>
			<button class="flex h-full w-full items-center justify-center">
				<Icon icon="ic:round-share" class="h-6 w-6" />
			</button>
			<button class="flex h-full w-full items-center justify-center">
				<Icon icon="ic:round-settings" class="h-6 w-6" />
			</button>
		</div>
	</div>
	<div
		on:pointerdown={() => {
			isAdd = false;
		}}
		class="grid grid-cols-[250px_1fr] grid-rows-1 overflow-hidden"
	>
		<div
			class="block-list relative flex h-full w-full select-none flex-col items-start gap-5 bg-slate-200 p-5"
		>
			{#each $blockList as blocks}
				<List content={blocks} />
			{/each}
		</div>
		<div class="grid" style="grid-template-rows: 1fr 250px;">
			<div class="relative h-full w-full overflow-hidden">
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<button
					bind:this={$blockspace}
					on:click={() => {
						isContextMenuOpen = false;
					}}
					on:contextmenu={(e) => {
						e.preventDefault();
						isContextMenuOpen = true;
						isContextX = e.clientX;
						isContextY = e.clientY;
					}}
					use:useCanvas
					class="canvas relative cursor-grab bg-slate-50 active:cursor-grabbing"
					style="
						width: {width}px;
						height: {height}px;
						background-size: 20px 20px;
						background-image: radial-gradient(#888 10%, transparent 10%);
						scale: {$bgscale};
						will-change: transform;
					"
				>
					{#each $blocks as [id, _block]}
						<Block {id} />
					{/each}
				</button>
				<div
					class="trash absolute bottom-2 right-2 text-slate-400 transition-colors duration-300 hover:text-slate-500"
				>
					<Icon class="h-10 w-10" icon="ic:round-delete" />
				</div>
				<div class="absolute bottom-0 left-0 h-3 w-full pb-2 pl-2 pr-4">
					<div
						bind:this={scrollX}
						style="width: 100%;"
						class="h-full rounded-full bg-slate-400"
					></div>
				</div>
				<div class="absolute right-0 top-0 h-full w-3 pb-4 pr-2 pt-2">
					<div
						bind:this={scrollY}
						style="height: 100%;"
						class="w-full rounded-full bg-slate-400"
					></div>
				</div>
				<div class="absolute right-6 top-6 flex flex-col gap-2">
					<button
						on:click={() => {
							$bgscale += 0.1;
							if ($bgscale > 2) $bgscale = 2;
							if ($bgscale === 0) $bgscale = 0.1;
							adjustPosition();
						}}
						class="flex items-center justify-center rounded-full border-2 border-slate-400 bg-slate-50 text-slate-400"
					>
						<Icon icon="ic:round-plus" class="h-6 w-6" />
					</button>
					<button
						on:click={() => {
							$bgscale -= 0.1;
							if ($bgscale < 0.5) $bgscale = 0.5;
							if ($bgscale === 0) $bgscale = -0.1;
							adjustPosition();
						}}
						class="flex items-center justify-center rounded-full border-2 border-slate-400 bg-slate-50 text-slate-400"
					>
						<Icon icon="ic:round-minus" class="h-6 w-6" />
					</button>
				</div>
			</div>
			<div class="h-full w-full overflow-auto bg-slate-800 p-5 text-slate-50">
				{#each $output.split('\n') as line}
					<p>{line}</p>
				{/each}
			</div>
		</div>
	</div>
</main>
