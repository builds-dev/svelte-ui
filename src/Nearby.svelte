<script>
	import { nearby, nearby_container } from './nearby'
	import { reset } from './reset'

	const class_name = `${ reset } ${ nearby_container } ${ $$props.class || '' }`

	/*
		A. working around svelte awkwardness
			1. using the i.e. <div slot='above'> element as the nearby_container
				Because slots are needed to control the order the nearby elements end up in the dom, for the sake of layering order consistency
				and the slot attribute is not currently supported on custom components
					<Box slot='above'> <!-- not supported -->
				so we must pass the slot content in a dom node
				and that additional dom node is in the way of the nearby container styling
				putting display: contents; on it via something like `> [slot]` solves the styling issue in a sense...
				but also breaks child selectors expecting the slot content to be a direct child of nearby_container
				whereas that child would then be the `<div slot='above'>` node instead.
		
			2. removing the dom node of this component if it has no children, meaning no slot content was actually passed
				This is necessary because
					{#if $$slots.above} <slot name='above' slot='above'/> {/if}
				is not supported by Svelte, so components like Row pass the slot content to Container, even though they don't have anything to pass
				this makes the `{#if $$slots.above}` checks in Container useless, so this component, Nearby, is always rendered.
	*/
	const action = node => {
		if (node.children.length === 0) {
			node.parentNode.removeChild(node)
		}
		for (const child of node.children) {
			child.className = class_name
		}
	}
</script>

<div use:action class="{ nearby }">
	<slot/>
</div>

<style>
	/* see A.1. */
	div:empty {
		display: none;
	}
</style>
