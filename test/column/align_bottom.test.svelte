<script>
	import * as assert from 'uvu/assert'
	import { onMount } from 'svelte'
	import { Box, Column, Viewport, fill, px } from '../../src/index'
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
	<Column bind:ref={column} height={fill} align_bottom>
		<Box bind:ref={content_1} height={px(content_height)}/>
		<Box bind:ref={content_2} height={px(content_height)}/>
	</Column>
</Viewport>
