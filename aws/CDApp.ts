import * as CDK from '@aws-cdk/core'
import { CDStack } from './CDStack'

export class CDApp extends CDK.App {
	public constructor({
		stackName,
		repoToWatch: { Owner, Repo, Branch },
	}: {
		stackName: string
		repoToWatch: {
			Repo: string
			Owner: string
			Branch: string
		}
	}) {
		super()

		new CDStack(this, stackName, {
			Owner,
			Repo,
			Branch,
		})
	}
}
