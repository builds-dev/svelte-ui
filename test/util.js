const within = lower => higher => subject => lower <= subject && subject <= higher

export const rendered_px_equal = x => within (x - 0.5) (x + 0.5)

export const has_scrollbar = (element, { min_scroll_bar_width = 10 } = {}) =>
	getComputedStyle(element).overflowY !== 'hidden'
		&& element.scrollHeight > element.clientHeight
		&& element.clientWidth <= (element.offsetWidth - min_scrollbar_width)
