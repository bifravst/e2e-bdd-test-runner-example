import { TestApp } from './TestApp'
import { stackBaseName } from './stackBaseName'

new TestApp({
	stackName: `${stackBaseName()}-test`,
}).synth()
