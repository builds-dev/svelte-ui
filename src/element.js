import { css } from '@linaria/core'
import { content, length_css } from './length'
import { get_spacing_context } from './Spacing_context.svelte'

/*
 * styles necessary for a dom node child of a layout container
 */

// static styles
export const element = css`
	flex-basis: auto;
	flex-shrink: 0;
	position: relative;
	box-sizing: border-box;
	height: auto;
	width: auto;

	&[data-height-base=px] {
		height: var(--height-base-value);
	}
	&[data-width-base=px] {
		width: var(--width-base-value);
	}
`

// dynamic styles
export const element_style = ({ height = content, width = content, padding, opacity, x, y }) => {
	const context_spacing = get_spacing_context()
	return [
		length_css('height', height),
		length_css('width', width),
		context_spacing.y ? `margin-top: ${ context_spacing.y }px;` : '',
		context_spacing.x ? `margin-left: ${ context_spacing.x }px;` : '',
		opacity == null ? '' : `opacity: ${opacity};`,
		padding == null
			? ''
			: `padding: ${Array.isArray(padding) ? padding.map(n => `${n}px`).join(' ') : `${padding}px` };`,
		x || y ? `transform: translate3d(${ x }px, ${ y }px, 0);` : ''
	].join('')
}
