<script>
	import * as assert from 'uvu/assert'
	import { onMount } from 'svelte'
	import { Box, Row, Viewport, fill, px } from '../../src/index'

	let child
	let content_height = 50

	onMount(() => {
		assert.equal(
			child.clientHeight,
			50,
			'row child filled up all the vertical space made available by its sibling'
		)
	})
</script>

<Viewport>
	<Row>
		<Box bind:ref={child} height={fill}/>
		<Box height={px(content_height)}/>
	</Row>
</Viewport>

<Viewport>
	<Row>
		<Row width={fill} height={500} style='background: orange;'>
			<Box bind:ref={child} height={50} center_x center_y style='background: lightblue;'/>
			<Box height={px(content_height)}/>
		</Row>
	</Row>
</Viewport>
