import { css } from '@linaria/core'

export const element = css`
	&[data-height-base=px] {
		height: var(--height-base-value);
	}
	&[data-width-base=px] {
		width: var(--width-base-value);
	}

	&:not(:first-child) {
		margin-top: var(--context-spacing-y);
		margin-left: var(--context-spacing-x);
	}
`
