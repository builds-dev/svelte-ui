# svelte-ui

Svelte components for expressing UI in a reasonable and consistent way. Inspired by [elm-ui](https://github.com/mdgriffith/elm-ui).

## getting started

```sh
# install from github
## latest
npm install holographio/svelte-ui#dist
## version
npm install holographio/svelte-ui#v0.0.3-dist
```

```html
<script>
import { Box, Column, Row } from '@holographio/svelte-ui'
</script>

<Column width={fill}>
	<Row width={fill} center_y>
		<Box>Hi there, world!</Box>
	</Row>
</Column>
```

## api

### `Box`

#### `anchor_x={anchor_points}`, `anchor_y={anchor_point}`

Anchors adjust the placement of an element relative to its parent. An anchored element has no effect on sibling elements, and is not affected by sibling elements.

```svelte
<Box height={100} width={200}>
	<!-- right side anchored to parent's right side, bottom side anchored to parent's top side -->
	<Box height={100} width={100} anchor_x={[ 1, 1 ]} anchor_y={[ 1, 0 ]}></Box>
</Box>
```
```
    ╭――╮
    ╰――╯
╭――――――╮
╰――――――╯
```

`anchor_points` are a pair of `number`, `anchor_point` and `parent_anchor_point`.
Anchor points refer to a point on an axis, relative to an element, where `0` refers to the start of the element and `1` refers to the end of the element.

For example:
- 0 on the x axis is the left side of the element.
- 1 on the x axis is the right side of the element.
- 0 on the y axis is the top side of the element.
- 1 on the y axis is the bottom side of the element.
- 0.5 is the center of the element along the given axis.

## major differences from elm-ui

TODO: remove this section, because te library is increasingly way different from elm-ui, svelte aside.

### alignment in sibling contexts

`elm-ui` allows you to express alignment (i.e. `alignRight`) on elements in contexts where they can have siblings (i.e. `column` and `row`). I find this to lead to inconsistencies between what is expressed and what is rendered.

Consider the following:

```elm
row
	[ width fill, spaceEvenly ]
	[
		el [] (text "foo"),
		el [] (text "bar"),
		el [ alignRight ] (text "baz")
	]
```

Without `alignRight`, `baz` would already be rendered at the far right of the row. `foo` would be at the far left, and `baz` would be in the middle.

```
|foo        bar        baz|
```


With `alignRight` on the last `el`, this is how the row is rendered:

```
|foobar                baz|
```

As you can see, `alignRight` on the `baz` element did not cause it to render differently, but rather caused its sibling, `bar`, to change its alignment.

This library holds the position that alignment of children should be expressed on the parent. This is like css flex row with `justify-content`.

## caveats

For the sake of performance and due to Svelte limitations, nearby elements are implemented such that source order is more important than it should be, especially `<In_back>`. `<In_back>` should always be the first child of its parent until this can be remedied.

## running the tests

### run all tests headless:

```sh
npm test
npm run test:watch
```

### run a specific test file headless:

```sh
npm run test -- test/whatever/some_thing.test.svelte
```

### open a specific test in the browser

with live reloading when files change.

```sh
npm run debug -- test/whatever/some_thing.test.svelte
```
