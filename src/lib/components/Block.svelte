<script lang="ts">
	import { draggable } from '@neodrag/svelte';
	import type { Block } from '$lib/types';
	import { workspace, blockspace } from '$lib/stores';

	export let content: Block;
	export let strict: boolean = false;

	let input: HTMLElement;
	let output: HTMLElement;
	let isConnect: boolean = false;

	const addBlock = () => {
		const newId = Math.random().toString(36).substring(7);
		workspace.update((ws) => {
			let newCon = JSON.parse(JSON.stringify(content));
			newCon.id = newId;
			ws.blocks.set(newId, newCon);
			return ws;
		});
	};

	const overlap = (node: HTMLElement, target: HTMLElement) => {
		const nodeRect = node.getBoundingClientRect();
		const targetRect = target.getBoundingClientRect();
		return !(
			nodeRect.right < targetRect.left ||
			nodeRect.left > targetRect.right ||
			nodeRect.bottom < targetRect.top ||
			nodeRect.top > targetRect.bottom
		);
	};

	const updateChildrenPositions = () => {
		workspace.update((ws) => {
			const block = ws.blocks.get(content.id);
			if (!block) return ws;

			if (block.children) {
				const childBlock = ws.blocks.get(block.children);
				if (childBlock) {
					childBlock.position.x = block.position.x + 0;
					childBlock.position.y = block.position.y + 38.5;
					ws.blocks.set(block.children, childBlock);
				}
			}
			return ws;
		});
	};

	const onDrag = (e: { offsetX: number; offsetY: number }) => {
		if (!input || !output || !$blockspace) return;

		if (!isConnect) {
			workspace.update((ws) => {
				const block = ws.blocks.get(content.id);
				if (block) {
					block.position.x = e.offsetX;
					block.position.y = e.offsetY;
					ws.blocks.set(content.id, block);
				}
				return ws;
			});

			updateChildrenPositions();
		}

		const inputs = $blockspace.querySelectorAll('.input');
		const outputs = $blockspace.querySelectorAll('.output');
		for (let i = 0; i < outputs.length; i++) {
			if (isConnect) return;
			const outputElement = outputs[i] as HTMLElement;
			const targetID = outputElement.dataset.id;
			if (!targetID) continue;
			if (targetID === content.id) continue;
			if (overlap(outputElement, input)) {
				isConnect = true;
				workspace.update((ws) => {
					const targetBlock = ws.blocks.get(targetID);
					const currentBlock = ws.blocks.get(content.id);

					if (
						targetBlock &&
						targetBlock.children !== content.id &&
						currentBlock?.parentId !== targetID
					) {
						targetBlock.children = content.id;
						ws.blocks.set(targetID, targetBlock);
					}

					if (
						currentBlock &&
						currentBlock.children !== targetID &&
						currentBlock.parentId !== targetID
					) {
						currentBlock.parentId = targetID;
						ws.blocks.set(content.id, currentBlock);
					}

					return ws;
				});
				return;
			}
		}
	};
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
	class:absolute={!strict}
	
	role="button"
	tabindex="0"
	use:draggable={{
		bounds: 'parent',
		disabled: strict,
		position: content.position,
		onDrag
	}}
	on:click={() => {
		if (strict) addBlock();
	}}
>
	<div
		class="clip-path relative flex h-10 w-fit cursor-pointer rounded-md bg-blue-400 border-2 border-blue-600 px-2.5 py-2"
		data-id={content.id}
	>
		{#if content.connections.input}
			<span
				bind:this={input}
				data-id={content.id}
				class:input={!strict}
				class="absolute left-3 top-0 h-1 w-6 bg-none border-2 border-blue-600"
			></span>
		{/if}
		{#if content.connections.output}
			<span
				bind:this={output}
				data-id={content.id}
				class:output={!strict}
				class="absolute -bottom-1.5 left-3 h-1.5 w-6 bg-blue-400 border-2 border-t-0 border-blue-600"
			></span>
		{/if}
		<div class="flex flex-row items-center justify-center gap-4 align-middle">
			<div class="font-bold text-blue-950">{content.title}</div>
			<div class="flex flex-row gap-2 align-middle">
				{#each content.contents as item}
					{#if item === 'space'}
						<div class="h-5 w-[1px] bg-blue-950"></div>
					{:else}
						<div class="flex flex-row items-center justify-center gap-1">
							<div>{item.text}</div>
							<input
								type={item.type}
								class="h-5 w-10 overflow-x-auto rounded-full border-2 border-blue-600 bg-blue-200 p-0 pl-2 text-sm text-blue-950 focus:outline-none"
								bind:value={item.value}
							/>
						</div>
					{/if}
				{/each}
			</div>
		</div>
	</div>
</div>

<style>
	.clip-path {
		clip-path: polygon(
			0 0,
			1rem 0,
			1rem 0.25rem,
			calc(1rem + 1.25rem) 0.25rem,
			calc(1rem + 1.25rem) 0,
			100% 0,
			100% calc(100% + 0.25rem),
			0 calc(100% + 0.25rem)
		);
	}
</style>
