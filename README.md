# svelte-ui

An elm-ui like thing for expressing UI in a reasonable way.

## getting started

```sh
# install from github
## latest
npm install holographio/svelte-ui#dist
## version
npm install holographio/svelte-ui#0.0.1
```

```html
<script>
import { Viewport, Box, Column, Row } from 'holographio/svelte-ui'

<Viewport>
	<Column width={fill}>
		<Row width={fill} center_y>
			<Box>Hi there, world!</Box>
		</Row>
	</Column>
</Viewport>
```

## major differences from elm-ui

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

## running the tests

### run all tests headless:

```sh
npm run test
```

### run a specific test file headless:

```sh
npm run test -- $file_path
```

### open a specific test in the browser

```sh
npm run dev -- $file_path
```
