import { css } from '@linaria/core'
import { element } from './element'
import { space_evenly, space_between, space_around } from './spacing.js'

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

	& > ${element}[data-height-base=fill] {
		align-self: stretch;
	}

	& > ${element}[data-width-base=fill] {
		flex-basis: 0;
		flex-grow: var(--width-base-value);
	}

	& > ${element}[data-height-base=content] {
		height: auto;
	}

	& > ${element}[data-width-base=content] {
		flex-basis: auto;
		flex-grow: 0;
	}
`

// static styles for y layout
export const layout_y = css`
	flex-direction: column;

	& > ${element}[data-height-base=fill] {
		flex-basis: 0;
		flex-grow: var(--height-base-value);
	}

	& > ${element}[data-width-base=fill] {
		align-self: stretch;
	}

	& > ${element}[data-height-base=content] {
		flex-basis: auto;
		flex-grow: 0;
	}

	& > ${element}[data-width-base=content] {
		width: auto;
	}
`

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
