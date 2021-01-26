<script>
	import Box from './Box.svelte'
	import { fill } from './length'

	export let w = 0
	export let h = 0

	let height_percent
	$: height_percent = (h / w) * 100
</script>

<Box width={fill} style='padding-bottom: { height_percent }%'>
	<div slot='in_back'>
		<slot/>
	</div>
</Box>
