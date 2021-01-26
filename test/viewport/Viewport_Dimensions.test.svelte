<script>
	import * as assert from 'uvu/assert'
	import { onMount } from 'svelte'
	import { Viewport } from '../../src/index'

	let viewport

	onMount(() => {
		assert.equal(viewport.clientHeight, window.innerHeight, 'viewport is full height of window')
		assert.equal(viewport.clientWidth, window.innerWidth, 'viewport is full width of window')
	})
</script>

<Viewport bind:ref={viewport}/>
