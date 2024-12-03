<script lang="ts">
	import { draggable } from '@neodrag/svelte';
	import type { Block } from '$lib/types';
	import { workspace } from '$lib/stores';

	export let content: Block;
	export let strict = false;

	let input: HTMLElement;
	let output: HTMLElement;

	let isConnect: boolean = false;

	$: if(typeof window !== 'undefined' && content.children.length > 0) {
		for (const child of content.children) {
			const childBlock = $workspace.blocks.get(child);
			if (childBlock && childBlock.parentId === content.id) {
				childBlock.position.x = content.position.x + 100;
				childBlock.position.y = content.position.y;
			}
		}
	}
	
	const addBlock = () => {
		const uuid = Math.random().toString(36).substring(7);
		content.id = uuid;
		workspace.update(ws => {
			ws.blocks.set(uuid, content);
			return ws;
		});
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
			if(!input || !output || typeof window === 'undefined') return;
			if (!isConnect) {
				content.position.x = e.offsetX;
				content.position.y = e.offsetY;
			} else {
				const parent = document.querySelector(`[data-id="${content.parentId}"]`);
				if (parent) {
					content.position.x = parent.getBoundingClientRect().left + parent.getBoundingClientRect().width;
					content.position.y = parent.getBoundingClientRect().top + parent.getBoundingClientRect().height / 2;
				}
			}
			const inputs = document.querySelectorAll('.input');
			const outputs = document.querySelectorAll('.output');
			for(let i = 0; i < inputs.length; i++) {
				if(overlap(inputs[i] as HTMLElement, output)) {
					if (isConnect) return;
					const targetID = (outputs[i] as HTMLElement).dataset.id;
					if (targetID) {
						isConnect = true;
						const targetBlock = $workspace.blocks.get(targetID);
						if (targetBlock) {
							targetBlock.children.push(content.id);
						}
						const contentBlock = $workspace.blocks.get(content.id);
						if (contentBlock) {
							contentBlock.parentId = targetID;
						}
					}
					console.log('input');
					console.log($workspace.blocks);
				}
			}
			for(let i = 0; i < outputs.length; i++) {
				if(overlap(outputs[i] as HTMLElement, input)) {
					if (isConnect) return;
					const targetID = (inputs[i] as HTMLElement).dataset.id;
					if (targetID) {
						isConnect = true;
                        const targetBlock = $workspace.blocks.get(targetID);
                        if (targetBlock) {
                            targetBlock.children.push(content.id);
                        }
                        const contentBlock = $workspace.blocks.get(content.id);
                        if (contentBlock) {
                            contentBlock.parentId = targetID;
                        }
                    }
					console.log('output');
					console.log($workspace.blocks);
					
				}
			}
		},
	}}
	on:click={() => {
		if(strict) addBlock();
	}}
>
	<div
		class="clip-path relative flex h-10 w-fit cursor-pointer rounded-md bg-blue-400 px-2.5 py-2"
		data-id={content.id}
	>
		{#if content.connections.input}
			<span bind:this={input} data-id={content.id} class="input absolute left-4 top-0 h-1 w-5 rounded-b-[4px] bg-none"></span>
		{/if}
		{#if content.connections.output}
			<span bind:this={output} data-id={content.id} class="output absolute -bottom-1 left-4 h-1 w-5 rounded-b-[4px] bg-blue-400"></span>
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
