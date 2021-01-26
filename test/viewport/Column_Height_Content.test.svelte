<script>
	import * as assert from 'uvu/assert'
	import { onMount } from 'svelte'
	import { Box, Column, Viewport, content, px } from '../../src/index'

	let column

	onMount(() => {
		assert.equal(column.clientHeight, 50, 'column is height of content')
	})
</script>

<Viewport>
	<Column bind:ref={column} height={content}>
		<Box height={px(50)}/>
	</Column>
</Viewport>
