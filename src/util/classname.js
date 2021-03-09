export const concat = names => names.reduce((acc, value) => value ? `${acc} ${value}` : acc, '')
