# BDD Feature Runner for AWS Examples

[![Greenkeeper badge](https://badges.greenkeeper.io/coderbyheart/bdd-feature-runner-aws-example.svg)](https://greenkeeper.io/)

Example use of
[@coderbyheart/bdd-feature-runner-aws](https://github.com/coderbyheart/bdd-feature-runner-aws).

In order to run the tests, set up the necessary AWS resources using the AWS CDK
(remember to
[authenticate against the GitHub package registry](https://help.github.com/en/articles/configuring-npm-for-use-with-github-package-registry#authenticating-to-github-package-registry)):

    npm ci           # install dependencies
    npx cdk deploy   # deploy the stack to your AWS account
    npm test         # run the tests

_Note: AWS CDK follows the AWS SDK way of authenticating. See
[this guide](https://awslabs.github.io/aws-cdk/getting-started.html#configuring-the-cdk)
to learn more._

## Webhook receiver

The [`Webhook.feature`](./features/Webhook.feature) shows how to use AWS
ApiGateway, Lambda and SQS to set up a real test double for a webhook endpoint.
It allows to test that a component which is supposed to send a webhook is
actually sending it.

## Set up CI/CD

You need to create a
[developer token](https://help.github.com/en/articles/creating-a-personal-access-token-for-the-command-line)
with `repo` and `admin:repo_hook` permissions for an account that has write
permissions to your repository.

You need to store this token in AWS ParameterStore which is a **one-time**
manual step done through the AWS CLI:

    aws ssm put-parameter --name /codebuild/github-token --type String --value <Github Token>
    aws ssm put-parameter --name /codebuild/github-username --type String --value <Github Username>

### CD

Set up the continuous deployment:

    npx cdk -a 'node dist/aws/cloudformation-cd.js' deploy
