<script>
	import * as assert from 'uvu/assert'
	import { onMount } from 'svelte'
	import { Above, Below, On_left, On_right, In_front, In_back, Box, Image, fill, px } from '../../src/index'
	import { rendered_px_equal } from '../util'

	let content
	let in_back
	let in_front
	let above
	let below
	let on_left
	let on_right

	onMount(() => {
		const content_rect = content.getBoundingClientRect()
		const in_back_rect = in_back.getBoundingClientRect()
		const in_front_rect = in_front.getBoundingClientRect()
		const above_rect = above.getBoundingClientRect()
		const below_rect = below.getBoundingClientRect()
		const on_left_rect = on_left.getBoundingClientRect()
		const on_right_rect = on_right.getBoundingClientRect()

		assert.equal(
			in_back_rect,
			content_rect,
			'in_back is in the same area as regular content'
		)
		assert.equal(
			in_front_rect,
			content_rect,
			'in_front is in the same area as regular content'
		)
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
	<Box>
		<In_back>
			<Box bind:ref={in_back} height={fill} width={fill} center_y padding={10}>back</Box>
		</In_back>
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
		<In_front>
			<Box bind:ref={in_front} height={fill} width={fill} center_y align_right padding={10} style="background: rgba(255, 62, 0, 0.4)">front</Box>
		</In_front>
		<Above>
			<Box bind:ref={above} width={fill} center_x>above</Box>
		</Above>
		<Below>
			<Box bind:ref={below} width={fill} center_x>below</Box>
		</Below>
		<On_left>
			<Box bind:ref={on_left} height={fill} center_y>on left</Box>
		</On_left>
		<On_right>
			<Box bind:ref={on_right} height={fill} center_y>on right</Box>
		</On_right>
	</Box>
</Box>
