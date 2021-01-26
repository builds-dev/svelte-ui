<script>
	import * as assert from 'uvu/assert'
	import { onMount } from 'svelte'
	import { Column, Viewport, fill } from '../../src/index'

	let viewport
	let column

	onMount(() => {
		assert.equal(column.clientHeight, viewport.clientHeight, 'column is full height of viewport')
	})
</script>

<Viewport bind:ref={viewport}>
	<Column bind:ref={column} height={fill}/>
</Viewport>
