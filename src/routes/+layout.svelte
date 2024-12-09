<script lang="ts">
	import '../app.css';
	import { Toaster } from 'svelte-sonner';
</script>

<slot />

<Toaster />

<style>
	:global(html, body) {
		user-select: none;
		touch-action: none;
	}
</style>