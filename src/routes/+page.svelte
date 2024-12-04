<script lang="ts">
	import Icon from '@iconify/svelte';
	import Block from '$lib/components/Block.svelte';
	import type { Block as TBlock, WorkspaceState } from '$lib/types';
	import { workspace, blockspace, bgscale, bgsize, uisize } from '$lib/stores';
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

	let maxSize = 1000;

	function getBlocksSize() {
		if (!$workspace.blocks.size) return { width: $uisize.width, height: $uisize.height };

		const blocks = Array.from($workspace.blocks.values());
		const positions = blocks.map((block) => block.position);

		const minX = Math.min(...positions.map((p) => p.x));
		const maxX = Math.max(...positions.map((p) => p.x));
		const minY = Math.min(...positions.map((p) => p.y));
		const maxY = Math.max(...positions.map((p) => p.y));

		return {
			width: Math.min($uisize.width, maxX - minX),
			height: Math.min($uisize.height, maxY - minY)
		};
	}

	const bgsizeSet = (window: Window) => {
		const { innerWidth, innerHeight } = window;
		const width = Math.max(innerWidth, maxSize);
		const height = Math.max(innerHeight, maxSize);
		bgsize.set({ width, height });
	};

	$: $uisize.width = $bgsize.width - 250;
	$: $uisize.height = $bgsize.height - 250;

	onMount(() => {
		bgsizeSet(window);
		window.addEventListener('resize', () => bgsizeSet(window));
	});

	let container: HTMLElement;
	let isDragging = false;
	let translate = { x: 0, y: 0 };
	let startPos = { x: 0, y: 0 };

	function handleMouseDown(e: MouseEvent) {
		if (!$blockspace) return;
		isDragging = true;
		startPos = {
			x: e.clientX - translate.x,
			y: e.clientY - translate.y
		};
		$blockspace.style.cursor = 'grabbing';
	}

	function handleMouseMove(e: MouseEvent) {
		if (!isDragging || !container || !$blockspace) return;

		if (typeof window !== 'undefined') {
			e.preventDefault();
			const cancels = window.document.querySelectorAll('.cancel');
			for (const cancel of cancels) {
				if (cancel.contains(e.target as Node)) return;
			}
		};

		const containerRect = container.getBoundingClientRect();
		const blockspaceRect = $blockspace.getBoundingClientRect();

		// 新しい位置を計算
		let newX = e.clientX - startPos.x;
		let newY = e.clientY - startPos.y;

		// 制限を設定
		const minX = containerRect.width - blockspaceRect.width;
		const minY = containerRect.height - blockspaceRect.height;

		// 範囲内に収める
		newX = Math.min(0, Math.max(minX, newX));
		newY = Math.min(0, Math.max(minY, newY));

		translate = { x: newX, y: newY };
		$blockspace.style.transform = `translate(${newX}px, ${newY}px)`;
	}

	function handleMouseUp() {
		if (!$blockspace) return;
		isDragging = false;
		$blockspace.style.cursor = 'grab';
	}

	// リサイズ処理
	onMount(() => {
		bgsizeSet(window);
		window.addEventListener('resize', () => bgsizeSet(window));

		// 初期カーソルスタイルを設定
		if ($blockspace) {
			$blockspace.style.cursor = 'grab';
		}

		return () => {
			window.removeEventListener('resize', () => bgsizeSet(window));
		};
	});
</script>

<svelte:window on:pointermove={handleMouseMove} on:pointerup={handleMouseUp} />

<main class="relative grid h-[100svh] w-[100svw] grid-cols-[250px_1fr] overflow-hidden">
	<div
		class="relative flex h-full w-full flex-col items-start gap-5 overflow-auto bg-slate-200 p-5"
	>
		<Block strict={true} {content} />
		<Block strict={true} content={content2} />
		<Block strict={true} content={content3} />
	</div>
	<div class="grid" style="grid-template-rows: 1fr 250px;">
		<div class="relative h-full w-full overflow-hidden" bind:this={container}>
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				bind:this={$blockspace}
				class="relative cursor-grab bg-slate-50 active:cursor-grabbing"
				on:pointerdown={handleMouseDown}
				style="
					width: {$bgsize.width + maxSize}px;
					height: {$bgsize.height + maxSize}px;
					background-size: 20px 20px;
					background-image: radial-gradient(#888 10%, transparent 10%);
					will-change: transform;
					transform: translate({translate.x}px, {translate.y}px);
				"
			>
				{#each $workspace.blocks as [_, block]}
					<Block content={block} />
				{/each}
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
