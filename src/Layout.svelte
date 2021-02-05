<script>
	import Element from './Element.svelte'
	import { layout, layout_style as layout_any_style, spacing_context } from './layout'
	import Spacing_context, { get_spacing_context } from './Spacing_context.svelte'

	export let ref
	export let layout_class
	export let layout_style
	export let spacing = 0
	export let spacing_x = 0
	export let spacing_y = 0

	/* const { context_spacing_x, context_spacing_y } = get_spacing_context() */
	$: spacings = { x: spacing_x || spacing, y: spacing_y || spacing }

/* <Spacing_context */
/* 	x={ $context_spacing_x - spacings.x } */
/* 	y={ $context_spacing_y- spacings.y } */
/* > */
</script>

<Element
	bind:ref
	{ ...$$restProps }
>
	<div
		class="{ layout_class } { layout }"
		style="{ layout_style($$props) } { layout_any_style($$props) } { spacing_context(spacings) }"
	>
		<Spacing_context {...spacings}>
			<slot/>
		</Spacing_context>
	</div>
</Element>
