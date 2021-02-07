<script>
	import { css } from '@linaria/core'
	import Element from './Element.svelte'
	import Layout_context from './Layout_context.svelte'
	import { layout, layout_x, layout_style, layout_x_style, layout_x_child } from './layout'
	import { nearby } from './nearby'

	const box = css`
		& > :not(${nearby}) ~ :not(${nearby}) {
			visibility: hidden;

			&:before {
				content: "Error: Box may only contain one child.";
				visibility: visible;
				background: red;
				color: white;
				display: block;
				font-weight: bold;
				padding: 30px;
			}

			& ~ :not(${nearby}):before {
				display: none;
			}
		}
	`
	export let ref = undefined
	export let style = ''
	const className = [ $$props.class || '', box, layout_x, layout ].join(' ')
</script>

<Element
	bind:ref
	{ ...$$restProps }
	class={ className }
	style="{ layout_style($$props) }{ layout_x_style($$props) }{ style }"
>
	<Layout_context
		context_style={layout_x_child()}
	>
		<slot/>
	</Layout_context>
</Element>
