import { css } from '@linaria/core'

/*
	The `position` of `element_style` in `element.js` overrides this `position: absolute`, breaking nearby elements.
	Nearby elements are deprecated by anchoring and should be removed in the future.
	Meanwhile, this bug is fixed by `position: absolute !important;`.
*/
export const nearby = css`
	display: flex;
	position: absolute !important;
	pointer-events: none;
`

export const nearby_x = css`
	top: 0;
	z-index: 1;
	height: 100%;
`

export const nearby_y = css`
	left: 0;
	z-index: 1;
	width: 100%;
`

export const nearby_z = css`
	top: 0;
	left: 0;
	height: 100%;
	width: 100%;
`

export const in_back = css`
	z-index: 0;
`

export const in_front = css`
	z-index: 1;
`

export const on_left = css`
	right: 100%;
	justify-content: flex-end;
`

export const on_right = css`
	left: 100%;
`

export const above = css`
	bottom: 100%;
`

export const below = css`
	top: 100%;
`

export const nearby_child = css`
	pointer-events: auto;
`

export const nearby_x_child = ({ height }) =>
	height.type === 'fill' ? 'height: 100%;' : ''

export const nearby_y_child = ({ width }) =>
	width.type === 'fill' ? 'width: 100%;' : ''

export const nearby_z_child = props => `${nearby_x_child(props)}${nearby_y_child(props)}`
