<script lang="ts">
	import Icon from '@iconify/svelte';
	import { workspace } from '$lib/stores/workspace';
	import { EventManager } from '$lib/managers/EventManager';
	import type { Block } from '../types';
	import { ColorPalette } from '../utils/color';
	import { onMount } from 'svelte';
	import { useDrag } from '$lib/utils/useDrag';
	import { toast } from 'svelte-sonner';

	export let id: string;

	let block: HTMLElement;
	let inputFields: HTMLInputElement[] = [];
	let width = 0;
	let height = 54;

	$: content = $workspace.blocks.get(id) as Block | undefined;
	$: width = block ? block.clientWidth + 6 : 0;
	$: height = block ? block.clientHeight + 6 : 54;
	$: isFlag = content?.type === 'flag';

	function handlePointerDown(e: PointerEvent) {
		if (e.target instanceof HTMLInputElement) return;
		EventManager.emit(`block:dragStart:${id}`, { event: e });
	}

	function handleInputChange(contentId: string, value: string) {
		if (!content) return;
		workspace.updateBlock(id, {
			contents: content.contents.map(c =>
				typeof c === 'object' && c.id === contentId ? { ...c, value } : c
			)
		});
		inputFields.forEach(input => {
			if (input.id === contentId) {
				input.style.width = `calc(${Math.max(2, value.length)}ch + 0.5rem)`;
			}
		});
		width = block.clientWidth + 6;
	}

	function handleCopyOutput() {
		if (!content || !isFlag) return;
		EventManager.emit('block:copyOutput', { id });
	}

	let isDragging = false;

	onMount(() => {
		if (block) {
			width = block.clientWidth + 6;
			height = block.clientHeight + 6;

			inputFields = Array.from(block.querySelectorAll('input'));
		}

		let startX = 0;
		let startY = 0;
		let initialX = 0;
		let initialY = 0;
		if (content) {
			initialX = content.position.x || 0;
			initialY = content.position.y || 0;
		}

		const onPointerMove = (event: PointerEvent) => {
			if (!isDragging) return;

			event.preventDefault();
			const deltaX = event.clientX - startX;
			const deltaY = event.clientY - startY;

			let newX = initialX + deltaX;
			let newY = initialY + deltaY;

			const parentRect = block?.parentElement?.getBoundingClientRect();
			if (parentRect) {
				const maxX = parentRect.width - block.offsetWidth;
				const maxY = parentRect.height - block.offsetHeight;
				newX = Math.min(newX, maxX);
				newY = Math.max(0, Math.min(newY, maxY));
			}

			if (content) {
				content.position.x = newX;
				content.position.y = newY;
				workspace.blockUpdate(content.id, content);
			}

			EventManager.emit('block:drag', { event });
		};

		const onPointerUp = (event: PointerEvent) => {
			isDragging = false;
			window.removeEventListener('pointermove', onPointerMove);
			window.removeEventListener('pointerup', onPointerUp);
			EventManager.emit('block:dragEnd', { event });
		};

		EventManager.on(`block:dragStart:${id}`, ({ event }: { event: PointerEvent }) => {
			if (isDragging || !content) return;
			isDragging = true;
			startX = event.clientX;
			startY = event.clientY;
			initialX = content?.position.x || 0;
			initialY = content?.position.y || 0;
			window.addEventListener('pointermove', onPointerMove);
			window.addEventListener('pointerup', onPointerUp);
		});
	});

</script>

{#if content}
	<div
		bind:this={block}
		class="cancel absolute"
		role="button"
		tabindex="0"
		data-block-id={id}
		on:pointerdown={handlePointerDown}
		style="
			top: {content.position.y}px;
			left: {content.position.x}px;
			z-index: {content.zIndex};
	"
	>
		<div
			class="relative flex h-12 w-fit cursor-pointer items-center justify-center rounded-md px-2.5 pb-1 align-middle"
		>
			{#if content.connections.input}
				<div class="absolute left-4 top-0 h-2 w-6" data-id={id}></div>
			{/if}
			{#if content.connections.output}
				<div class="absolute bottom-0 left-4 h-2 w-6" data-id={id}></div>
			{/if}

			<div class="absolute left-0 top-0 -z-10 h-0 w-full">
				<svg {height} {width}>
					<path
						class="block-path"
						d={isFlag
						? `M 14 2 L 42 2 L ${width - 14} 2 Q ${width} 2 ${width} 14 L ${width} ${height - 18} Q ${width} ${height - 14} ${width - 4} ${height - 14} L 40 ${height - 14} L 40 ${height - 10} Q 40 ${height - 8} 36 ${height - 8} L 20 ${height - 8} Q 16 ${height - 8} 16 ${height - 10} L 16 ${height - 14} L 4 ${height - 14} Q 2 ${height - 14} 2 ${height - 18} L 2 14 Q 2 2 14 2 Z`
						: `M 4 2 L 14 2 L 14 4 Q 14 8 20 8 L 38 8 Q 42 8 42 4 L 42 2 L ${width - 4} 2 Q ${width} 2 ${width} 4 L ${width} ${height - 18} Q ${width} ${height - 14} ${width - 4} ${height - 14} L 40 ${height - 14} L 40 ${height - 10} Q 40 ${height - 8} 36 ${height - 8} L 20 ${height - 8} Q 16 ${height - 8} 16 ${height - 10} L 16 ${height - 14} L 4 ${height - 14} Q 2 ${height - 14} 2 ${height - 18} L 2 4 Q 2 2 4 2 Z`
					}
						fill={ColorPalette[content.color || 'blue'].bg}
						stroke={ColorPalette[content.color || 'blue'].border}
						stroke-width="2"
						style="filter: drop-shadow(0 4px 0 {ColorPalette[content.color].border});"
					/>
				</svg>
			</div>

			<div
				class="flex h-full w-full flex-row items-center justify-center gap-4 align-middle"
				style="color: {ColorPalette[content.color].text};"
			>
				<span class="whitespace-nowrap font-bold">{content.title}</span>

				<div class="flex flex-row gap-2 align-middle">
					{#if content.contents}
						{#each content.contents as field}
							{#if field === 'space'}
								<div class="h-5 w-[1px] bg-blue-950"></div>
							{:else}
								<div class="flex flex-row items-center justify-center gap-1.5">
									<span class="whitespace-nowrap">{field.text}</span>
									<input
										type="text"
										style="background-color: {ColorPalette[content.color].text}; border-color: {ColorPalette[content.color].border}; width: calc({Math.max(2, field.value.length)}ch + 0.5rem)"
										class="flex h-6 min-w-[2ch] items-center rounded-full border p-0 text-center align-middle text-sm text-blue-950 focus:outline-none"
										value={field.value}
										on:input={(e) => handleInputChange(field.id, e.currentTarget.value)}
									/>
								</div>
							{/if}
						{/each}
					{/if}
				</div>

				{#if isFlag}
					<button
						class="flex items-center justify-center rounded-full border-2 p-1"
						style={`border-color: ${ColorPalette[content.color].border}; background-color: ${ColorPalette[content.color].text};`}
						on:click={handleCopyOutput}
					>
						<Icon icon="ic:round-flag" />
					</button>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style></style>