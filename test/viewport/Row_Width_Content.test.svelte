<script>
	import * as assert from 'uvu/assert'
	import { onMount } from 'svelte'
	import { Box, Row, Viewport, content, px } from '../../src/index'

	let row

	onMount(() => {
		assert.equal(row.clientWidth, 50, 'row is full width of viewport')
	})
</script>

<Viewport>
	<Row bind:ref={row} width={content}>
		<Box width={px(50)}/>
	</Row>
</Viewport>
