<script>
	import Nearby from './Nearby.svelte'
	import { below, nearby_y, nearby_y_child } from './nearby'
</script>

<Nearby
	class="{ below } { nearby_y }"
	context_style={ nearby_y_child }
>
	<slot/>
</Nearby>
