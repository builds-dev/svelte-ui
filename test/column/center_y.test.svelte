<script>
	import * as assert from 'uvu/assert'
	import { onMount } from 'svelte'
	import { Box, Column } from '../../src/index'
	import { rendered_px_equal } from '../util'

	let column
	let content_1
	let content_2
	let content_height = 50

	onMount(() => {
		assert.ok(
			rendered_px_equal
				(content_1.offsetTop + content_height)
				(column.clientHeight / 2)
			,
			'first of two children rests on the vertical center of the column'
		)
		assert.ok(
			rendered_px_equal
				(content_2.offsetTop)
				(column.clientHeight / 2)
			,
			'second of two children hangs from the vertical center of the column'
		)
	})
</script>

<Column bind:ref={column} center_y>
	<Box bind:ref={content_1} height={content_height}/>
	<Box bind:ref={content_2} height={content_height}/>
</Column>
