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
	<slot/>
</Row>
