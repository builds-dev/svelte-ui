<script>
	import Layout_context, { get_layout_context } from './Layout_context.svelte'
	import { element, element_style } from './element'
	import { content, format_length } from './length'

	export let ref = undefined
	export let style = ''

	$: height = format_length($$props.height || content)
	$: width = format_length($$props.width || content)
	$: props = { ...$$props, height, width }

	const { style: context_style, class: context_class } = get_layout_context()
	const className = [ $$props.class || '', context_class, element ].join(' ')
</script>

<div
	bind:this={ ref }
	class={ className }
	style="{ element_style(props) }{ $context_style(props) }{ style }"
>
	<Layout_context>
		<slot/>
	</Layout_context>
</div>
