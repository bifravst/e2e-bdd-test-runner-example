import { App } from '@aws-cdk/core'
import { CIStack } from './CIStack'

export class CIApp extends App {
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
