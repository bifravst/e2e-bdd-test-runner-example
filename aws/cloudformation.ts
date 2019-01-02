import { App, Stack, Output } from '@aws-cdk/cdk';
import {
    PolicyStatement,
    PolicyStatementEffect,
    ServicePrincipal,
} from '@aws-cdk/aws-iam';
import { Queue } from '@aws-cdk/aws-sqs';
import { LogGroup } from '@aws-cdk/aws-logs';
import { RestApi, LambdaIntegration } from '@aws-cdk/aws-apigateway';
import { Code, Runtime, Function } from '@aws-cdk/aws-lambda';
import { readFileSync } from 'fs';

/**
 * This is the CloudFormation stack which contains the webhook receiver resources.
 */
export class WebhookReceiver extends Stack {
    constructor(parent: App, id: string) {
        super(parent, id);

        // This queue will store all the requests made to the API Gateway
        const queue = new Queue(this, 'queue', {
            fifo: true,
            visibilityTimeoutSec: 5,
        });

        // This lambda will publish all requests made to the API Gateway in the queue
        const lambda = new Function(this, 'Lambda', {
            description: 'Publishes webhook requests into SQS',
            code: Code.inline(readFileSync('./aws/lambda.js').toString()),
            handler: 'index.handler',
            runtime: Runtime.NodeJS810,
            timeout: 15,
            initialPolicy: [
                new PolicyStatement(PolicyStatementEffect.Allow)
                    .addResource('arn:aws:logs:*:*:*')
                    .addAction('logs:CreateLogGroup')
                    .addAction('logs:CreateLogStream')
                    .addAction('logs:PutLogEvents'),
                new PolicyStatement(PolicyStatementEffect.Allow)
                    .addResource(queue.queueArn)
                    .addAction('sqs:SendMessage'),
            ],
            environment: {
                SQS_QUEUE: queue.queueUrl,
            },
        });
        // Create the log group here, so we can control the retention
        new LogGroup(this, `LambdaLogGroup`, {
            retainLogGroup: false,
            logGroupName: `/aws/lambda/${lambda.functionName}`,
            retentionDays: 1,
        });

        // This is the API Gateway, AWS CDK automatically creates a prod stage and deployment
        const api = new RestApi(this, 'api', {
            restApiName: 'Webhook Receiver API',
            description: 'API Gateway to test webhook deliveries',
        });
        const proxyResource = api.root.addResource('{proxy+}');
        proxyResource.addMethod('ANY', new LambdaIntegration(lambda));
        // API Gateway needs to be able to call the lambda
        lambda.addPermission('InvokeByApiGateway', {
            principal: new ServicePrincipal('apigateway.amazonaws.com'),
            sourceArn: api.executeApiArn(),
        });
        // Export these so the test runner can use them
        new Output(this, 'ApiURL', {
            value: api.url,
            export: `${this.name}:ApiURL`,
        });
        new Output(this, 'QueueURL', {
            value: queue.queueUrl,
            export: `${this.name}:QueueURL`,
        });
    }
}

class TestApp extends App {
    constructor() {
        super();
        new WebhookReceiver(this, 'bdd-feature-runner-aws-example');
    }
}

new TestApp().run();
