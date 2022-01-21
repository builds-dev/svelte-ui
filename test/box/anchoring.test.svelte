<script>
	import * as assert from 'uvu/assert'
	import { onMount } from 'svelte'
	import { Column, Box, Image, fill, grow, px } from '../../src/index'
	import { rendered_px_equal } from '../util'

	let content
	let above
	let below
	let on_left
	let on_right

	onMount(() => {
		const content_rect = content.getBoundingClientRect()
		const above_rect = above.getBoundingClientRect()
		const below_rect = below.getBoundingClientRect()
		const on_left_rect = on_left.getBoundingClientRect()
		const on_right_rect = on_right.getBoundingClientRect()

		// TODO: test things like "inset right" (anchor_x={[ 1, 1 ]})

		assert.ok(
			rendered_px_equal (above_rect.bottom) (content_rect.top),
			'bottom of above area is the top of the regular content area'
		)
		assert.equal(
			below_rect.top,
			content_rect.bottom,
			'top of bottom area is the bottom of the regular content area'
		)
		assert.ok(
			rendered_px_equal (on_left_rect.right) (content_rect.left),
			'right of left area is the left of the regular content area'
		)
		assert.equal(
			on_right_rect.left,
			content_rect.right,
			'left of right area is the right of the regular content area'
		)
	})
</script>

<Box height={fill} width={fill} center_x center_y>
	<Column>
		<Box bind:ref={content} height={px(100)} width={px(100)} center_x center_y padding={20}>
			<Image
				opacity={1}
				src='https://svelte.dev/svelte-logo-horizontal.svg'
				origin_x={0}
				origin_y={0}
				height={fill}
				width={fill}
			/>
		</Box>
		<Box bind:ref={above} anchor_x={[ 0.5, 0.5 ]} anchor_y={[ 1, 0 ]}>
			above
		</Box>
		<Box bind:ref={below} anchor_x={[ 0.5, 0.5 ]} anchor_y={[ 0, 1 ]}>
			below
		</Box>
		<Box bind:ref={on_left} anchor_x={[ 1, 0 ]} anchor_y={[ 0.5, 0.5 ]}>
			on left
		</Box>
		<Box bind:ref={on_right} anchor_x={[ 0, 1 ]} anchor_y={[ 0.5, 0.5 ]}>
			on right
		</Box>
	</Column>
</Box>
