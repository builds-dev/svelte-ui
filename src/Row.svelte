<script>
	import Container from './Container.svelte'
	import { css } from '@linaria/core'
	import { element } from './element'

	export const row = css`
		flex-direction: row;
		justify-content: flex-start;
		align-items: flex-start;

		& > ${element}[data-height-base=fill] {
			align-self: stretch;
		}

		& > ${element}[data-width-base=fill] {
			flex-basis: 0;
			flex-grow: var(--width-base-value);
		}

		& > ${element}[data-height-base=content] {
			height: auto;
		}

		& > ${element}[data-width-base=content] {
			flex-basis: auto;
			flex-grow: 0;
		
	`

	export let ref = undefined
	export let spacing = 0
	export let style = ''

	export let center_x = false
	export let align_right = false
	export let center_y = false
	export let align_bottom = false

	$: justify_content_style = align_right || center_x ? `justify-content: ${ align_right ? 'flex-end' : 'center' };` : ''
	$: align_items_style = align_bottom || center_y ? `align-items: ${ align_bottom ? 'flex-end' : 'center' };` : ''
</script>

<Container
	bind:ref
	{ ...$$restProps }
	class="{ row } { $$props.class || '' }"
	style='
		{ style };
		{ justify_content_style }
		{ align_items_style }
	'
	spacing_x={ spacing }
>
	<slot name='in_back' slot='in_back'/>
	<slot/>
	<slot name='above' slot='above'/>
	<slot name='below' slot='below'/>
	<slot name='on_left' slot='on_left'/>
	<slot name='on_right' slot='on_right'/>
	<slot name='in_front' slot='in_front'/>
</Container>
