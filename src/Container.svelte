<script>
	import { css } from '@linaria/core'
	import Element from './Element.svelte'
	import Spacing_Context from './Spacing_Context.svelte'
	import { nearby, nearby_container } from './nearby'

	export let ref = undefined
	export let spacing_x = 0
	export let spacing_y = 0
	export let clip_x = false
	export let clip_y = false
	export let scroll_x = false
	export let scroll_y = false
	export let style = ''

	const nearby_slot_container = css`
		& > ${nearby} > ${nearby_container} > [slot] {
			display: contents;
		}
	`

	const overflow = (axis, clip, scroll) => clip || scroll
		? `overflow-${axis}: ${clip ? 'hidden' : 'auto'};`
		: ''
</script>

<Element
	bind:ref
	{ ...$$restProps }
	class="{ $$props.class || '' } { nearby_slot_container }"
	style='
		{ style };
		{ overflow('x', clip_x, scroll_x) }
		{ overflow('y', clip_y, scroll_y) }
	'
>
	<Spacing_Context x={spacing_x} y={spacing_y}>
		<slot/>
	</Spacing_Context>
</Element>
