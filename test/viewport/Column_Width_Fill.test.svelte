<script>
	import * as assert from 'uvu/assert'
	import { onMount } from 'svelte'
	import { Column, Viewport, fill } from '../../src/index'

	let viewport
	let column

	onMount(() => {
		assert.equal(column.clientWidth, viewport.clientWidth, 'column is full width of viewport')
	})
</script>

<Viewport bind:ref={viewport}>
	<Column bind:ref={column} width={fill}/>
</Viewport>
