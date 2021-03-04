import { css } from '@linaria/core'
import { element } from './element'
import { space_evenly, space_between, space_around } from './spacing.js'

/*
 * This needs to be a big enough number that any `grow(n)` element will get less than half a pixel of extra width, which would round down to 0px extra width.
 * This makes it so that if any sibling has `fill`, then there is no excess width to distribute to siblings with `grow`, even though they are both implemented with flex-grow.
 */
const fill_flex_grow_modifier = 100000

/*
 * styles necessary for a dom node containing one or more children (layout container)
 *
 * a layout container must choose an axis as its basis for its layout, even if it can only contain one child
 */

// static styles
export const layout = css`
	display: flex;
	flex-wrap: nowrap;
	align-items: flex-start;
	justify-content: flex-start;
`

// dynamic styles
export const layout_style = ({ wrap }) => wrap ? 'flex-wrap: wrap;' : ''

// static styles for x layout
export const layout_x = css`
	flex-direction: row;
`

export const spacing_child = ({ spacing_x, spacing_y }) =>
	[
		spacing_y ? `margin-top: ${ spacing_y }px;` : '',
		spacing_x ? `margin-left: ${ spacing_x }px;` : '',
	].join('')

export const layout_x_child = ({ spacing_x = 0, spacing_y = 0 } = {}) => ({ height, width }) =>
	[
		// height.type === 'fill' ? `height: ${spacing_y ? `calc(100% - ${spacing_y}px)` : '100%'};` : '',
		height.type === 'fill' ? 'align-self: stretch;' : '',
		height.type === 'grow' && height.value > 0 ? `align-self: stretch;` : '',
		width.type === 'fill' ? `flex-grow: ${width.value * fill_flex_grow_modifier}; flex-basis: 0%; ${width.min ? '' : 'min-width: 0;'}` : '',
		width.type === 'grow' ? `flex-grow: ${width.value};` : ''
	].join('')

// static styles for y layout
export const layout_y = css`
	flex-direction: column;
`

/*
 * NOTE: an element with `{dimension}=fill` must specify a min-{dimension} (i.e. min-width: 0) or min-{dimension} will default to min-content,
 * potentially causing content to expand the parent beyond its regular fill size.
 */
export const layout_y_child = ({ spacing_x = 0, spacing_y = 0 } = {}) => ({ height, width }) =>
	[
		height.type === 'fill' ? `flex-grow: ${height.value * fill_flex_grow_modifier}; flex-basis: 0%; ${height.min ? '' : 'min-height: 0;'}` : '',
		height.type === 'grow' ? `flex-grow: ${height.value};` : '',
		// width.type === 'fill' ? `width: ${spacing_x ? `calc(100% - ${spacing_x}px)` : '100%'};` : '',
		width.type === 'fill' ? 'align-self: stretch;' : '',
		width.type === 'grow' && width.value > 0 ? 'align-self: stretch;' : ''
	].join('')

// dynamic styles for x layout
export const layout_x_style = ({ align_bottom, center_y, align_right, center_x }) =>
	[
		align_right || center_x ? `justify-content: ${ align_right ? 'flex-end' : 'center' };` : '',
		align_bottom || center_y ? `align-items: ${ align_bottom ? 'flex-end' : 'center' };` : ''
	].join('')

// dynamic styles for y layout
export const layout_y_style = ({ align_bottom, center_y, align_right, center_x }) =>
	[
		align_bottom || center_y ? `justify-content: ${ align_bottom ? 'flex-end' : 'center' };` : '',
		align_right || center_x ? `align-items: ${ align_right ? 'flex-end' : 'center' };` : ''
	].join('')

// dynamic styles for layout with spacing
export const spacing_context = (x, y) => [
	typeof x === 'number' ? `margin-left: -${ x }px;` : '',
	typeof y === 'number' ? `margin-top: -${ y }px;` : ''
].join('')

// dynamic styles for x layout with spacing
export const spacing_x_context = (x, y) => [
	typeof x === 'string' ? `justify-content: ${x};` : '',
	typeof y === 'string' ? `align-content: ${y};` : ''
].join('')

// dynamic styles for y layout with spacing
export const spacing_y_context = (x, y) => [
	typeof x === 'string' ? `align-content: ${x};` : '',
	typeof y === 'string' ? `justify-content: ${y};` : ''
].join('')
