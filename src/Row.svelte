<script>
	import Layout from './Layout.svelte'
	import { layout_x, layout_x_style } from './layout'

	export let ref = undefined
	const { class: input_class_name, ...rest_props } = $$restProps
	const class_name = [ input_class_name || '', 'row' ].join(' ')
</script>

<Layout
	bind:ref
	{ ...rest_props }
	class={ class_name }
	layout_class={ layout_x }
	layout_style={ layout_x_style }
>
	<slot/>
</Layout>
