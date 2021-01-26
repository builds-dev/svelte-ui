<script>
	import * as assert from 'uvu/assert'
	import { onMount } from 'svelte'
	import { Box, Column, Viewport, content, px } from '../../src/index'

	let column

	onMount(() => {
		assert.equal(column.clientWidth, 50, 'column is width of content')
	})
</script>

<Viewport>
	<Column bind:ref={column} width={content}>
		<Box width={px(50)}/>
	</Column>
</Viewport>
