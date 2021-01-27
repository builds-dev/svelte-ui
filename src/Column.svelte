<script>
	import Container from './Container.svelte'
	import { css } from '@linaria/core'
	import { element } from './element'

	const column = css`
		flex-direction: column;

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
</script>

<Container
	bind:ref
	{ ...$$restProps }
	class="{ column } { $$props.class || '' }"
	style='
		{ style };
		justify-content: { align_bottom ? 'flex-end' : center_y ? 'center' : 'flex-start' };
		align-items: { align_right ? 'flex-end' : center_x ? 'center' : 'flex-start' };
	'
	spacing_y={ spacing }
>
	<slot name='in_back' slot='in_back'/>
	<slot/>
	<slot name='above' slot='above'/>
	<slot name='below' slot='below'/>
	<slot name='on_left' slot='on_left'/>
	<slot name='on_right' slot='on_right'/>
	<slot name='in_front' slot='in_front'/>
</Container>
