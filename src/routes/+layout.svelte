<script lang="ts">
	import '../app.css';
	import { Toaster } from 'svelte-sonner';

	let { children } = $props();
</script>

{@render children()}

<Toaster />

<style>
	:global(html, body) {
		user-select: none;
		touch-action: none;
	}
</style>