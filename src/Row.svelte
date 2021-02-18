<script>
	import Layout from './Layout.svelte'
	import { layout_x, layout_x_style, layout_x_child, spacing_x_context } from './layout'

	export let ref = undefined
</script>

<Layout
	bind:ref
	{ ...$$restProps }
	class={ [ $$props.class || '', 'row' ].join(' ') }
	spacing_x={$$props.spacing_x || $$props.spacing}
	spacing_y={$$props.wrap ? $$props.spacing_y || $$props.spacing : 0}
	layout_class={ layout_x }
	layout_style={ layout_x_style }
	layout_spacing={ spacing_x_context }
	layout_context={ layout_x_child }
>
	<slot/>
</Layout>
