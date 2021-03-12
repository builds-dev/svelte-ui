<script>
	import * as assert from 'uvu/assert'
	import { onMount } from 'svelte'
	import { Column, Box, fill } from '../../src/index'

	let fill_column

	onMount(() => {
		assert.equal(
			fill_column.clientHeight,
			25,
			`fill column took up only the remaining space and did not grow taller due to its child's height`
		)
	})
</script>

<Column height={108} style='border: 4px solid red;'>
	<Box height={75} width={fill} style='background: lightgreen;'/>
	<Column bind:ref={fill_column} height={fill} width={100} style='background: orange;'>
		<Box height={50} width={50} style='background: lightblue;'/>
	</Column>
</Column>
