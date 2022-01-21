const within = lower => higher => subject => lower <= subject && subject <= higher

export const rendered_px_equal = x => within (x - 0.5) (x + 0.5)

const axis_scroll_property_map = {
	x: 'scrollLeft',
	y: 'scrollTop'
}
/*
	An element has a scrollbar on `axis` if:
		its `scroll${axis}` property is not 0,
		or does not revert to 0 after being set to a higher number.
*/
export const has_scrollbar = axis => element => {
	const scroll_property = axis_scroll_property_map[axis]
	if (element[scroll_property] === 0) {
		element[scroll_property] = 1
		const result = element[scroll_property] === 1
		element[scroll_property] = 0
		return result
	} else {
		return true
	}
}
