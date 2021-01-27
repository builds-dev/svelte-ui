import { css } from '@linaria/core'

export const image = css`
	display: block;

	& > img {
		object-fit: cover;
		max-width: 100%;
		max-height: 100%;
	}

	&[data-height-base=fill] > img {
		height: 100%;
	}

	&[data-width-base=fill] > img {
		width: 100%;
	}
`
