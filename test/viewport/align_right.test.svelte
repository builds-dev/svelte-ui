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
			rendered_px_equal (content.offsetLeft) (viewport.clientWidth - content_width),
			'content is aligned to right of the viewport'
		)
	})
</script>

<Viewport bind:ref={viewport} align_right>
	<Box bind:ref={content} width={px(content_width)}/>
</Viewport>
