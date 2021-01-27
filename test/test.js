import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import tests from '../build/test-components'

const keep_alive = !navigator.userAgent.toLowerCase().includes('electron')

const suites = tests
	.map(({ path: file, export: Component }) => ({
		Component,
		test_name: Component.name.split('_').slice(0, -1).join(' '),
		suite_name: file.split('/').slice(-2)[0]
	}))
	.reduce(
		(suites, { suite_name, ...test }) => {
			suites[suite_name] = suites[suite_name] || []
			suites[suite_name].push(test)
			return suites
		},
		{}
	)

Object.entries(suites)
	.forEach(([ suite_name, tests ]) => {
		const test = suite(suite_name)
		tests.forEach(({ test_name, Component }) => {
			test(test_name, () => {
				const component = new Component({ target: document.body })
				if (!keep_alive) {
					component.$destroy()
				}
			})
		})
		test.run()
	})

if (!keep_alive) {
	window.requestAnimationFrame(() => window.close())
}
