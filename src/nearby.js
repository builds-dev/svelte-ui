import { css } from '@linaria/core'
import { element } from './element'

// TODO: pointer-events: none could be avoided by only expanding the wrapper if the child wants to fill the available space
export const nearby = css`
	position: static;
	margin: 0;
	pointer-events: none;
`

export const nearby_container = css`
	position: absolute !important;
	pointer-events: auto !important;
	z-index: 1;
`

export const nearby_x = css`
	& > .${nearby_container} {
		top: 0;
		height: 100%;
		align-items: flex-start;
		& > ${element}[data-height-base=fill] {
			height: 100%;
		}
	}
`

export const nearby_y = css`
	& > .${nearby_container} {
		left: 0;
		width: 100%;
		& > ${element}[data-width-base=fill] {
			width: 100%;
		}
	}
`

export const in_back = css`
	& > .${nearby_container} {
		z-index: 0;
	}
`

export const on_left = css`
	& > .${nearby_container} {
		right: 100%;
		justify-content: flex-end;
	}
`

export const on_right = css`
	& > .${nearby_container} {
		left: 100%;
	}
`

export const above = css`
	& > .${nearby_container} {
		bottom: 100%;
	}
`

export const below = css`
	& > .${nearby_container} {
		top: 100%;
	}
`
