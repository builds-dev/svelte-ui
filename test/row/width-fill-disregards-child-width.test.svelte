<script>
	import * as assert from 'uvu/assert'
	import { onMount } from 'svelte'
	import { Row, Box, fill } from '../../src/index'

	let fill_box

	onMount(() => {
		assert.equal(
			fill_box.clientWidth,
			25,
			`fill box took up only the remaining space and did not grow wider due to its child's width`
		)
	})
</script>

<Row width={108} style='border: 4px solid red;'>
	<Box height={fill} width={75} style='background: lightgreen;'/>
	<Row bind:ref={fill_box} height={100} width={fill} style='background: orange;'>
		<Box height={50} width={50} style='background: lightblue;'/>
	</Row>
</Row>
