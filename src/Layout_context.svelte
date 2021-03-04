<script context='module'>
	import { getContext, setContext } from 'svelte'
	import { writable } from 'svelte/store'
	import { layout_y_child } from './layout'

	const CONTEXT_KEY = Symbol()
	export const get_layout_context = () => getContext(CONTEXT_KEY) || { style: writable(layout_y_child()), class: '' }
	export const set_layout_context = value => setContext(CONTEXT_KEY, value)
</script>

<script>
	export let context_class = ''
	export let context_style = layout_y_child()
	const store = writable()
	$: store.set(context_style)
	set_layout_context({ style: store, class: context_class })
</script>

<slot/>
