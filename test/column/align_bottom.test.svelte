<script>
	import * as assert from 'uvu/assert'
	import { onMount } from 'svelte'
	import { Box, Column, Row, Viewport, fill, px } from '../../src/index'
	import { rendered_px_equal } from '../util'

	let column
	let content_1
	let content_2
	let content_height = 50

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

<Viewport>
	<Row>
		<Column bind:ref={column} height={fill} align_bottom style='background: orange;'>
			<Box bind:ref={content_1} height={px(content_height)} style='background: lightblue;'/>
			<Box bind:ref={content_2} height={px(content_height)} style='background: lightgreen;'/>
		</Column>
	</Row>
</Viewport>
