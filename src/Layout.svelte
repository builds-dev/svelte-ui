<script>
	import Element from './Element.svelte'
	import { content, format_length } from './length'
	import {
		layout,
		layout_style as layout_any_style,
		layout_x_style,
		layout_child,
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
		// NOTE: width: 100% is necessary for Safari so that width={fill} children don't cause this element to get wider
		// TODO: are there cases where height: 100% is also necessary for the same reason? This all needs to be fully investigated and documented.
		'flex-grow: 1; align-self: stretch; width: 100%;',
		layout_any_style($$props),
		layout_style($$props),
		layout_spacing(spacing_x, spacing_y),
		spacing_context(spacing_x, spacing_y),
		container_style
	].join('')
	$: height = format_length($$props.height || content)
	$: width = format_length($$props.width || content)
	$: element_props = { ...$$restProps, height, width }

	$: context_values = {
		height,
		width,
		spacing_x: typeof spacing_x === 'number' ? spacing_x : 0,
		spacing_y: typeof spacing_y === 'number' ? spacing_y : 0
	}
	$: context_style = props => `${layout_child(context_values, props)}${layout_context (context_values) (props)}`
</script>

<Element
	bind:ref
	style={ outer_style }
	{ ...element_props }
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
