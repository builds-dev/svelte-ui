<script>
	import * as assert from 'uvu/assert'
	import { tick, onMount } from 'svelte'
	import { Box, Column, fill } from '../../src/index'
	import { has_scrollbar } from '../util'

	let column
	let content_height = 50
	let scroll_y = true

	onMount(async () => {
		assert.equal(has_scrollbar(column), false, 'does not have Y scrollbar when content height is less than column')
		content_height = 150
		await tick()
		assert.equal(has_scrollbar(column), true, 'has Y scrollbar when content height is greater than column')
		scroll_y = false
		await tick()
		assert.equal(has_scrollbar(column), false, 'scroll_y = false disables scrolling')
	})
</script>

<Box bind:ref={column} height={100} width={fill} {scroll_y} style='background: orange;'>
	<Box height={content_height} width={fill} style='background: pink;'/>
</Box>
