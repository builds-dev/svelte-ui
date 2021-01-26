const within = lower => higher => subject => lower <= subject && subject <= higher

export const rendered_px_equal = x => within (x - 0.5) (x + 0.5)
