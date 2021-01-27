<script>
	import Box from './Box.svelte'
	import { viewport } from './viewport'

	export let ref = undefined
	export let center_x = false
	export let align_right = false
	export let center_y = false
	export let align_bottom = false
	export let scroll_y = true
	export let scroll_x = true
	export let style = ''

	$: clip_x = !scroll_x
	$: clip_y = !scroll_y

	let display = 'none'
	let x = 0
	let y = 0

	const render = node => {
		document.body.appendChild(node)
		display = 'contents'
	}

	// NOTE: if display: contents causes problems, just comment out the .viewport-context container
</script>

<div class='viewport-context' use:render style='display: { display };'>
	<Box
		bind:ref
		class="{ viewport } { $$props.class || '' }"
		{center_x}
		{align_right}
		{center_y}
		{align_bottom}
		{x}
		{y}
		{clip_x}
		{clip_y}
		{scroll_x}
		{scroll_y}
		{style}
	>
		<slot/>
	</Box>
</div>
