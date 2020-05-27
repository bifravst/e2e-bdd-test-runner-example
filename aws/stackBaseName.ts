/**
 * Used to globally define a "namespace" for this project's CloudFormation
 * stacks.
 */
export const stackBaseName = (): string =>
	process.env.STACK_BASE_NAME ?? 'bdd-feature-runner-aws-example'
