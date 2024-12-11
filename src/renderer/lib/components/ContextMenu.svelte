<script lang="ts">
	import Icon from '@iconify/svelte';
	import { workspace } from '$lib/stores/workspace';

	export let isOpen: boolean = false;
	export let clientX: number = 0;
	export let clientY: number = 0;
</script>

{#if isOpen}
	<div class="fixed top-0 left-0 w-full h-full inset-0 z-[998]">
		<button
			aria-label="Close"
			on:click={() => isOpen = false}
			class="fixed inset-0 opacity-0"
		></button>
		<div class="fixed bg-slate-50 rounded-lg shadow-lg w-48 z-[999]"
				 style="top: {clientY + 1}px; left: {clientX + 1}px;">
			<div class="p-2 flex flex-col gap-1 text-sm">
				<button
					on:click={() => {
						workspace.undo();
					}}
					class="w-full flex flex-row gap-4 px-2 py-1 items-center justify-start bg-slate-50 hover:bg-slate-200 transition-colors duration-300"
				>
					<Icon icon="ic:round-undo" class="h-5 w-5" />
					Undo
				</button>
				<button
					on:click={() => {
						workspace.redo();
					}}
					class="w-full flex flex-row gap-4 px-2 py-1 items-center justify-start bg-slate-50 hover:bg-slate-200 transition-colors duration-300"
				>
					<Icon icon="ic:round-redo" class="h-5 w-5" />
					Redo
				</button>
				<span class="w-full h-[1px] my-1 bg-slate-200"></span>
				<button
					class="w-full flex flex-row gap-4 px-2 py-1 items-center justify-start bg-slate-50 hover:bg-slate-200 transition-colors duration-300">
					<Icon icon="ic:round-delete" class="h-5 w-5" />
					Add Comment
				</button>
				<span class="w-full h-[1px] my-1 bg-slate-200"></span>
				<button
					class="w-full flex flex-row gap-4 px-2 py-1 items-center justify-start bg-slate-50 hover:bg-slate-200 transition-colors duration-300">
					<Icon icon="ic:round-delete" class="h-5 w-5" />
					Clear Workspace
				</button>
				<button
					class="w-full flex flex-row gap-4 px-2 py-1 items-center justify-start bg-slate-50 hover:bg-slate-200 transition-colors duration-300">
					<Icon icon="ic:round-delete" class="h-5 w-5" />
					Save Workspace
				</button>
			</div>
		</div>
	</div>
{/if}