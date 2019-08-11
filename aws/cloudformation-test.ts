import { TestApp } from './TestApp'
import { stackBaseName } from './stackBaseName'

new TestApp({
	stackId: `${stackBaseName()}-test`,
}).synth()
