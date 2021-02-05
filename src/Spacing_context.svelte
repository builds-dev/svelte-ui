<script context='module'>
	import { getContext, setContext } from 'svelte'
	import { writable } from 'svelte/store'

	const CONTEXT_KEY = Symbol()
	export const get_spacing_context = () => getContext(CONTEXT_KEY) || { context_spacing_x: writable(0), context_spacing_y: writable(0) }
	export const set_spacing_context = value => setContext(CONTEXT_KEY, value)
</script>

<script>
	export let x = null
	export let y = null
	const context_spacing_x = writable(x)
	const context_spacing_y = writable(y)
	$: context_spacing_x.set(x)
	$: context_spacing_y.set(y)
	set_spacing_context({ context_spacing_x, context_spacing_y })
</script>

<slot/>
