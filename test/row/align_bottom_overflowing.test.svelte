<script>
	import * as assert from 'uvu/assert'
	import { onMount } from 'svelte'
	import { Box, Row, fill } from '../../src/index'
	import { rendered_px_equal } from '../util'

	let row
	let content
	let content_height = 75

	onMount(() => {
		assert.ok(
			rendered_px_equal (content.offsetTop) (row.clientHeight - content_height),
			'last child is aligned to bottom of the row'
		)
	})
</script>

<Box height={fill} width={fill} center_x center_y>
	<Row bind:ref={row} height={content_height * 0.666667} width={fill} align_bottom style='background: red;'>
		<Box bind:ref={content} height={content_height} width={fill} opacity={0.5} style='background: black; border: 4px solid gray;'/>
	</Row>
</Box>
