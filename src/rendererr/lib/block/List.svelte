<script lang="ts">
	import type { BlockType } from '$lib/block/type';
	import { getColor } from '$lib/block/index';
	import { ColorPalette } from '$lib/utils/color';
	import { toast } from 'svelte-sonner';
	import Icon from '@iconify/svelte';
	import { Block } from '$lib/block/class';
	import { BlockStore } from '$lib/block/store';

	export let content: BlockType;

	const blockStore = BlockStore.getInstance();

	$: isFlag = content.type === 'flag';
	$: listWidth = listBlock ? listBlock.clientWidth + 6 : 1000;
	$: listHeight = listBlock ? listBlock.clientHeight + 6 : 60;

	let listBlock: HTMLElement;
	let listField: HTMLInputElement;
	let isDragging = false;
	let blockAdded = false;

	const addBlock = () => {
		const newId = Math.random().toString(36).substring(7);
		const newBlock: Block = Block.createBlock(content, newId, { x: 10, y: 10 });
		blockStore.addBlock(newBlock.block);

		const blockElement = document.querySelector(`[data-id="${newId}"]`);
		if (blockElement) {
			const event = new MouseEvent('pointerdown', {
				bubbles: true,
				cancelable: true,
				view: window
			});
			blockElement.dispatchEvent(event);
		}
	};

	const handlePointerDown = () => {
		isDragging = false;
		blockAdded = false;
		window.addEventListener('pointermove', handlePointerMove);
		window.addEventListener('pointerup', handlePointerUp);
	};

	const handlePointerMove = () => {
		if (!blockAdded) {
			addBlock();
			blockAdded = true;
		}
		isDragging = true;
	};

	const handlePointerUp = () => {
		window.removeEventListener('pointermove', handlePointerMove);
		window.removeEventListener('pointerup', handlePointerUp);
	};
</script>

<div
	bind:this={listBlock}
	class="cancel"
	on:pointerdown={handlePointerDown}
	role="button"
	style="z-index: {content.zIndex};"
	tabindex="0"
>
	<div
		class="relative flex h-12 w-fit cursor-pointer items-center justify-center rounded-md px-2.5 pb-1 align-middle"
		data-id={content.id}
	>
		{#if content.connections.input}
			<span
				data-id={content.id}
				class="absolute h-2 w-6"
				style="top: {content.connections.input.y}px; left: {content.connections.input.x}px;"
			></span>
		{/if}
		{#if content.connections.output}
			<span
				data-id={content.id}
				class="absolute h-2 w-6"
				style="bottom: {content.connections.output.y}px; left: {content.connections.output.x}px;"
			></span>
		{/if}
		<div class="absolute left-0 top-0 -z-10 h-0 w-full">
			<svg class="" height={listHeight} role="none" width={listWidth + 2} xmlns="http://www.w3.org/2000/svg">
				<path
					d={isFlag
						? `M 14 2 L 42 2 L ${listWidth - 14} 2 Q ${listWidth} 2 ${listWidth} 14 L ${listWidth} ${listHeight - 18} Q ${listWidth} ${listHeight - 14} ${listWidth - 4} ${listHeight - 14} L 40 ${listHeight - 14} L 40 ${listHeight - 10} Q 40 ${listHeight - 8} 36 ${listHeight - 8} L 20 ${listHeight - 8} Q 16 ${listHeight - 8} 16 ${listHeight - 10} L 16 ${listHeight - 14} L 4 ${listHeight - 14} Q 2 ${listHeight - 14} 2 ${listHeight - 18} L 2 14 Q 2 2 14 2 Z`
						: `M 4 2 L 14 2 L 14 4 Q 14 8 20 8 L 38 8 Q 42 8 42 4 L 42 2 L ${listWidth - 4} 2 Q ${listWidth} 2 ${listWidth} 4 L ${listWidth} ${listHeight - 18} Q ${listWidth} ${listHeight - 14} ${listWidth - 4} ${listHeight - 14} L 40 ${listHeight - 14} L 40 ${listHeight - 10} Q 40 ${listHeight - 8} 36 ${listHeight - 8} L 20 ${listHeight - 8} Q 16 ${listHeight - 8} 16 ${listHeight - 10} L 16 ${listHeight - 14} L 4 ${listHeight - 14} Q 2 ${listHeight - 14} 2 ${listHeight - 18} L 2 4 Q 2 2 4 2 Z`
					}
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
								style="background-color: {ColorPalette[getColor(content.type)].text}; border-color: {ColorPalette[getColor(content.type)].border}; width: calc({Math.max(2, item.content.value.length)}ch + 0.5rem)"
								class="flex h-6 min-w-[2ch] items-center rounded-full border-2 p-0 text-center align-middle text-sm text-blue-950 focus:outline-none"
								bind:value={item.content.value}
								bind:this={listField}
								on:input={() => {
									if (listField) {
										listField.style.width = `${Math.max(2, listField.value.length)}ch`;
										listWidth = listBlock.clientWidth;
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
						//const children = searchAllChildren(content.id);
						//formatOutput(children);
						//window.navigator.clipboard.writeText($output);
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