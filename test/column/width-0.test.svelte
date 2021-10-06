<script>
	import * as assert from 'uvu/assert'
	import { onMount } from 'svelte'
	import { Column } from '../../src/index'

	let column

	onMount(() => {
		assert.equal(
			column.clientWidth,
			0,
			`width={0} column has 0 width, despite its content`
		)
	})
</script>

<Column bind:ref={column} width={0} style='border: 4px solid red;'>
	<Column>foo bar baz</Column>
</Column>
