<script lang="ts">
	import { ColorPalette } from '$lib/utils/color';
	import { getColor } from '$lib/block/index';
	import { toast } from 'svelte-sonner';
	import Icon from '@iconify/svelte';
	import type { BlockType } from '$lib/block/type';
	import { BlockStore } from '$lib/block/store';
	import { onMount } from 'svelte';
	import { useDrag } from '$lib/utils/useDrag';
	import { output } from '$lib/stores';
	import { onDrag, onDragStart, onDragEnd, formatOutput } from '$lib/utils/block';

	export let id: string;

	const blockStore = BlockStore.getInstance();

	let content: BlockType = blockStore.getBlock(id) as BlockType;
	$: blockStore.subscribeBlocks((value) => {
		content = value.get(id) as BlockType;
	});

	$: isFlag = content.type === 'flag';
	$: width = block ? block.clientWidth + 6 : 1000;
	$: height = block ? block.clientHeight + 6 : 60;

	let block: HTMLElement;
	let field: HTMLInputElement;

	onMount(() => {
		if (block) {
			width = block.clientWidth + 6;
			height = block.clientHeight + 6;
		}
	});

	function searchAllChildren(id: string) {
		const children: BlockType[] = [];
		blockStore.getBlocks().forEach((block) => {
			if (block.parentId === id) {
				children.push(block);
				children.push(...searchAllChildren(block.id));
			}
		});
		return children;
	}
</script>

<div
	bind:this={block}
	class="cancel absolute"
	role="button"
	style="z-index: {content.zIndex}; top: {content.position.y}px; left: {content.position.x}px;"
	tabindex="0"
	use:useDrag={{
        bounds: 'parent',
        position: content.position,
        content: content,
        onStart: () => {
						onDragStart(content);
        },
        onEnd: (e) => {
						onDragEnd(e, content);
        },
        onDrag: () => {
						onDrag(content);
        },
    }}
>
	<div
		class="relative flex h-12 w-fit cursor-pointer items-center justify-center rounded-md px-2.5 pb-1 align-middle"
		data-id={content.id}
	>
		{#if content.connections.input}
            <span
							data-id={content.id}
							class="input absolute h-2 w-6"
							style="top: {content.connections.input.y}px; left: {content.connections.input.x}px;"
						></span>
		{/if}
		{#if content.connections.output}
            <span
							data-id={content.id}
							class="output absolute h-2 w-6"
							style="bottom: {content.connections.output.y}px; left: {content.connections.output.x}px;"
						></span>
		{/if}
		<div class="absolute left-0 top-0 -z-10 h-0 w-full">
			<svg class="" {height} role="none" width={width + 2} xmlns="http://www.w3.org/2000/svg">
				<path
					d={isFlag
                        ? `M 14 2 L 42 2 L ${width - 14} 2 Q ${width} 2 ${width} 14 L ${width} ${height - 18} Q ${width} ${height - 14} ${width - 4} ${height - 14} L 40 ${height - 14} L 40 ${height - 10} Q 40 ${height - 8} 36 ${height - 8} L 20 ${height - 8} Q 16 ${height - 8} 16 ${height - 10} L 16 ${height - 14} L 4 ${height - 14} Q 2 ${height - 14} 2 ${height - 18} L 2 14 Q 2 2 14 2 Z`
                        : `M 4 2 L 14 2 L 14 4 Q 14 8 20 8 L 38 8 Q 42 8 42 4 L 42 2 L ${width - 4} 2 Q ${width} 2 ${width} 4 L ${width} ${height - 18} Q ${width} ${height - 14} ${width - 4} ${height - 14} L 40 ${height - 14} L 40 ${height - 10} Q 40 ${height - 8} 36 ${height - 8} L 20 ${height - 8} Q 16 ${height - 8} 16 ${height - 10} L 16 ${height - 14} L 4 ${height - 14} Q 2 ${height - 14} 2 ${height - 18} L 2 4 Q 2 2 4 2 Z`}
					fill={ColorPalette[getColor(content.type)].bg}
					stroke={ColorPalette[getColor(content.type)].border}
					stroke-width="2"
					style="filter: drop-shadow(0 4px 0 {ColorPalette[getColor(content.type)].border});"
				></path>
			</svg>
		</div>
		<div
			class="flex h-full w-full flex-row items-center justify-center gap-4 align-middle"
			style="color: {ColorPalette[getColor(content.type)].text};"
		>
			<div class="whitespace-nowrap font-bold">{content.title}</div>
			<div class="flex flex-row gap-2 align-middle">
				{#each content.contents as item}
					{#if item.type === 'separator'}
						<div class="h-5 w-[1px] bg-blue-950"></div>
					{:else if item.type === 'value'}
						<div class="flex flex-row items-center justify-center gap-1.5">
							<div class="whitespace-nowrap">{item.content.title}</div>
							<input
								type="text"
								style="background-color: {ColorPalette[getColor(content.type)]
                                    .text}; border-color: {ColorPalette[getColor(content.type)]
                                    .border}; width: calc({Math.max(2, item.content.value.length)}ch + 0.5rem)"
								class="flex h-6 min-w-[2ch] items-center rounded-full border-2 p-0 text-center align-middle text-sm text-blue-950 focus:outline-none"
								bind:value={item.content.value}
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
					style={`border-color: ${ColorPalette[getColor(content.type)].border}; background-color: ${ColorPalette[getColor(content.type)].text};`}
				>
					<Icon icon="ic:round-flag" class="h-5 w-5 text-green-400" />
				</button>
			{/if}
		</div>
	</div>
</div>