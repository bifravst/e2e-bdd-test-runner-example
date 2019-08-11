import * as CDK from '@aws-cdk/core'
import { CDStack } from './CDStack'

export class CDApp extends CDK.App {
	public constructor({
		stackId,
		repoToWatch: { Owner, Repo, Branch },
	}: {
		stackId: string
		repoToWatch: {
			Repo: string
			Owner: string
			Branch: string
		}
	}) {
		super()

		new CDStack(this, stackId, {
			Owner,
			Repo,
			Branch,
		})
	}
}
