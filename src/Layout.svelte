<script>
	import Element from './Element.svelte'
	import {
		layout,
		layout_style as layout_any_style,
		layout_x_style,
		spacing_child,
		spacing_context
	} from './layout'
	import Layout_context from './Layout_context.svelte'

	// TODO: having both spacing_x and spacing_y for Row and Column can be dropped once a good 'wrapping' system is implemented.

	export let container_style = '' // TODO: this is temporary, especially in case `align-content` is needed
	export let style = ''
	export let ref
	export let layout_class
	export let layout_style
	export let layout_spacing
	export let layout_context
	export let spacing_x = 0
	export let spacing_y = 0

	$: outer_style = [
		layout_x_style($$props),
		style
	].join('')
	$: inner_style = [
		'flex-grow: 1; align-self: stretch;',
		layout_any_style($$props),
		layout_style($$props),
		layout_spacing(spacing_x, spacing_y),
		spacing_context(spacing_x, spacing_y),
		container_style
	].join('')
	$: context_values = {
		spacing_x: typeof spacing_x === 'number' ? spacing_x : 0,
		spacing_y: typeof spacing_y === 'number' ? spacing_y : 0
	}
	$: context_style = props => `${spacing_child(context_values)}${layout_context (context_values) (props)}`
</script>

<Element
	bind:ref
	style={ outer_style }
	{ ...$$restProps }
>
	<div
		class="{ layout_class } { layout }"
		style={ inner_style }
	>
		<Layout_context
			{ context_style }
		>
			<slot/>
		</Layout_context>
	</div>
</Element>
