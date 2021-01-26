<script>
	import { css } from '@linaria/core'
	import { nearby } from './nearby'
	import Row from './Row.svelte'

	export let ref = undefined

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
</script>

<Row
	bind:ref
	{ ...$$restProps }
	class="{ box } { $$props.class || '' }"
>
	<slot name='in_back' slot='in_back'/>
	<slot/>
	<slot name='above' slot='above'/>
	<slot name='below' slot='below'/>
	<slot name='on_left' slot='on_left'/>
	<slot name='on_right' slot='on_right'/>
	<slot name='in_front' slot='in_front'/>
</Row>
