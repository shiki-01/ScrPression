<script lang="ts">
	import { ContextMenu as ContextMenuPrimitive } from 'bits-ui';
	import { cn, flyAndScale } from '$lib/utils.js';

	type $$Props = ContextMenuPrimitive.SubContentProps;

	let className: $$Props['class'] = undefined;
	export let transition: $$Props['transition'] = flyAndScale;
	export let transitionConfig: $$Props['transitionConfig'] = {
		x: -10,
		y: 0
	};
	export { className as class };
</script>

<ContextMenuPrimitive.SubContent
	{...$$restProps}
	class={cn(
		"bg-popover text-popover-foreground z-50 min-w-[8rem] overflow-hidden rounded-md border p-1 shadow-md focus:outline-none",
		className
	)}
	on:focusout
	on:keydown
	on:pointermove
	{transition}
	{transitionConfig}
>
	<slot />
</ContextMenuPrimitive.SubContent>
