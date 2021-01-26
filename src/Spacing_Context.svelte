<script context='module'>
	import { getContext, setContext } from 'svelte'
	const CONTEXT_KEY = Symbol()
	export const get_spacing_context = () => getContext(CONTEXT_KEY) || { x: 0, y: 0 }
	export const set_spacing_context = value => setContext(CONTEXT_KEY, value)
</script>

<script>
	export let x = 0
	export let y = 0
	set_spacing_context({ x, y })
</script>

<slot/>
