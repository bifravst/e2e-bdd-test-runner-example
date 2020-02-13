import * as CDK from '@aws-cdk/core'
import * as SQS from '@aws-cdk/aws-sqs'
import * as Lambda from '@aws-cdk/aws-lambda'
import * as IAM from '@aws-cdk/aws-iam'
import * as ApiGateway from '@aws-cdk/aws-apigateway'
import * as Logs from '@aws-cdk/aws-logs'
import { readFileSync } from 'fs'
import * as path from 'path'

/**
 * This is the CloudFormation stack which contains the webhook receiver resources.
 */
export class WebhookReceiverStack extends CDK.Stack {
	public constructor(parent: CDK.App, id: string) {
		super(parent, id)

		// This queue will store all the requests made to the API Gateway
		const queue = new SQS.Queue(this, 'queue', {
			fifo: true,
			visibilityTimeout: CDK.Duration.seconds(5),
			queueName: `${id}.fifo`,
		})

		// This lambda will publish all requests made to the API Gateway in the queue
		const lambda = new Lambda.Function(this, 'Lambda', {
			description: 'Publishes webhook requests into SQS',
			code: Lambda.Code.inline(
				readFileSync(
					path.resolve(process.cwd(), 'aws', 'lambda.js'),
					'utf-8',
				).toString(),
			),
			handler: 'index.handler',
			runtime: Lambda.Runtime.NODEJS_12_X,
			timeout: CDK.Duration.seconds(15),
			initialPolicy: [
				new IAM.PolicyStatement({
					resources: ['arn:aws:logs:*:*:*'],
					actions: [
						'logs:CreateLogGroup',
						'logs:CreateLogStream',
						'logs:PutLogEvents',
					],
				}),
				new IAM.PolicyStatement({
					resources: [queue.queueArn],
					actions: ['sqs:SendMessage'],
				}),
			],
			environment: {
				SQS_QUEUE: queue.queueUrl,
			},
		})
		// Create the log group here, so we can control the retention
		new Logs.LogGroup(this, `LambdaLogGroup`, {
			removalPolicy: CDK.RemovalPolicy.DESTROY,
			logGroupName: `/aws/lambda/${lambda.functionName}`,
			retention: Logs.RetentionDays.ONE_DAY,
		})

		// This is the API Gateway, AWS CDK automatically creates a prod stage and deployment
		const api = new ApiGateway.RestApi(this, 'api', {
			restApiName: 'Webhook Receiver API',
			description: 'API Gateway to test webhook deliveries',
		})
		const proxyResource = api.root.addResource('{proxy+}')
		proxyResource.addMethod('ANY', new ApiGateway.LambdaIntegration(lambda))
		// API Gateway needs to be able to call the lambda
		lambda.addPermission('InvokeByApiGateway', {
			principal: new IAM.ServicePrincipal('apigateway.amazonaws.com'),
			sourceArn: api.arnForExecuteApi(),
		})
		// Export these so the test runner can use them
		new CDK.CfnOutput(this, 'ApiURL', {
			value: api.url,
			exportName: `${this.stackName}:ApiURL`,
		})
		new CDK.CfnOutput(this, 'QueueURL', {
			value: queue.queueUrl,
			exportName: `${this.stackName}:QueueURL`,
		})
	}
}
