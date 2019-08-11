import { TestApp } from './TestApp'

const STACK_ID = process.env.STACK_ID || 'bdd-feature-runner-aws-example'

new TestApp({
	stackId: STACK_ID,
}).synth()
