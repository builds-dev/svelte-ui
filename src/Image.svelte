<script>
	import Box from './Box.svelte'
	import { element } from './element'
	import { image } from './image'

	export let ref = undefined
	export let src
	export let description
	export let origin_x = 0
	export let origin_y = 0
</script>

<Box
	bind:ref
	{...$$restProps}
	class="{ image } { $$props.class || '' }"
	style="object-position: { origin_x * 100 }% { origin_y * 100 }%);"
>
	<img class="{ image } { element }" {src} alt={description}/>
</Box>
