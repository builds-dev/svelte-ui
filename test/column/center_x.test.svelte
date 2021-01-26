<script>
	import * as assert from 'uvu/assert'
	import { onMount } from 'svelte'
	import { Box, Column, Viewport, px } from '../../src/index'
	import { rendered_px_equal } from '../util'

	let column
	let content_1
	let content_2
	let content_width = 50

	onMount(() => {
		assert.ok(
			rendered_px_equal
				(content_1.offsetLeft)
				((column.clientWidth / 2) - (content_width / 2))
			,
			'first child is horizontally centered'
		)

		assert.ok(
			rendered_px_equal
				(content_2.offsetLeft)
				((column.clientWidth / 2) - (content_width / 2))
			,
			'last child is horizontally centered'
		)
	})
</script>

<Viewport>
	<Column bind:ref={column} center_x>
		<Box bind:ref={content_1} width={px(content_width)}/>
		<Box bind:ref={content_2} width={px(content_width)}/>
	</Column>
</Viewport>
