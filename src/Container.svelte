<script>
	import { css } from '@linaria/core'
	import Element from './Element.svelte'
	import Spacing_Context from './Spacing_Context.svelte'
	import { nearby, nearby_container } from './nearby'
	import Above from './Above.svelte'
	import Below from './Below.svelte'
	import On_left from './On_left.svelte'
	import On_right from './On_right.svelte'
	import In_back from './In_back.svelte'
	import In_front from './In_front.svelte'

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
	{#if $$slots.in_back} <In_back><slot name='in_back'/></In_back> {/if}

	<Spacing_Context x={spacing_x} y={spacing_y}>
		<slot/>
	</Spacing_Context>

	{#if $$slots.above} <Above><slot name='above'/></Above> {/if}
	{#if $$slots.below} <Below><slot name='below'/></Below> {/if}
	{#if $$slots.on_left} <On_left><slot name='on_left'/></On_left> {/if}
	{#if $$slots.on_right} <On_right><slot name='on_right'/></On_right> {/if}
	{#if $$slots.in_front} <In_front><slot name='in_front'/></In_front> {/if}
</Element>
