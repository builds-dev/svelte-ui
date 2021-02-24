import { css } from '@linaria/core'

export const image = css`
	flex-shrink: 1;

	& > img {
		display: block;
		object-fit: cover;
	}
`
