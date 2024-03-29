import resolve from '@rollup/plugin-node-resolve'
import svelte from 'rollup-plugin-svelte'
import linaria_cjs from '@linaria/rollup'
import postcss from 'rollup-plugin-postcss'
import terser from '@rollup/plugin-terser'
import pkg from './package.json' assert { type: 'json' }

const linaria = linaria_cjs.default

// HACK around linaria since it doesn't expose this as an option
// require('stylis').set({ prefix: false })

const plugins = [
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

export default {
	input: './src/index.js',
	output: [
		{
			format: 'esm',
			file: pkg.module,
			// dir: path.dirname(pkg.module),
			// preserveModules: true,
			sourcemap: false
		},
		{
			format: 'cjs',
			file: pkg.main,
			sourcemap: false
		},
		{
			name: pkg['umd:name'] || pkg.name,
			format: 'umd',
			file: pkg.unpkg,
			sourcemap: false,
			plugins: [
				terser()
			]
		}
	],
	plugins
}
