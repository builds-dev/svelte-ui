<script>
	import { nearby, nearby_container } from './nearby'
</script>

<div class="{ nearby } { $$props.class }">
	<div class={ nearby_container }>
		<slot/>
	</div>
</div>
