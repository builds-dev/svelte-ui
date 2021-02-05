import { css } from '@linaria/core'
import { content, length_css } from './length'

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
export const element_style = ({ height = content, width = content, padding, opacity, x, y }, context_spacing_x, context_spacing_y) =>
	[
		length_css('height', height),
		length_css('width', width),
		context_spacing_y ? `margin-top: ${ context_spacing_y }px;` : '',
		context_spacing_x ? `margin-left: ${ context_spacing_x }px;` : '',
		opacity == null ? '' : `opacity: ${opacity};`,
		padding == null
			? ''
			: `padding: ${Array.isArray(padding) ? padding.map(n => `${n}px`).join(' ') : `${padding}px` };`,
		x || y ? `transform: translate3d(${ x }px, ${ y }px, 0);` : ''
	].join('')
