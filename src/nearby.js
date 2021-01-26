import { css } from '@linaria/core'
import { element } from './element'

export const nearby = css`
	position: static;
	margin: 0;
	pointer-events: none;
`

export const nearby_container = css`
	position: absolute !important;
	pointer-events: none !important;
	z-index: 1;
`

export const nearby_x = css`
	top: 0;
	height: 100%;
	align-items: flex-start;
	& > ${element}[data-height-base=fill] {
		height: 100%;
	}
`

export const nearby_y = css`
	left: 0;
	width: 100%;
	& > ${element}[data-width-base=fill] {
		width: 100%;
	}
`

export const in_back = css`
	z-index: 0;
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