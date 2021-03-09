## fun times hitting walls

- `align-self: stretch` is an easy way for a child to fill up cross axis space because:
	- it is unaffected by the margin hack used to polyfill flex gap (the implementation of `spacing`)
		- using height/width: 100%; requires subtracting the margin... the child takes up the full height of the parent and additionally has the margin inside of the parent
				demonstrated here:

			```html
				<div style='display: flex;'>
					<div style='display: flex; align-self: stretch;'>
						<div style='display: flex; height: 100%; width: 100px; margin-top: 50px; background: lightblue;'></div>
						<div style='display: flex; height: 100px; width: 100px; margin-top: 50px; background: lightgreen;'></div>
					</div>
				</div>
			```

			while align-self: stretch; takes up the remaining space available accounting for the margin.

		- height/width: 100% has strange contextual rules. As in the previous code block, the child with height: 100%; will not fill up the vertical space (or any) unless: its grandparent has display: flex; and flex-direction: row, and parent has `display: flex; and flex-direction: row, as well as align-self: stretch;
			align-self-stretch requires no additional concern but that the parent has display: flex;
				demonstrated here:

			```html
				<div style='display: flex;'>
					<div style='display: flex; align-self: stretch; width: 100px; background: lightblue;'></div>
					<div style='display: flex; height: 100px; width: 100px; background: lightgreen;'></div>
				</div>
			```

- align-self: stretch; has the unfortunate, but obvious effect of overriding the parent's align-items value in regard to that child. This wouldn't matter if the child is truly taking up all the cross axis space in the parent, but that is not the case when the child also specifies a max value for that length, and it computed lesser than the parent's length. For example, a 100px tall row says to vertically center its children, and one of its children says to fill the height available, up to a maximum of 50px. The expectation is that the child will be its maximum 50px tall, and be vertically cenetered in the parent, but the child will be aligned to the top of the parent if the child has specified align-self: stretch;
- align-self: self; is a limited expression compared to 100%, because percentage can express the full range of values up to and beyond the full length, whereas align-self: stretch can only express the equivalent of 100% (where contextually applicable).

	- On account of the limitations of align-self: stretch and the contextual problems of height/width: 100%, this library's semantics can't be implemented with a one-to-one relationship between the library's components and dom nodes. A parent must be two nodes or a child must be two nodes.
		- Regarding a parent being two nodes:
			- Polyfilling flex gap requires negative margin on the row/column, which is problematic for styles such as background and border. The negative margin moves the element above/before its natural/intended position, and the positive margin on the child moves the children back to the position they ought to be in, had the parent not been moved. The immediate parent of the children is positioned prior to where it should be and larger than it should be due to the margin of its children, so relevant styles such as backround and border are wonky. Therefore, for so long as flex gap polyfilling is needed, it is ideal to have an outer element that acts as the "box" being placed and styled, and in inner element that gets the negative margin and has the row/column rules.
			- The height: 100% contextual issue can be solved simply by making the outer element always a row, and the inner element a row or column that has the same dimensions as the outer.
				- An efficient, single element / single child box having the same API can be implemented due to the height: 100% issue only existing when the parent is being sized by its content i.e. the largest child, and a sibling wants to take up all the space made available by that sibiling. The box component having only one child means this case does not exist, so no issue. There is also no spacing (flex gap), as there is only one child, so the margin based polyfill is not needed, so again, no need for two elements.
		- Regarding a child being two nodes:
			- I don't have any arguments for this. Maybe some against, but not strongly researched: seems like it should take more code and be more complex i.e. each child is stretching its outer element and then sizing and aligning its inner element, repeating what could have been done by the parent alone. No more single element / single child box?

- The clear choice seems to be a two-element row/column and using % to fill up space on the cross axis. This will work out *until* messing with `flex-wrap`. `flex-wrap` and cross axis `%` is irredeemably WHACK. Don't do it unless you want to make the world a little worse.

## wrapping / TODO:

There is no direct support for wrapping rows/columns because the flex (and any css) implementation is awkward at best and limiting. It is not possible for children of a wrapping row/column to express things this library allows, such as cross-axis grow/fill/ratio and have an according implementation with flex (or any other css).
For now, when `flex-wrap: wrap` is needed, use the `container_style` prop.
Examples:

```html
<Row height={content} container_style='flex-wrap: wrap; align-content: flex-start;'>
	<Box height={20}/>
	<Box height={fill}/> <!-- fills 20 px -->
</Row>

<Row height={500} container_style='flex-wrap: wrap; align-content: flex-start;'> <!-- the row will be 500 px tall, but the children will not use it.
	<Box height={20}/>
	<Box height={fill}/> <!-- fills 20 px -->
</Row>
```

The above behavior is simple and predictable, but limiting. Try different `align-content` values and cross axis length values on children as needed.

Eventually, it would be good to implement wrapping in a way that reveals its true nature: a wrapping row is actually a column of dynamically created rows.
Having a way to specify the style of each row as it comes would be nice:

```html
<Rows each={(row, index) => ({ height: (index + 1) * 50, width: fill })}>
	<!-- children that get put into rows in here -->
</Rows>
```

NOTE:
CSS `flex-direction: column; flex-wrap: wrap;` is SEVERELY flawed. When the column gets its width according to its children, and children wrap, they do not expand the column's width accordingly, but instead overflow. While the forementioned weakness means flex wrapping is undesirable, this behavior makes it so unreliable that it should just be disregarded entirely, as much as possible.
```html
	<div style='display: flex; border: 3px solid orange;'>
		<div style='display: flex; flex-direction: column; border: 3px solid red; flex-wrap: wrap; max-height: 50px;'>
			<div>foo</div>
			<div>bar</div>
			<div>baz</div>
		</div>
	</div>
```

## ratio

TODO: I am not so sure this is right, but it's the only consistent, rational take on it I can come up with.

`ratio` refers to a ratio of the space claimed by the parent, in contrast to the space taken by its children. The space claimed by a `content/grow` parent is 0, because it is just whatever size its children are.
When a parent has content/grow on a dimension, ratio values on that dimension for the child, for width/height, max, and min must evaluate to 0.
i.e the content/grow parent is claiming 0 space, and a width or max width of 0.5 of 0 is 0.
