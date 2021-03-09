const length = type => value => ({ type, value })

export const length_defaults = { min: 0, max: Infinity }

export const px = length('px')

export const ratio = length('ratio')

export const fill = length('fill')
Object.assign(fill, fill(1))

export const grow = length('grow')
Object.assign(grow, grow(1))

export const content = grow(0)

export const format_length_property = length => typeof length === 'number' ? px(length) : length

const format_length_object = ({ type, value, min = 0, max = Infinity }) => ({
	type,
	value,
	min: format_length_property(min),
	max: format_length_property(max)
})

export const format_length = length =>
	format_length_object(format_length_property(length))

const modifier = prop => value => length => ({ ...format_length_property(length), [prop]: value })

export const min = modifier('min')

export const max = modifier('max')
