<script>
	import Nearby from './Nearby.svelte'
	import { on_right, nearby_x, nearby_x_child } from './nearby'
</script>

<Nearby
	class="{ on_right } { nearby_x }"
	context_style={ nearby_x_child }
>
	<slot/>
</Nearby>
