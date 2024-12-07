<script lang="ts">

	export let isOpen: boolean = false;
	export let clientX: number = 0;
	export let clientY: number = 0;
</script>

{#if isOpen}
	<div class="fixed top-0 left-0 w-full h-full inset-0 z-[998]">
		<button
			on:click={() => isOpen = false}
			class="fixed inset-0 opacity-0"
		></button>
		<div class="fixed bg-white rounded-lg shadow-lg w-52 z-[999]" style="top: {clientY + 1}px; left: {clientX + 1}px;">
			<div class="flex justify-between items-center p-4 border-b">
				<h2 class="text-lg font-semibold">Dialog</h2>
			</div>

			<div class="p-4">
				<slot />
			</div>
		</div>
	</div>
{/if}
