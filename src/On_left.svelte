<script>
	import Nearby from './Nearby.svelte'
	import { on_left, nearby_x, nearby_x_child } from './nearby'
</script>

<Nearby
	class="{ on_left } { nearby_x }"
	context_style={ nearby_x_child }
>
	<slot/>
</Nearby>
