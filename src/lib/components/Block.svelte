<script lang="ts">
	import { draggable } from '@neodrag/svelte';
	import type { Block } from '$lib/types';
	import { workspace, blockspace } from '$lib/stores';

	export let content: Block;
	export let strict = false;

	let input: HTMLElement;
	let output: HTMLElement;
	let isConnect: boolean = false;

	const addBlock = () => {
		const newId = Math.random().toString(36).substring(7);
        workspace.update((ws) => {
			let newCon = content;
			newCon.id = newId;
			ws.blocks.set(newId, newCon);
			return ws;
		})
        console.log($workspace.blocks);
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

	const updateChildrenPosition = () => {
		const childBlock = $workspace.blocks.get(content.children);
		console.log('update');
		if (childBlock && childBlock.parentId === content.id) {
			console.log('update');
			childBlock.position.x = content.position.x + 100;
			childBlock.position.y = content.position.y;
		}
	};

	$: updateChildrenPosition();
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
	class:absolute={!strict}
	style="left: 10px; top: 10px;"
	role="button"
	tabindex="0"
	use:draggable={{
		bounds: 'parent',
		disabled: strict,
		position: content.position,
		onDrag: (e) => {
			if (!input || !output || !$blockspace) return;
			if (!isConnect) {
			    content.position.x = e.offsetX;
				content.position.y = e.offsetY;
			}
			const inputs = $blockspace.querySelectorAll('.input');
			const outputs = $blockspace.querySelectorAll('.output');
			console.log(outputs);
			for (let i = 0; i < outputs.length; i++) {
                const outputElement = outputs[i] as HTMLElement;
                if (outputElement.dataset.id === content.id) continue;
                if (overlap(outputElement, input)) {
                    if (isConnect) return;
                    const targetID = outputElement.dataset.id;
                    if (targetID) {
                        isConnect = true;
                        const targetBlock = $workspace.blocks.get(targetID);
                        if (targetBlock && targetBlock.children !== content.id && content.parentId !== targetID) {
                            targetBlock.children = content.id;
                        }
                        if (content.children !== targetID && content.parentId !== targetID) {
                            content.parentId = targetID;
                        }
                    }
                    console.log('output', content.parentId, targetID);
                    console.log($workspace.blocks);
                    return;
                }
            }
		}
	}}
	on:click={() => {
		if (strict) addBlock();
	}}
>
	<div
		class="clip-path relative flex h-10 w-fit cursor-pointer rounded-md bg-blue-400 px-2.5 py-2"
		data-id={content.id}
	>
		{#if content.connections.input}
			<span
				bind:this={input}
				data-id={content.id}
				class:input={!strict}
				class="absolute left-4 top-0 h-1 w-5 rounded-b-[4px] bg-none"
			></span>
		{/if}
		{#if content.connections.output}
			<span
				bind:this={output}
				data-id={content.id}
				class:output={!strict}
				class="absolute -bottom-1 left-4 h-1 w-5 rounded-b-[4px] bg-blue-400"
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
								value={item.text}
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
