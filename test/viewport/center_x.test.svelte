<script>
	import * as assert from 'uvu/assert'
	import { onMount } from 'svelte'
	import { Box, Viewport, px } from '../../src/index'
	import { rendered_px_equal } from '../util'

	let viewport
	let content
	let content_width = 50

	onMount(() => {
		assert.ok(
			rendered_px_equal
				(content.offsetLeft)
				((viewport.clientWidth / 2) - (content_width / 2))
			,
			'content is horizontally centered in the viewport'
		)
	})
</script>

<Viewport bind:ref={viewport} center_x>
	<Box bind:ref={content} width={px(content_width)}/>
</Viewport>
