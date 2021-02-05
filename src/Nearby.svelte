<script>
	import { nearby, nearby_container } from './nearby'
	import { reset } from './reset'
</script>

<div class="{ nearby } { $$props.class }">
	<div class="{ reset } { nearby_container }">
		<slot/>
	</div>
</div>
