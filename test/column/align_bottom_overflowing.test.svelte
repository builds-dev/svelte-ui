<script>
	import * as assert from 'uvu/assert'
	import { onMount } from 'svelte'
	import { Box, Column, fill } from '../../src/index'
	import { rendered_px_equal } from '../util'

	let column
	let content_1
	let content_2
	let content_height = 75

	onMount(() => {
		assert.ok(
			rendered_px_equal (content_2.offsetTop) (column.clientHeight - content_height),
			'last child is aligned to bottom of the column'
		)
		assert.ok(
			rendered_px_equal (content_1.offsetTop) (content_2.offsetTop - content_height),
			'previous child is aligned to bottom of the column, just above next child'
		)
	})
</script>

<Box height={fill} width={fill} center_x center_y>
	<Column bind:ref={column} height={content_height * 1.3333333} width={fill} align_bottom style='background: red;'>
		<Box bind:ref={content_1} height={content_height} width={fill} opacity={0.5} style='background: black; border: 4px solid gray;'/>
		<Box bind:ref={content_2} height={content_height} width={fill} opacity={0.5} style='background: black; border: 4px solid gray;'/>
	</Column>
</Box>
