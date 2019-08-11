import { App } from '@aws-cdk/core'
import { WebhookReceiverStack } from './WebhookReceiverStack'

export class TestApp extends App {
	public constructor({ stackId }: { stackId: string }) {
		super()
		new WebhookReceiverStack(this, stackId)
	}
}
