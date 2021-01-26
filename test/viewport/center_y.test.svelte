<script>
	import * as assert from 'uvu/assert'
	import { onMount } from 'svelte'
	import { Box, Viewport, px } from '../../src/index'
	import { rendered_px_equal } from '../util'

	let viewport
	let content
	let content_height = 50

	onMount(() => {
		assert.ok(
			rendered_px_equal
				(content.offsetTop)
				((viewport.clientHeight / 2) - (content_height / 2))
			,
			'content is vertically centered in the viewport'
		)
	})
</script>

<Viewport bind:ref={viewport} center_y>
	<Box bind:ref={content} height={px(content_height)}/>
</Viewport>
