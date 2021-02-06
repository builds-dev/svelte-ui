<script>
	import Element from './Element.svelte'
	import { layout, layout_style as layout_any_style, spacing_context } from './layout'
	import Spacing_context from './Spacing_context.svelte'

	export let ref
	export let layout_class
	export let layout_style
	export let layout_spacing
	export let spacing = 0
	export let spacing_x = 0
	export let spacing_y = 0

	$: computed_spacing_x = spacing_x || spacing
	$: computed_spacing_y = spacing_y || spacing
	$: style = [
		'flex-grow: 1;',
		layout_any_style($$props),
		layout_style($$props),
		layout_spacing(computed_spacing_x, computed_spacing_y),
		spacing_context(computed_spacing_x, computed_spacing_y)
	].join('')
</script>

<Element
	bind:ref
	{ ...$$restProps }
>
	<div
		class="{ layout_class } { layout }"
		{ style }
	>
		<Spacing_context
			x={ typeof computed_spacing_x === 'number' ? computed_spacing_x : 0 }
			y={ typeof computed_spacing_y === 'number' ? computed_spacing_y : 0 }
		>
			<slot/>
		</Spacing_context>
	</div>
</Element>
