<script lang="ts">
	import Icon from '@iconify/svelte';
	import Block from '$lib/components/Block.svelte';
	import type { Block as TBlock, WorkspaceState } from '$lib/types';
	import { workspace, blockspace, canvasPosition, bgscale } from '$lib/stores';
	import { useCanvas } from '$lib/utils/useCanvas';
	import { onMount } from 'svelte';

	const content: TBlock = {
		id: '',
		title: 'random',
		output: 'wiggle(${x}, ${y})',
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
		depth: 0
	};

	const content2: TBlock = {
		id: '',
		title: 'null comp',
		output: 'comp("${part}").layer("${null}").transform.${propate}',
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
		depth: 0
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
		depth: 0
	};

	function formatOutput(block: TBlock) {
		let output = block.output;
		block.contents.forEach((content) => {
			if (content === 'space') return;
			const regex = new RegExp(`\\$\\{${content.id}\\}`, 'g');
			output = output.replace(regex, content.value);
		});
		return output;
	}

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

	const scroll = (position: {x: number, y: number}) => {
		if (scrollX && scrollY && main) {
			const clientWidth = main.clientWidth - 250 - 16 - 16 - 16;
			const clientHeight = main.clientHeight - 250 - 50 - 16 - 16 - 16;

			const xBarWidth = width * $bgscale / clientWidth;
			const yBarHeight = height * $bgscale / clientHeight;

			scrollX.style.width = `${clientWidth / xBarWidth}px`;
			scrollY.style.height = `${clientHeight / yBarHeight}px`;

			const xBarPosX = position.x / xBarWidth;
			const yBarPosY = position.y / yBarHeight;

			scrollX.style.transform = `translateX(calc(${-xBarPosX}px))`;
			scrollY.style.transform = `translateY(calc(${-yBarPosY}px))`;
		}
	}

	$: scroll($canvasPosition);
	//$: updateCanvasSize($workspace)

	onMount(() => {
		updateCanvasSize($workspace);
		scroll($canvasPosition)
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
</script>

<main bind:this={main} class="relative grid h-[100svh] w-[100svw] grid-rows-[50px_1fr] overflow-hidden">
	<div class="w-full h-full flex flex-row justify-between bg-slate-500 px-5">
		<div class="w-[100px] h-full">
			<img src="https://placehold.jp/200x200" alt="logo" class="w-full h-full object-cover" />
		</div>
		<div class="flex flex-row gap-4 h-full justify-center items-center text-slate-50">
			<button class="flex w-full h-full justify-center items-center">
				<Icon icon="ic:round-add" class="h-6 w-6" />
			</button>
			<button class="flex w-full h-full justify-center items-center">
				<Icon icon="ic:round-share" class="h-6 w-6" />
			</button>
			<button class="flex w-full h-full justify-center items-center">
				<Icon icon="ic:round-settings" class="h-6 w-6" />
			</button>
		</div>
	</div>
	<div class="grid grid-cols-[250px_1fr] grid-rows-1 overflow-hidden">
		<div
		class="relative flex h-full w-full flex-col items-start gap-5 overflow-auto bg-slate-200 p-5"
	>
		<Block strict={true} {content} />
		<Block strict={true} content={content2} />
		<Block strict={true} content={content3} />
	</div>
	<div class="grid" style="grid-template-rows: 1fr 250px;">
		<div class="relative h-full w-full overflow-hidden">
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				bind:this={$blockspace}
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
					<Block content={block} />
				{/each}
			</div>
			<div class="absolute bottom-0 left-0 pl-2 pr-4 pb-2 w-full h-3">
				<div
					bind:this={scrollX}
					style="width: 100%;"
					class="h-full bg-slate-400 rounded-full"
				></div>
			</div>
			<div class="absolute top-0 right-0 pt-2 pb-4 pr-2 w-3 h-full">
				<div
				    bind:this={scrollY}
					style="height: 100%;"
					class="w-full bg-slate-400 rounded-full"
				></div>
			</div>
			<div class="absolute bottom-6 right-6 flex flex-col gap-2">
				<button
				    on:click={() =>  {
						$bgscale += 0.1;
						if ($bgscale > 2) $bgscale = 2;
						if ($bgscale === 0) $bgscale = 0.1;
						adjustPosition();
					}}
			        class="flex items-center justify-center rounded-full border-2 border-slate-400 text-slate-400 bg-slate-50"
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
				    class="flex justify-center items-center rounded-full border-2 border-slate-400 text-slate-400 bg-slate-50"
				>
					<Icon icon="ic:round-minus" class="h-6 w-6" />
				</button>
			</div>
		</div>
		<div class="h-full w-full overflow-auto bg-slate-800 p-5">
			{#each $workspace.blocks as [_, block]}
				<div class="mb-2 text-white">
					<strong>Block ID:</strong>
					{block.id}<br />
					<strong>Output:</strong>
					{formatOutput(block)}
				</div>
			{/each}
		</div>
	</div>
	<button
		class="absolute bottom-8 right-8 flex flex-row items-center justify-center gap-1 rounded-full bg-blue-600 px-4 py-2 text-white shadow-md shadow-blue-600/40 transition-shadow duration-300 hover:shadow-lg hover:shadow-blue-600/50"
	>
		Output
		<Icon icon="ic:twotone-output" class="h-6 w-6" />
	</button>
	</div>
</main>
