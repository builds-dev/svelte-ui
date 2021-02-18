<script>
	import Element from './Element.svelte'
	import {
		layout,
		layout_style as layout_any_style,
		spacing_child,
		spacing_context
	} from './layout'
	import Layout_context from './Layout_context.svelte'

	export let ref
	export let layout_class
	export let layout_style
	export let layout_spacing
	export let layout_context
	export let spacing_x = 0
	export let spacing_y = 0

	$: style = [
		'flex-grow: 1;',
		layout_any_style($$props),
		layout_style($$props),
		layout_spacing(spacing_x, spacing_y),
		spacing_context(spacing_x, spacing_y)
	].join('')
	$: context_values = {
		spacing_x: typeof spacing_x === 'number' ? spacing_x : 0,
		spacing_y: typeof spacing_y === 'number' ? spacing_y : 0
	}
</script>

<Element
	bind:ref
	{ ...$$restProps }
>
	<div
		class="{ layout_class } { layout }"
		{ style }
	>
		<Layout_context
			context_style={props => `${spacing_child(context_values)}${layout_context (context_values) (props)}`}
		>
			<slot/>
		</Layout_context>
	</div>
</Element>
