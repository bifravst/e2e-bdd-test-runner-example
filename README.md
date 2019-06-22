# BDD Feature Runner for AWS Examples

Example use of [@nRFCloud/bdd-feature-runner-aws](https://github.com/nRFCloud/bdd-feature-runner-aws).

In order to run the tests, set up the necessary AWS resources using the AWS CDK:

    npm ci           # install dependencies
    npx tsc          # compile the TypeScript files
    npx cdk deploy   # deploy the stack to your AWS account
    npm test         # run the tests

*Note: AWS CDK follows the AWS SDK way of authenticating. See [this guide](https://awslabs.github.io/aws-cdk/getting-started.html#configuring-the-cdk) to learn more.*

## Webhook receiver

The [`Webhook.feature`](./features/Webhook.feature) shows how to use AWS ApiGateway, Lambda and SQS to set up a real test double for a webhook endpoint. It allows to test that a component which is supposed to send a webhook is actually sending it.

## Set up CI

    aws ssm put-parameter --name /codebuild/github-token --type String --value <Github Token>
    aws ssm put-parameter --name /codebuild/github-username --type String --value <Github Username>
    npx cdk -a 'node dist/aws/cloudformation-ci.js' deploy
    
