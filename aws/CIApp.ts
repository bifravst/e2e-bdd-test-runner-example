import * as CDK from '@aws-cdk/core'
import { CIStack } from './CIStack'

export class CIApp extends CDK.App {
	public constructor({
		stackId,
		repoToWatch: { Owner, Repo },
	}: {
		stackId: string
		repoToWatch: {
			Repo: string
			Owner: string
		}
	}) {
		super()

		new CIStack(this, stackId, {
			Owner,
			Repo,
		})
	}
}
