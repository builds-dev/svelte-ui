<script>
	import Nearby from './Nearby.svelte'
	import { in_back, nearby_x, nearby_y } from './nearby'
</script>

<Nearby class="{ nearby_x} { nearby_y } { in_back }">
	<slot/>
</Nearby>
