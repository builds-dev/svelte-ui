<script>
	import Element from './Element.svelte'
	import { layout, layout_style as layout_any_style, spacing_context } from './layout'
	import Spacing_context from './Spacing_context.svelte'

	export let ref
	export let layout_class
	export let layout_style
	export let spacing = 0
	export let spacing_x = 0
	export let spacing_y = 0

	$: spacings = { x: spacing_x || spacing, y: spacing_y || spacing }
</script>

<Element
	bind:ref
	{ ...$$restProps }
>
	<div
		class="{ layout_class } { layout }"
		style="height: 100%; { layout_style($$props) } { layout_any_style($$props) } { spacing_context(spacings) }"
	>
		<Spacing_context {...spacings}>
			<slot/>
		</Spacing_context>
	</div>
</Element>
