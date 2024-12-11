<script lang="ts">
	import Icon from '@iconify/svelte';
	import { useDrag } from '$lib/utils/useDrag';
	import type { Block } from '$lib/types';
	import { output, workspace } from '$lib/stores';
	import { ColorPalette } from '$lib/utils/color';
	import { formatOutput, onDrag, onDragEnd, onDragStart, updateZIndex } from '$lib/utils/block';
	import { toast } from 'svelte-sonner';
	import { onMount } from 'svelte';

	export let content: Block;
	export let strict: boolean = false;

	let block: HTMLElement;
	let field: HTMLInputElement;
	let width: number = 1000;
	let height: number = 60;
	let clientX: number = 0;
	let clientY: number = 0;

	let BlockListWidth = 250;

	$: width = block ? block.clientWidth + 6 : 1000;
	$: height = block ? block.clientHeight + 6 : 60;
	$: isFlag = content.type === 'flag';

	const searchAllChildren = (id: string): Block[] => {
		const children: Block[] = [];
		$workspace.blocks.forEach((block) => {
			if (block.parentId === id) {
				children.push(block);
				children.push(...searchAllChildren(block.id));
			}
		});
		return children;
	};

	let isDragging = false;

	$: isDragging = content.position.x <= 10;

	onMount(() => {
		let startX = content.position.x + BlockListWidth;
		let startY = content.position.y;
		let isDragging = false;
		let block = $workspace.blocks.get(content.id) || content;

		const handlePointerDown = (e: PointerEvent) => {
			if (e.buttons === 1) {
				onDragStart(content);
				isDragging = true;
				window.addEventListener('pointermove', handlePointerMove);
				window.addEventListener('pointerup', handlePointerUp);
			}
		}

		const handlePointerMove = (e: PointerEvent) => {
			if (isDragging) {
				content.position.x = e.clientX - startX;
				content.position.y = e.clientY - clientY;
				block.position.x = e.clientX - startX;
				block.position.y = e.clientY - startY;
				onDrag(content);
			}
		}

		const handlePointerUp = (e: PointerEvent) => {
			if (isDragging) {
				onDragEnd(e, content);
				isDragging = false;
				window.removeEventListener('pointerdown', handlePointerDown);
				window.removeEventListener('pointermove', handlePointerMove);
				window.removeEventListener('pointerup', handlePointerUp);
			}
		}

		window.addEventListener('pointerdown', handlePointerDown);

		return () => {
			window.removeEventListener('pointerdown', handlePointerDown);
			window.removeEventListener('pointermove', handlePointerMove);
			window.removeEventListener('pointerup', handlePointerUp);
		}
	})
</script>

<svelte:window on:mousemove={(e) => {
	clientX = e.clientX;
	clientY = e.clientY;
}} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
	bind:this={block}
	class="cancel {strict ? '' : isDragging ? 'fixed bg-red-400' : 'absolute'}"
	style="z-index: {strict ? 0 : 99999}; top: {content.position.y}px; left: {content.position.x}px;"
	role="button"
	tabindex="0"
	use:useDrag={{
		bounds: 'parent',
		position: content.position,
		content,
		onDrag: () => {
			onDrag(content)
		},
		onStart: (e) => {
			onDragStart(content);
		},
		onEnd: (e) => {
			onDragEnd(e,content);
		}
	}}
	on:click={() => {
			updateZIndex($workspace, content.id);
	}}
>
	<div
		class="relative flex h-12 w-fit cursor-pointer items-center justify-center rounded-md px-2.5 pb-1 align-middle"
		data-id={content.id}
	>
		{#if content.connections.input}
			<span
				data-id={content.id}
				class="input absolute left-4 top-0 h-2 w-6"
			></span>
		{/if}
		{#if content.connections.output}
			<span
				data-id={content.id}
				class="output absolute bottom-0 left-4 h-2 w-6"
			></span>
		{/if}
		<div class="absolute left-0 top-0 -z-10 h-0 w-full">
			<svg class="" width={width + 2} {height} role="none" xmlns="http://www.w3.org/2000/svg">
				<path
					style="filter: drop-shadow(0 4px 0 {ColorPalette[content.color].border});"
					fill={ColorPalette[content.color].bg}
					stroke={ColorPalette[content.color].border}
					stroke-width="2"
					d={isFlag
						? `M 14 2 L 42 2 L ${width - 14} 2 Q ${width} 2 ${width} 14 L ${width} ${height - 18} Q ${width} ${height - 14} ${width - 4} ${height - 14} L 40 ${height - 14} L 40 ${height - 10} Q 40 ${height - 8} 36 ${height - 8} L 20 ${height - 8} Q 16 ${height - 8} 16 ${height - 10} L 16 ${height - 14} L 4 ${height - 14} Q 2 ${height - 14} 2 ${height - 18} L 2 14 Q 2 2 14 2 Z`
						: `M 4 2 L 14 2 L 14 4 Q 14 8 20 8 L 38 8 Q 42 8 42 4 L 42 2 L ${width - 4} 2 Q ${width} 2 ${width} 4 L ${width} ${height - 18} Q ${width} ${height - 14} ${width - 4} ${height - 14} L 40 ${height - 14} L 40 ${height - 10} Q 40 ${height - 8} 36 ${height - 8} L 20 ${height - 8} Q 16 ${height - 8} 16 ${height - 10} L 16 ${height - 14} L 4 ${height - 14} Q 2 ${height - 14} 2 ${height - 18} L 2 4 Q 2 2 4 2 Z`
					}
				></path>
			</svg>
		</div>
		<div
			style="color: {ColorPalette[content.color].text};"
			class="flex h-full w-full flex-row items-center justify-center gap-4 align-middle"
		>
			<div class="whitespace-nowrap font-bold">{content.title}</div>
			<div class="flex flex-row gap-2 align-middle">
				{#each content.contents as item}
					{#if item === 'space'}
						<div class="h-5 w-[1px] bg-blue-950"></div>
					{:else}
						<div class="flex flex-row items-center justify-center gap-1.5">
							<div class="whitespace-nowrap">{item.text}</div>
							<input
								type="text"
								style="background-color: {ColorPalette[content.color].text}; border-color: {ColorPalette[content.color].border}; width: calc({Math.max(2, item.value.length)}ch + 0.5rem)"
								class="flex h-6 min-w-[2ch] items-center rounded-full border p-0 text-center align-middle text-sm text-blue-950 focus:outline-none"
								bind:value={item.value}
								bind:this={field}
								on:input={() => {
									if (field) {
										field.style.width = `${Math.max(2, field.value.length)}ch`;
										width = block.clientWidth;
									}
								}}
							/>
						</div>
					{/if}
				{/each}
			</div>
			{#if isFlag}
				<button
					on:click={() => {
						const children = searchAllChildren(content.id);
						formatOutput(children);
						window.navigator.clipboard.writeText($output);
						toast.success('Output copied to clipboard');
					}}
					class="flex items-center justify-center rounded-full border-2 p-1"
					style={`border-color: ${ColorPalette[content.color].border}; background-color: ${ColorPalette[content.color].text};`}
				>
					<Icon icon="ic:round-flag" class="h-5 w-5 text-green-400" />
				</button>
			{/if}
		</div>
	</div>
</div>
