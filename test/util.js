const within = lower => higher => subject => lower <= subject && subject <= higher

export const rendered_px_equal = x => within (x - 0.5) (x + 0.5)

// NOTE: doesn't work on some browsers/devices because scrollbars have no width. This kind of check is just way too unreliable.
// and that's why scrollbar based tests fail on mobile devices and Safari
export const has_scrollbar = (element, { min_scrollbar_width = 10 } = {}) =>
	getComputedStyle(element).overflowY !== 'hidden'
		&& element.scrollHeight > element.clientHeight
		&& element.clientWidth <= (element.offsetWidth - min_scrollbar_width)
