<script>
	import * as assert from 'uvu/assert'
	import { onMount } from 'svelte'
	import { Box, Row, fill } from '../../src/index'

	let child
	let content_height = 50

	onMount(() => {
		assert.equal(
			child.clientHeight,
			50,
			'row child filled up all the vertical space made available by its sibling'
		)
	})
</script>

<Row width={fill} style='background: orange;'>
	<Box bind:ref={child} height={fill} width={fill} style='background: lightblue;'/>
	<Box height={content_height} width={fill} style='background: lightgreen;'/>
</Row>
