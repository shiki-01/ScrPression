<script lang="ts">
	import Icon from '@iconify/svelte';
	import Block from '$lib/components/Block.svelte';
	import type { Block as TBlock } from '$lib/types';
	import { workspace, blockspace, canvasPosition } from '$lib/stores';
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

	let scrollX: HTMLElement;
	let scrollY: HTMLElement;

	function updateCanvasSize() {
		const blocks = Array.from($workspace.blocks.values());
		if (blocks.length === 0) return;

		const xs = blocks.map((block) => Math.abs(block.position.x));
		const ys = blocks.map((block) => Math.abs(block.position.y));
		const maxX = Math.max(...xs);
		const maxY = Math.max(...ys);

		width = Math.max(2000, maxX * 2 + 1000);
		height = Math.max(2000, maxY * 2 + 1000);
	}

	const scroll = (position: {x: number, y: number}) => {
		if (scrollX && scrollY && typeof window !== 'undefined') {
			const xBarWidth = width / (window.innerWidth - 250);
			const yBarHeight = height / (window.innerHeight - 250);

			scrollX.style.width = `${window.innerWidth / xBarWidth}px`;
			scrollY.style.height = `${window.innerHeight / yBarHeight}px`;

			console.log(xBarWidth, yBarHeight);

			const xBarPosX = position.x / xBarWidth;
			const yBarPosY = position.y / yBarHeight;

			scrollX.style.transform = `translateX(${xBarPosX}px)`;
			scrollY.style.transform = `translateY(${yBarPosY}px)`;
		}
	}

	onMount(updateCanvasSize);
</script>

<main class="relative grid h-[100svh] w-[100svw] grid-cols-[250px_1fr] grid-rows-1 overflow-hidden">
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
					will-change: transform;
				"
			>
				{#each $workspace.blocks as [_, block]}
					<Block content={block} />
				{/each}
			</div>
			<div class="absolute bottom-0 left-0 px-2 pb-2 w-full h-4">
				<div
					bind:this={scrollX}
					class="h-full bg-slate-400 rounded-full"
				></div>
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
</main>
