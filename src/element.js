import { css } from '@linaria/core'
import { content } from './length'

const target_value = ({ type, value }) => type === 'ratio' ? `${value * 100}%` : `${value}px`

/*
	TODO: to settle conflicts between given size, min, and/or max, perhaps the latest specified should always win
	max (10) (100) // => 10
	min (100) (10) // => 100
	min (100) (max (10) (fill)) // => 100
	max (10) (min (100) (fill)) // => 10
*/
const length_css = (property, length) => {
	return [
		length.type === 'px' ? `${property}: ${length.value}px;` : '',
		length.min.value > 0 ? `min-${property}: ${target_value(length.min)};` : '',
		length.max.value === Infinity ? '' : `max-${property}: ${target_value(length.max)};`
	].join(' ')
}

/*
	 styles necessary for a dom node child of a layout container
*/

// static styles
export const element = css`
	display: flex;
	flex-direction: row;
	flex: 0 0 auto;
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
		anchor_x,
		anchor_y,
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
		anchor_x ? `left: ${anchor_x[1] * 100}%; margin-right: ${anchor_x[1] * -100}%;` : '',
		anchor_y ? `top: ${anchor_y[1] * 100}%;` : '',
		`position: ${anchor_x || anchor_y ? 'absolute' : 'relative'};`,
		x || y || anchor_x || anchor_y
			?
				`transform: translate3d(calc(${(anchor_x?.[0] ?? 0) * -100}% + ${x || 0}px), calc(${(anchor_y?.[0] ?? 0) * -100}% + ${y || 0}px), 0);`
			:
				''
		,
		overflow_style('x', clip_x, scroll_x),
		overflow_style('y', clip_y, scroll_y)
	].join('')
