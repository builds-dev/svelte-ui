<script>
	import Nearby from './Nearby.svelte'
	import { on_left, nearby_x } from './nearby'
</script>

<Nearby class="{ nearby_x } { on_left }">
	<slot/>
</Nearby>
