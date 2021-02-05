const length_defaults = { min: 0, max: Infinity }

export const fill = (portion = 1) => ({ base: { type: 'fill', value: portion }, ...length_defaults })
Object.assign(fill, fill(1))

export const content = { base: { type: 'content' }, ...length_defaults }

export const px = value => ({ base: { type: 'px', value }, ...length_defaults })

export const min = value => length => ({ ...format_length(length), min: value })

export const max = value => length => ({ ...format_length(length), max: value })

export const format_length = length => typeof length === 'number' ? px(length) : length

export const length_css = (property, length) => {
	const { base, min, max } = format_length(length)
	return [
		`--${property}-base-value: ${ base.value || 0 }${ base.type === 'px' ? 'px' : '' };`,
		min ? `min-${property}: ${ min }px;` : '',
		max == null || max === Infinity ? '' : `max-${property}: ${ max }px;`
	].join(' ')
}
