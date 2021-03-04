import { css } from '@linaria/core'
import { content, format_length } from './length'

const length_css = (property, { type, value, min, max }) => {
	return [
		type === 'px' ? `${property}: ${value}px;` : '',
		type === 'ratio' ? `${property}: ${value * 100}%;` : '',
		min ? `min-${property}: ${ min }px;` : '',
		max == null || max === Infinity ? '' : `max-${property}: ${ max }px;`
	].join(' ')
}

/*
 * styles necessary for a dom node child of a layout container
 */

// static styles
export const element = css`
	display: flex;
	flex-direction: row;
	flex: 0 0 auto;
	position: relative;
	box-sizing: border-box;
	overflow: visible;
`

const overflow_style = (axis, clip, scroll) => clip || scroll
	? `overflow-${axis}: ${clip ? 'hidden' : 'auto'};`
	: ''

// dynamic styles
export const element_style = (
	{
		height = content,
		width = content,
		padding,
		opacity,
		x,
		y,
		clip_x,
		clip_y,
		scroll_x,
		scroll_y
	}
) =>
	[
		length_css('height', height),
		length_css('width', width),
		opacity == null ? '' : `opacity: ${opacity};`,
		padding == null
			? ''
			: `padding: ${Array.isArray(padding) ? padding.map(n => `${n}px`).join(' ') : `${padding}px` };`,
		x || y ? `transform: translate3d(${ x || 0 }px, ${ y || 0 }px, 0);` : '',
		overflow_style('x', clip_x, scroll_x),
		overflow_style('y', clip_y, scroll_y)
	].join('')
