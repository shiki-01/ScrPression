<script lang="ts">
	import { draggable } from '@neodrag/svelte';
	import type { Block } from '$lib/types';
	export let content: Block;
</script>

<div
	use:draggable={{ bounds: 'parent' }}
	class="clip-path relative flex h-10 w-fit cursor-pointer rounded-md bg-blue-400 px-2.5 py-2"
>
	{#if content.connect.input}
		<span class="absolute left-4 top-0 h-1 w-5 rounded-b-[4px] bg-none"></span>
	{/if}
	{#if content.connect.output}
		<span class="absolute -bottom-1 left-4 h-1 w-5 rounded-b-[4px] bg-blue-400"></span>
	{/if}
	<div class="flex flex-row items-center justify-center gap-4 align-middle">
		<div class="font-bold text-blue-950">{content.title}</div>
		<div class="flex flex-row gap-2 align-middle">
			{#each content.contents as item}
				{#if item === 'space'}
					<div class="h-5 w-[1px] bg-blue-950"></div>
				{:else}
					{#each Object.entries(item) as [key, value]}
						<div class="flex flex-row items-center justify-center gap-1">
							<div>{value.text}</div>
							<input
								type={value.type}
								class="h-5 w-10 overflow-x-auto rounded-full border-2 border-blue-600 bg-blue-200 p-0 pl-2 text-sm text-blue-950 focus:outline-none"
								value={value.text}
							/>
						</div>
					{/each}
				{/if}
			{/each}
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
