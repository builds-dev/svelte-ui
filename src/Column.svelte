<script>
	import Container from './Container.svelte'
	import { css } from '@linaria/core'
	import { element } from './element'

	const column = css`
		flex-direction: column;
		justify-content: flex-start;
		align-items: flex-start;

		& > ${element}[data-height-base=fill] {
			flex-basis: 0;
			flex-grow: var(--height-base-value);
		}

		& > ${element}[data-width-base=fill] {
			width: 100%;
		}

		& > ${element}[data-height-base=content] {
			flex-basis: auto;
			flex-grow: 0;
		}

		& > ${element}[data-width-base=content] {
			width: auto;
		}
	`

	export let ref = undefined
	export let spacing = 0
	export let style = ''

	export let center_x = false
	export let align_right = false
	export let center_y = false
	export let align_bottom = false

	$: justify_content_style = align_bottom || center_y ? `justify-content: ${ align_bottom ? 'flex-end' : 'center' };` : ''
	$: align_items_style = align_right || center_x ? `align-items: ${ align_right ? 'flex-end' : 'center' };` : ''
</script>

<Container
	bind:ref
	{ ...$$restProps }
	class="{ column } { $$props.class || '' }"
	style='
		{ style };
		{ justify_content_style }
		{ align_items_style }
	'
	spacing_y={ spacing }
>
	<slot/>
</Container>
