<script>
	import Nearby from './Nearby.svelte'
	import { above, nearby_y, nearby_y_child } from './nearby'
</script>

<Nearby
	class="{ above } { nearby_y }"
	context_style={ nearby_y_child }
>
	<slot/>
</Nearby>
