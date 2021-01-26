<script>
	import Nearby from './Nearby.svelte'
	import { below, nearby_y } from './nearby'
</script>

<Nearby class="{ nearby_y } { below }">
	<slot/>
</Nearby>
