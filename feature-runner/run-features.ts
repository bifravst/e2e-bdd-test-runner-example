import {
	FeatureRunner,
	restStepRunners,
	webhookStepRunners,
	fetchStackConfiguration,
	ConsoleReporter,
} from '@coderbyheart/bdd-feature-runner-aws'
import { stackBaseName } from '../aws/stackBaseName'
import * as path from 'path'

const region =
	process.env.AWS_DEFAULT_REGION || process.env.AWS_REGION || 'eu-central-1'

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
	const config = await fetchStackConfiguration({
		StackName: `${stackBaseName()}-test`,
		region,
	})
	const runner = new FeatureRunner<World>(
		{
			webhookReceiver: config.ApiURL,
			webhookQueue: config.QueueURL,
		},
		{
			dir: path.resolve(process.cwd(), 'features'),
			reporters: [
				new ConsoleReporter({
					printProgress: true,
					printResults: true,
				}),
			],
		},
	)

	return runner
		.addStepRunners(restStepRunners())
		.addStepRunners(
			webhookStepRunners<World>({ region }),
		)
		.run()
}

runFeatures()
	.then(({ success }) => {
		if (!success) {
			process.exit(1)
		}
	})
	.catch((error) => {
		console.error(error)
		process.exit(1)
	})
