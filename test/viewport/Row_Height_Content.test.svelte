<script>
	import * as assert from 'uvu/assert'
	import { onMount } from 'svelte'
	import { Box, Row, Viewport, content, px } from '../../src/index'

	let row

	onMount(() => {
		assert.equal(row.clientHeight, 50, 'row is height of content')
	})
</script>

<Viewport>
	<Row bind:ref={row} height={content}>
		<Box height={px(50)}/>
	</Row>
</Viewport>
