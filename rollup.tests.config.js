import resolve from '@rollup/plugin-node-resolve'
import svelte from 'rollup-plugin-svelte'
import linaria from '@linaria/rollup'
import postcss from 'rollup-plugin-postcss'
import serve from 'rollup-plugin-serve'
import livereload from 'rollup-plugin-livereload'
import glob_module_files from 'glob-module-file'
import browser_run from 'browser-run'

export default {
	input: './test/test.js',
	output: {
		file: './build/app.js',
		name: 'tests',
		format: 'iife',
		sourcemap: 'inline'
	},
	plugins: [
		{
			load: async function (id) {
				return id.includes('build/test-components.js')
					? {
						code: await glob_module_files({
							pattern: process.env.GLOB || './{src,test,tests}/**/*.{spec,test}.svelte',
							format: 'es',
							pathPrefix: '../',
							exportWithPath: true
						})
					}
					: null
			}
		},
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
		}),
		...(
			process.env.RUN === 'debug' && process.env.ROLLUP_WATCH
				? [
					serve({
						open: true,
						contentBase: './build'
					}),
					livereload({ watch: './build/app.js' })
				]
				: []
		),
		process.env.RUN === 'test'
			&& {
				generateBundle: (options, bundle) => {
					const browser = browser_run({ browser: 'electron' })
					browser.write(bundle['app.js'].code)
					browser.pipe(process.stdout)
					browser.end()
				}
			}
	]
}
