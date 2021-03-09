<script>
	import Box from './Box.svelte'
	import { image } from './image'
	import { content, format_length } from './length'

	export let ref = undefined
	export let src
	export let description
	export let origin_x = 0
	export let origin_y = 0

	$: height_prop = format_length($$props.height || content)
	$: width_prop = format_length($$props.width || content)
	$: style = [
		`object-position: ${origin_x * 100}% ${origin_y * 100}%;`,
		height_prop.type !== 'content' ?  `height: 100%;` : '',
		width_prop.type !== 'content' ?  `width: 100%;` : '',
	].join('')


	$: width = width_prop.type === 'px' ? width_prop.value : null
	$: height = height_prop.type === 'px' ?  height_prop.value : null
</script>

<Box
	bind:ref
	{ ...$$restProps }
	class={ [ $$props.class || '', image ].join(' ') }
>
	<img
		{src}
		alt={ description }
		{width}
		{height}
		{style}
	/>
</Box>
