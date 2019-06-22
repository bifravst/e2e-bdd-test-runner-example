# BDD Feature Runner for AWS Examples

[![Greenkeeper badge](https://badges.greenkeeper.io/coderbyheart/bdd-feature-runner-aws-example.svg)](https://greenkeeper.io/)

![Build Status](https://codebuild.eu-west-1.amazonaws.com/badges?uuid=eyJlbmNyeXB0ZWREYXRhIjoiUTZWUlF6bXlJcFZEY2t2ZFdQMnAyZlhvWnB2aWhQQjdld1FBaEFyMitOYkYyNzYvSjhwaXVGRWNWSmdCQ29UZUdRb1N6SUw4NWtJWlNLNHY0UzlQUjQ0PSIsIml2UGFyYW1ldGVyU3BlYyI6IjBSUnpNQnp2bUtXdFJOUmEiLCJtYXRlcmlhbFNldFNlcmlhbCI6MX0%3D&branch=saga)

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

> Note that you need to give CodeBuild permissions to your GitHub account in order for the token to work.
> That is a one-time operation that can be done through the AWS Console for CodeBuild.

    aws ssm put-parameter --name /codebuild/github-token --type String --value <Github Token>
    aws ssm put-parameter --name /codebuild/github-username --type String --value <Github Username>
    npx cdk -a 'node dist/aws/cloudformation-ci.js' deploy
    
