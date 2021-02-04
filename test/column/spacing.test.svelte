<script>
	import * as assert from 'uvu/assert'
	import { onMount } from 'svelte'
	import { Box, Row, Viewport, fill } from '../../src/index'
	import { rendered_px_equal } from '../util'

	let a
	let a_0
	let a_0_0
	let a_0_1
	let a_1

	onMount(() => {
		console.log(a.getBoundingClientRect(), a.offsetHeight)
		assert.ok(
			rendered_px_equal (a.getBoundingClientRect().height) (300),
		)
	})
</script>

<Viewport>
	<Box width={fill} padding={10}>
		<Box width={fill} style='background: pink'>
			<Row bind:ref={a} width={fill} spacing={50}>
				<Row bind:ref={a_1} height={100} width={fill} spacing={100} style='background: orange;'>
					<Box>123</Box>
				</Row>
			</Row>
		</Box>
	</Box>
</Viewport>
