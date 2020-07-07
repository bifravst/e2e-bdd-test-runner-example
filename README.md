# BDD Feature Runner for AWS Examples

[![GitHub Actions](https://github.com/bifravst/e2e-bdd-test-runner-example/workflows/Test%20and%20Release/badge.svg)](https://github.com/bifravst/e2e-bdd-test-runner-example/actions)
[![Known Vulnerabilities](https://snyk.io/test/github/bifravst/e2e-bdd-test-runner-example/badge.svg?targetFile=package.json)](https://snyk.io/test/github/bifravst/e2e-bdd-test-runner-example?targetFile=package.json)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![Mergify Status](https://img.shields.io/endpoint.svg?url=https://dashboard.mergify.io/badges/bifravst/e2e-bdd-test-runner-example&style=flat)](https://mergify.io)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier/)
[![ESLint: TypeScript](https://img.shields.io/badge/ESLint-TypeScript-blue.svg)](https://github.com/typescript-eslint/typescript-eslint)

Example use of
[@bifravst/e2e-bdd-test-runner](https://github.com/bifravst/e2e-bdd-test-runner).

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

## Set up CD

You need to create a
[developer token](https://help.github.com/en/articles/creating-a-personal-access-token-for-the-command-line)
with `repo` and `admin:repo_hook` permissions for an account that has write
permissions to your repository.

You need to store this token in AWS ParameterStore which is a **one-time**
manual step done through the AWS CLI:

    aws ssm put-parameter --name /codebuild/github-token --type String --value <Github Token>
    aws ssm put-parameter --name /codebuild/github-username --type String --value <Github Username>

Then set up the continuous deployment:

    npx cdk -a 'node dist/aws/cloudformation-cd.js' deploy

## Architecture decision records (ADRs)

see [./adr](./adr).
