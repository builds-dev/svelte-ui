<script>
	import Layout from './Layout.svelte'
	import { layout_y, layout_y_style, spacing_y_context, layout_y_child } from './layout'
	import { concat as classname_concat } from './util/classname'

	export let ref = undefined
</script>

<Layout
	bind:ref
	{ ...$$restProps }
	class="{ classname_concat([ $$props.class, 'column' ]) }"
	spacing_x={$$props.wrap ? $$props.spacing_x || $$props.spacing : 0}
	spacing_y={$$props.spacing_y || $$props.spacing}
	layout_class={ layout_y }
	layout_style={ layout_y_style }
	layout_spacing={ spacing_y_context }
	layout_context={ layout_y_child }
>
	<slot/>
</Layout>
