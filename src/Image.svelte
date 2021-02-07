<script>
	import Box from './Box.svelte'
	import { element } from './element'
	import { image } from './image'
	import { content, format_length } from './length'

	export let ref = undefined
	export let src
	export let description
	export let origin_x = 0
	export let origin_y = 0

	$: height = format_length($$props.height || content)
	$: width = format_length($$props.width || content)
	$: style = [
		`object-position: ${origin_x * 100}% ${origin_y * 100}%;`,
		height.base.type === 'fill' ?  `height: 100%;` : '',
		width.base.type === 'fill' ?  `width: 100%;` : ''
	].join('')
</script>

<Box
	bind:ref
	{...$$restProps}
	class="{ image } { $$props.class || '' }"
	
>
	<img
		class="{ element }"
		{src}
		alt={description}
		{style}
	/>
</Box>
