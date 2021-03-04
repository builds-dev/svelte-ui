<script>
	import { onMount } from 'svelte'
	import { listen, run_all } from 'svelte/internal'
	import Layout_context, { get_layout_context } from './Layout_context.svelte'
	import { element, element_style } from './element'
	import { content, format_length } from './length'
	import { concat as classname_concat } from './util/classname'


	export let ref = undefined
	export let on = null
	export let style = ''

	onMount(() => {
		if (on) {
			const dispose = Object.keys(on).map(name =>
				typeof on[name] === 'function'
					? listen(ref, name, on[name])
					: listen(ref, name, on[name].listener, on[name].options)
			)
			return () => run_all(dispose)
		}
	})

	$: height = format_length($$props.height || content)
	$: width = format_length($$props.width || content)
	$: props = { ...$$props, height, width }

	const { style: context_style, class: context_class } = get_layout_context()
	$: class_name = classname_concat([ $$props.class, context_class, element ])
</script>

<div
	bind:this={ ref }
	class={ class_name }
	style="{ element_style(props) }{ $context_style(props) }{ style }"
>
	<Layout_context>
		<slot/>
	</Layout_context>
</div>
