<script lang="ts">
	import '../app.css';
	let { children } = $props();
</script>

{@render children()}

<style>
	:global(html, body) {
		user-select: none;
		touch-action: none;
	}
</style>