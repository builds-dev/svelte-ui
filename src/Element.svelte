<script>
	import Spacing_context, { get_spacing_context } from './Spacing_context.svelte'
	import { element, element_style } from './element'
	import { content, format_length } from './length'

	export let ref = undefined
	export let style = ''
	const className = [ $$props.class || '', element ].join(' ')
	const { context_spacing_x, context_spacing_y } = get_spacing_context()
</script>

<div
	bind:this={ ref }
	class={ className }
	data-height-base={ format_length($$props.height || content).base.type }
	data-width-base={ format_length($$props.width || content).base.type }
	style="{ element_style($$props, $context_spacing_x, $context_spacing_y) }{ style }"
>
	<Spacing_context x={0} y={0}>
		<slot/>
	</Spacing_context>
</div>
