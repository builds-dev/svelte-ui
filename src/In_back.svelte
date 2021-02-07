<script>
	import Nearby from './Nearby.svelte'
	import { in_back, nearby_z, nearby_z_child } from './nearby'
</script>

<Nearby
	class="{ in_back } { nearby_z }"
	context_style={ nearby_z_child }
>
	<slot/>
</Nearby>
