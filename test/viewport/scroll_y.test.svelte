<script>
	import * as assert from 'uvu/assert'
	import { tick, onMount } from 'svelte'
	import { Box, Column, Viewport, content, px } from '../../src/index'

	const has_scrollbar = element =>
		getComputedStyle(element).overflowY !== 'hidden' && element.scrollHeight > element.clientHeight

	let viewport
	let column
	let content_height = px(50)
	let scroll_y = true

	onMount(async () => {
		assert.equal(has_scrollbar(viewport), false, 'does not have Y scrollbar when content height is less than viewport')
		content_height = px(50000)
		await tick()
		assert.equal(has_scrollbar(viewport), true, 'has Y scrollbar when content height is greater than viewport')
		scroll_y = false
		await tick()
		assert.equal(has_scrollbar(viewport), false, 'scroll_y = false disables scrolling')
	})
</script>

<Viewport bind:ref={viewport} {scroll_y}>
	<Column height={content}>
		<Box height={content_height}/>
	</Column>
</Viewport>
