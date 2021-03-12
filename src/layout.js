import { css } from '@linaria/core'
import { element } from './element'
import { space_evenly, space_between, space_around } from './spacing.js'

const fill_main_axis = (property, length) => `flex-grow: ${length.value}; flex-basis: 0px; ${property}: 0px; ${length.min ? '' : `min-${property}: 0px;`}`

const fill_cross_axis = spacing => spacing ? `calc(100% - ${spacing}px)` : '100%'

const child_ratio_length = (property, parent, child) => child[property].type === 'ratio'
	? `${property}: ${parent[property].type === 'grow' ? '0px' : `${child[property].value * 100}%`};`
	: ''

/*
 * styles necessary for a dom node containing one or more children (layout container)
 *
 * a layout container must choose an axis as its basis for layout, even if it can only contain one child
 */

// static styles
export const layout = css`
	display: flex;
	flex-wrap: nowrap;
	align-items: flex-start;
	justify-content: flex-start;
`

// dynamic styles
export const layout_style = ({ wrap }) => wrap ? 'flex-wrap: wrap; align-content: flex-start;' : ''

// static styles for x layout
export const layout_x = css`
	flex-direction: row;
`

export const layout_child = (parent, child) =>
	[
		child_ratio_length('height', parent, child),
		child_ratio_length('width', parent, child),
		parent.spacing_y ? `margin-top: ${ parent.spacing_y }px;` : '',
		parent.spacing_x ? `margin-left: ${ parent.spacing_x }px;` : '',
	].join('')

export const layout_x_child = ({ spacing_x = 0, spacing_y = 0 } = {}) => ({ height, width }) =>
	[
		height.type === 'fill' ? `height: ${fill_cross_axis(spacing_y)};` : '',
		height.type === 'grow' && height.value > 0 ? `height: ${fill_cross_axis(spacing_y)};` : '',
		width.type === 'fill' ? fill_main_axis('width', width) : '',
		width.type === 'grow' ? `flex-grow: ${width.value};` : ''
	].join('')

// static styles for y layout
export const layout_y = css`
	flex-direction: column;
`

export const layout_y_child = ({ spacing_x = 0, spacing_y = 0 } = {}) => ({ height, width }) =>
	[
		height.type === 'fill' ? fill_main_axis('height', height) : '',
		height.type === 'grow' ? `flex-grow: ${height.value};` : '',
		width.type === 'fill' ? `width: ${fill_cross_axis(spacing_x)};` : '',
		width.type === 'grow' && width.value > 0 ? `width: ${fill_cross_axis(spacing_x)};` : ''
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
