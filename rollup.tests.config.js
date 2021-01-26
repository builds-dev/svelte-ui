import resolve from '@rollup/plugin-node-resolve'
import svelte from 'rollup-plugin-svelte'
import linaria from '@linaria/rollup'
import postcss from 'rollup-plugin-postcss'

// HACK around linaria since it doesn't expose this as an option
// require('stylis').set({ prefix: false })

export default {
	input: './test/test.js',
	output: {
		name: 'tests',
		format: 'iife',
		sourcemap: 'inline'
	},
	plugins: [
		resolve({
			browser: true,
			dedupe: [ 'svelte' ]
		}),
		svelte({
			compilerOptions: {
				hydratable: true
			},
			emitCss: false
		}),
		linaria({ sourceMap: false }),
		postcss({
		  extract: false,
			plugins: []
		})
	]
}
