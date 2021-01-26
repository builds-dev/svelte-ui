<script>
	import Nearby from './Nearby.svelte'
	import { nearby_x, nearby_y } from './nearby'
</script>

<Nearby class="{ nearby_x} { nearby_y }">
	<slot/>
</Nearby>
