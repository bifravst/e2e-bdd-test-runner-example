import {
    FeatureRunner,
    restStepRunners,
    webhookStepRunners,
    fetchStackConfiguration,
    ConsoleReporter,
} from '@nrfcloud/bdd-feature-runner-aws';

/**
 * This file configures the BDD Feature runner
 * by loading the configuration for the test resources
 * (like AWS services) and providing the required
 * step runners and reporters.
 */

export type World = {
    webhookReceiver: string;
    webhookQueue: string;
};

(async () => {
    const config = await fetchStackConfiguration(
        'bdd-feature-runner-aws-example',
    );
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
    );

    runner
        .addStepRunners(restStepRunners<World>())
        .addStepRunners(webhookStepRunners<World>())
        .run()
        .then(({ success }) => {
            if (!success) {
                process.exit(1);
            }
        });
})();
