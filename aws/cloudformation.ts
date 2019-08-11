import { App, CfnOutput, Duration, RemovalPolicy, Stack } from '@aws-cdk/core'
import { PolicyStatement, ServicePrincipal } from '@aws-cdk/aws-iam'
import { Queue } from '@aws-cdk/aws-sqs'
import { LogGroup, RetentionDays } from '@aws-cdk/aws-logs'
import { LambdaIntegration, RestApi } from '@aws-cdk/aws-apigateway'
import { Code, Function, Runtime } from '@aws-cdk/aws-lambda'
import { readFileSync } from 'fs'

const STACK_ID = process.env.STACK_ID || 'bdd-feature-runner-aws-example'

/**
 * This is the CloudFormation stack which contains the webhook receiver resources.
 */
export class WebhookReceiver extends Stack {
	constructor(parent: App, id: string) {
		super(parent, id)

		// This queue will store all the requests made to the API Gateway
		const queue = new Queue(this, 'queue', {
			fifo: true,
			visibilityTimeout: Duration.seconds(5),
		})

		// This lambda will publish all requests made to the API Gateway in the queue
		const lambda = new Function(this, 'Lambda', {
			description: 'Publishes webhook requests into SQS',
			code: Code.inline(readFileSync('./aws/lambda.js').toString()),
			handler: 'index.handler',
			runtime: Runtime.NODEJS_10_X,
			timeout: Duration.seconds(15),
			initialPolicy: [
				new PolicyStatement({
					resources: ['arn:aws:logs:*:*:*'],
					actions: [
						'logs:CreateLogGroup',
						'logs:CreateLogStream',
						'logs:PutLogEvents',
					],
				}),
				new PolicyStatement({
					resources: [queue.queueArn],
					actions: ['sqs:SendMessage'],
				}),
			],
			environment: {
				SQS_QUEUE: queue.queueUrl,
			},
		})
		// Create the log group here, so we can control the retention
		new LogGroup(this, `LambdaLogGroup`, {
			removalPolicy: RemovalPolicy.DESTROY,
			logGroupName: `/aws/lambda/${lambda.functionName}`,
			retention: RetentionDays.ONE_DAY,
		})

		// This is the API Gateway, AWS CDK automatically creates a prod stage and deployment
		const api = new RestApi(this, 'api', {
			restApiName: 'Webhook Receiver API',
			description: 'API Gateway to test webhook deliveries',
		})
		const proxyResource = api.root.addResource('{proxy+}')
		proxyResource.addMethod('ANY', new LambdaIntegration(lambda))
		// API Gateway needs to be able to call the lambda
		lambda.addPermission('InvokeByApiGateway', {
			principal: new ServicePrincipal('apigateway.amazonaws.com'),
			sourceArn: api.arnForExecuteApi(),
		})
		// Export these so the test runner can use them
		new CfnOutput(this, 'ApiURL', {
			value: api.url,
			exportName: `${this.stackName}:ApiURL`,
		})
		new CfnOutput(this, 'QueueURL', {
			value: queue.queueUrl,
			exportName: `${this.stackName}:QueueURL`,
		})
	}
}

class TestApp extends App {
	constructor() {
		super()
		new WebhookReceiver(this, STACK_ID)
	}
}

new TestApp().synth()
