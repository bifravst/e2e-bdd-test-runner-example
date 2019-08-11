# BDD Feature Runner for AWS Examples

![Build Status](https://codebuild.eu-west-1.amazonaws.com/badges?uuid=eyJlbmNyeXB0ZWREYXRhIjoiUTZWUlF6bXlJcFZEY2t2ZFdQMnAyZlhvWnB2aWhQQjdld1FBaEFyMitOYkYyNzYvSjhwaXVGRWNWSmdCQ29UZUdRb1N6SUw4NWtJWlNLNHY0UzlQUjQ0PSIsIml2UGFyYW1ldGVyU3BlYyI6IjBSUnpNQnp2bUtXdFJOUmEiLCJtYXRlcmlhbFNldFNlcmlhbCI6MX0%3D&branch=saga)
[![Greenkeeper badge](https://badges.greenkeeper.io/coderbyheart/bdd-feature-runner-aws-example.svg)](https://greenkeeper.io/)

Example use of
[@coderbyheart/bdd-feature-runner-aws](https://github.com/coderbyheart/bdd-feature-runner-aws).

In order to run the tests, set up the necessary AWS resources using the AWS CDK:

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

### CI

> Note that you need to give CodeBuild permissions to your GitHub account in
> order for it to be able to set up the necessary webhooks. That is a one-time
> operation that can be done through the AWS CLI:

    aws codebuild import-source-credentials \
      --cli-input-json \
      '{"serverType":"GITHUB",\
      "authType":"PERSONAL_ACCESS_TOKEN",\
      "token":"<Github Token>",\
      "username":"<Github Username>"}'

Set up the continuous integration:

    npx cdk -a 'node dist/aws/cloudformation-ci.js' deploy

### CD

Set up the continuous deployment:

    npx cdk -a 'node dist/aws/cloudformation-cd.js' deploy
