<script>
	import Element from './Element.svelte'
	import { layout, layout_style as layout_any_style } from './layout'
	import Spacing_context, { get_spacing_context } from './Spacing_context.svelte'

	export let ref
	export let layout_class
	export let layout_style
	export let spacing = 0
	export let spacing_x = 0
	export let spacing_y = 0

	const context_spacing = get_spacing_context()
	$: actual_spacing = { x: spacing_x || spacing, y: spacing_y || spacing }
</script>

<Spacing_context
	x={ context_spacing.x - actual_spacing.x }
	y={ context_spacing.y - actual_spacing.y }
>
	<Element
		bind:ref
		{ ...$$restProps }
	>
		<div
			class="{ layout_class } { layout }"
			style="{ layout_any_style($$props) } { layout_style($$props) }"
		>
			<Spacing_context {...actual_spacing}>
				<slot/>
			</Spacing_context>
		</div>
	</Element>
</Spacing_context>
