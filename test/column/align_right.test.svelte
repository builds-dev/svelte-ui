<script>
	import * as assert from 'uvu/assert'
	import { onMount } from 'svelte'
	import { Box, Column } from '../../src/index'
	import { rendered_px_equal } from '../util'

	let column
	let content_1
	let content_2
	let content_width = 50

	onMount(() => {
		assert.ok(
			rendered_px_equal (content_1.offsetLeft) (column.clientWidth - content_width),
			'first child is aligned to right of the column'
		)
		assert.ok(
			rendered_px_equal (content_2.offsetLeft) (column.clientWidth - content_width),
			'last child is aligned to right of the column'
		)
	})
</script>

<Column bind:ref={column} align_right>
	<Box bind:ref={content_1} width={content_width}/>
	<Box bind:ref={content_2} width={content_width}/>
</Column>
