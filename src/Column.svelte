<script>
	import Layout from './Layout.svelte'
	import { layout_y, layout_y_style } from './layout'

	export let ref = undefined
	const { class: input_class_name, ...rest_props } = $$restProps
	const class_name = [ input_class_name || '', 'column' ].join(' ')
</script>

<Layout
	bind:ref
	{ ...rest_props }
	class={ class_name }
	layout_class={ layout_y }
	layout_style={ layout_y_style }
>
	<slot/>
</Layout>
