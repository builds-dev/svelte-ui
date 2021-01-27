import { css } from '@linaria/core'

export const image = css`
	& > img {
		display: block;
		object-fit: cover;
	}

	&[data-height-base=fill] > img {
		height: 100%;
	}

	&[data-width-base=fill] > img {
		width: 100%;
	}
`
