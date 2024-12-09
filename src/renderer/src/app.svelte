<script lang="ts">
	import Icon from '@iconify/svelte';
	import ContextMenu from '../lib/components/ContextMenu.svelte';
	import Block from '../lib/components/Block.svelte';
	import Value from '../lib/components/Value.svelte';
	import type { Block as TBlock, WorkspaceState } from '../lib/types';
	import { bgscale, blockspace, canvasPosition, output, redo, undo, workspace } from '../lib/stores';
	import { useCanvas } from '../lib/utils/useCanvas';
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';

	const content: TBlock = {
		id: '',
		title: 'random',
		output: 'wiggle(${x}, ${y});',
		type: 'normal',
		color: 'blue',
		contents: [
			{
				id: 'x',
				text: 'X',
				type: 'value',
				inputType: 'number',
				value: '0'
			},
			{
				id: 'y',
				text: 'Y',
				type: 'value',
				inputType: 'number',
				value: '0'
			}
		],
		connections: {
			input: true,
			output: true
		},
		position: {
			x: -1010,
			y: -500
		},
		children: '',
		parentId: '',
		depth: 0,
		zIndex: 0
	};

	const content2: TBlock = {
		id: '',
		title: 'null comp',
		output: 'comp("${part}").layer("${null}").transform.${propate};',
		type: 'normal',
		color: 'red',
		contents: [
			{
				id: 'part',
				text: 'Part',
				type: 'value',
				inputType: 'text',
				value: 'head'
			},
			{
				id: 'null',
				text: 'Null',
				type: 'value',
				inputType: 'text',
				value: 'null'
			},
			{
				id: 'propate',
				text: 'Property',
				type: 'value',
				inputType: 'text',
				value: 'position'
			}
		],
		connections: {
			input: true,
			output: true
		},
		position: {
			x: 10,
			y: 10
		},
		children: '',
		parentId: '',
		depth: 0,
		zIndex: 0
	};

	const content3: TBlock = {
		id: '',
		title: '干渉',
		output: 'value / length(toComp([0,0]), toComp([0.7071,0.7071])) || 0.001;',
		type: 'normal',
		color: 'orange',
		contents: [],
		connections: {
			input: true,
			output: true
		},
		position: {
			x: 10,
			y: 10
		},
		children: '',
		parentId: '',
		depth: 0,
		zIndex: 0
	};

	const content4: TBlock = {
		id: '',
		title: 'Random',
		output: 'Math.random() * (${max} - ${min}) + ${min}',
		type: 'normal',
		color: 'green',
		contents: [
			{
				id: 'min',
				text: 'Min',
				type: 'value',
				inputType: 'number',
				value: '0'
			},
			{
				id: 'max',
				text: 'Max',
				type: 'value',
				inputType: 'number',
				value: '0'
			}
		],
		connections: {
			input: true,
			output: true
		},
		position: {
			x: 10,
			y: 10
		},
		children: '',
		parentId: '',
		depth: 0,
		zIndex: 0
	};

	const content5: TBlock = {
		id: '',
		title: 'Start',
		output: '',
		type: 'flag',
		color: 'yellow',
		contents: [],
		connections: {
			input: false,
			output: true
		},
		position: {
			x: 10,
			y: 10
		},
		children: '',
		parentId: '',
		depth: 0,
		zIndex: 0
	};

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
	//$: updateCanvasSize($workspace)

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

</script>

{#if isAdd}
	<div
		transition:fly={{ y: -10, duration: 200 }}
		class="fixed right-20 top-[40px] z-10 flex flex-col gap-2 rounded-lg bg-slate-200 px-4 py-2"
	>
		<button class="justify-bewteen flex flex-row items-center gap-2">
			Project
			<Icon icon="ic:round-insert-drive-file" class="h-6 w-6" />
		</button>
		<span class="h-[1px] w-full bg-slate-800"></span>
		<button class="flex flex-row items-center justify-between gap-2">
			Block
			<Icon icon="ic:round-code" class="h-6 w-6" />
		</button>
	</div>
{/if}

<ContextMenu bind:isOpen={isContextMenuOpen} clientX={isContextX} clientY={isContextY} />

<main
	bind:this={main}
	class="relative grid h-[100svh] w-[100svw] grid-rows-[50px_1fr] overflow-hidden"
>
	<div class="flex h-full w-full flex-row justify-between bg-slate-500 px-5">
		<div class="flex flex-row gap-4">
			<div class="h-full w-[100px]">
			    <img src="https://placehold.jp/200x200" alt="logo" class="h-full w-full object-cover" />
		    </div>
			<div class="flex flex-row gap-2 py-2">
				<div>
					<input
					    type="text"
						class="h-full w-[200px] px-2"
						placeholder={$workspace.title}
					/>
				</div>
				<div class="h-full flex flex-row gap-2 text-slate-50 items-center justify-center">
				    <button on:click={undo}>
					    <Icon icon="ic:round-chevron-left" class="h-6 w-6" />
                    </button>
				    <button on:click={redo}>
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
			class="relative flex h-full w-full flex-col items-start gap-5 overflow-auto bg-slate-200 p-5"
		>
			<Block strict={true} {content} />
			<Block strict={true} content={content2} />
			<Block strict={true} content={content3} />
			<Value strict={true} content={content4} />
			<Block content={content5} strict={true} />
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
					class="relative cursor-grab bg-slate-50 active:cursor-grabbing"
					style="
						width: {width}px;
						height: {height}px;
						background-size: 20px 20px;
						background-image: radial-gradient(#888 10%, transparent 10%);
						scale: {$bgscale};
						will-change: transform;
					"
				>
					{#each $workspace.blocks as [_, block]}
						{#if block.color === 'blue' || block.color === 'red' || block.color === 'orange' || block.color === 'yellow'}
							<Block content={block} />
						{:else if block.color === 'green'}
							<Value content={block} />
						{/if}
					{/each}
				</button>
				<div class="trash absolute bottom-2 right-2 text-slate-400 hover:text-slate-500 transition-colors duration-300">
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
				<div class="absolute top-6 right-6 flex flex-col gap-2">
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
			<div class="h-full w-full overflow-auto bg-slate-800 text-slate-50 p-5">
				{#each $output.split('\n') as line}
					<p>{line}</p>
				{/each}
			</div>
		</div>
	</div>
</main>
