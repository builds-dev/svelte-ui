<script>
	import * as assert from 'uvu/assert'
	import { onMount } from 'svelte'
	import { Row, Viewport, fill } from '../../src/index'

	let viewport
	let row

	onMount(() => {
		assert.equal(row.clientWidth, viewport.clientWidth, 'row is full width of viewport')
	})
</script>

<Viewport bind:ref={viewport}>
	<Row bind:ref={row} width={fill}/>
</Viewport>
