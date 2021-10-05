<script>
	import * as assert from 'uvu/assert'
	import { onMount } from 'svelte'
	import { Row } from '../../src/index'

	let row

	onMount(() => {
		assert.equal(
			row.clientWidth,
			0,
			`width={0} row has 0 width, despite its content`
		)
	})
</script>

<Row bind:ref={row} width={0} style='border: 4px solid red;'>
	<Row>foo bar baz</Row>
</Row>
