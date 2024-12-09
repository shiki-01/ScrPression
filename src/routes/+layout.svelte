<script lang="ts">
	import '../app.css';
	import { Toaster } from 'svelte-sonner';
	import { beforeNavigate } from '$app/navigation';
	import { updated } from '$app/stores';

	beforeNavigate(({ willUnload, to }) => {
		if ($updated && !willUnload && to?.url) {
			location.href = to.url.href;
		}
	});
</script>

<slot />

<Toaster />

<style>
	:global(html, body) {
		user-select: none;
		touch-action: none;
	}
</style>