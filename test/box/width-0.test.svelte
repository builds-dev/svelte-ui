<script>
	import * as assert from 'uvu/assert'
	import { onMount } from 'svelte'
	import { Box } from '../../src/index'

	let box

	onMount(() => {
		assert.equal(
			box.clientWidth,
			0,
			`width={0} box has 0 width, despite its content`
		)
	})
</script>

<Box bind:ref={box} width={0} style='border: 4px solid red;'>
	<Box>foo bar baz</Box>
</Box>
