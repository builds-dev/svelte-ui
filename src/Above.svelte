<script>
	import Nearby from './Nearby.svelte'
	import { above, nearby_y } from './nearby'
</script>

<Nearby class="{ nearby_y } { above }">
	<slot/>
</Nearby>
