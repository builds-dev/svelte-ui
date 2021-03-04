const length_defaults = { min: 0, max: Infinity }

const length = type => value => ({ type, value, ...length_defaults })

export const px = length('px')

export const ratio = length('ratio')

export const fill = length('fill')
Object.assign(fill, fill(1))

export const grow = length('grow')
Object.assign(grow, grow(1))

export const content = grow(0)

export const format_length = length => typeof length === 'number' ? px(length) : length

const modifier = prop => value => length => ({ ...format_length(length), [prop]: value })

export const min = modifier('min')

export const max = modifier('max')
