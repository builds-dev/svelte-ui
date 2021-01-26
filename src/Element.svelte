<script>
	import Spacing_Context, { get_spacing_context } from './Spacing_Context.svelte'
	import { reset } from './reset'
	import { element } from './element'
	import { content, length_css } from './length'

	const context_spacing = get_spacing_context()

	export let ref = undefined

	export let width = content
	export let height = content
	export let x = 0
	export let y = 0
	export let padding = 0
	export let opacity = 1
	export let style = ''
	$: padding_value = Array.isArray(padding)
		? padding.map(n => `${n}px`).join(' ')
		: `${padding}px`
</script>

<div
	bind:this={ ref }
	{ ...$$restProps }
	class="{ reset } { element } { $$props.class || '' }"
	data-height-base={ height.base.type }
	data-width-base={ width.base.type }
	style="
		{ style };
		{ length_css('height', height) };
		{ length_css('width', width) };
		--context-spacing-x: { context_spacing.x }px;
		--context-spacing-y: { context_spacing.y }px;
		padding: { padding_value };
		opacity: { opacity };
		{ x || y ? `transform: translate3d(${ x }px, ${ y }px, 0);` : '' }
	"
>
	<Spacing_Context x={0} y={0}>
		<slot/>
	</Spacing_Context>
</div>
