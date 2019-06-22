import {
	FeatureRunner,
	restStepRunners,
	webhookStepRunners,
	fetchStackConfiguration,
	ConsoleReporter,
} from '@coderbyheart/bdd-feature-runner-aws'

const STACK_ID = process.env.STACK_ID || 'bdd-feature-runner-aws-example'

/**
 * This file configures the BDD Feature runner
 * by loading the configuration for the test resources
 * (like AWS services) and providing the required
 * step runners and reporters.
 */

export type World = {
	webhookReceiver: string
	webhookQueue: string
}

const runFeatures = async () => {
	const config = await fetchStackConfiguration(STACK_ID)
	const runner = new FeatureRunner<World>(
		{
			webhookReceiver: config.ApiURL,
			webhookQueue: config.QueueURL,
		},
		{
			dir: './features',
			reporters: [
				new ConsoleReporter({
					printProgress: true,
					printResults: true,
				}),
			],
		},
	)

	return runner
		.addStepRunners(restStepRunners<World>())
		.addStepRunners(webhookStepRunners<World>())
		.run()
}

runFeatures()
	.then(({ success }) => {
		if (!success) {
			process.exit(1)
		}
	})
	.catch(error => {
		console.error(error)
		process.exit(1)
	})
