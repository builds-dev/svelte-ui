<script>
	import Layout_context from './Layout_context.svelte'
	import { nearby, nearby_child } from './nearby'
	export let context_style
</script>

<div class="{ nearby } { $$props.class }">
	<Layout_context
		context_class={ nearby_child }
		{context_style}
	>
		<slot/>
	</Layout_context>
</div>
