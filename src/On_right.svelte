<script>
	import Nearby from './Nearby.svelte'
	import { on_right, nearby_x } from './nearby'
</script>

<Nearby class="{ nearby_x } { on_right }">
	<slot/>
</Nearby>
