<script>
	import * as assert from 'uvu/assert'
	import { onMount } from 'svelte'
	import { Row, Viewport, fill } from '../../src/index'

	let viewport
	let row

	onMount(() => {
		assert.equal(row.clientHeight, viewport.clientHeight, 'row is full height of viewport')
	})
</script>

<Viewport bind:ref={viewport}>
	<Row bind:ref={row} height={fill}/>
</Viewport>
