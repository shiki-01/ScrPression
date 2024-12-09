<script>
	import { page } from "$app/stores";

	console.log($page);
</script>

{#if $page.error}
	<h1>{$page.status}: {$page.error.message}</h1>
{/if}