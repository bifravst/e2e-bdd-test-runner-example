import {
	FeatureRunner,
	restStepRunners,
	webhookStepRunners,
	fetchStackConfiguration,
	ConsoleReporter,
} from '@bifravst/e2e-bdd-test-runner'
import { stackBaseName } from '../aws/stackBaseName'
import * as path from 'path'

const region = process.env.AWS_REGION ?? 'eu-central-1'

/**
 * This file configures the BDD Feature runner
 * by loading the configuration for the test resources
 * (like AWS services) and providing the required
 * step runners and reporters.
 */

export type World = {
	webhookReceiver: string
}

const runFeatures = async () => {
	const config = await fetchStackConfiguration({
		StackName: `${stackBaseName()}-test`,
		region,
	})
	const runner = new FeatureRunner<World>(
		{
			webhookReceiver: config.ApiURL,
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
			webhookStepRunners({ region, webhookQueue: config.QueueURL }),
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
