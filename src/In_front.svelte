<script>
	import { in_front, nearby_z, nearby, nearby_z_child } from './nearby'
	import Layout_context from './Layout_context.svelte'
</script>

<Layout_context
	context_class="{ in_front } { nearby_z } { nearby }"
	context_style={nearby_z_child}
>
	<slot/>
</Layout_context>
