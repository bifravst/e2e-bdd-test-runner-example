import { readFileSync } from 'fs'
import * as path from 'path'
import { parse } from 'url'
import { CIApp } from './CIApp'

const STACK_ID = process.env.STACK_ID || 'bdd-feature-runner-aws-ci'

const pjson = JSON.parse(
	readFileSync(path.join(__dirname, '..', '..', 'package.json'), 'utf-8'),
)
const repoUrl = parse(pjson.homepage)
if (!repoUrl.path) {
	throw new Error(
		`Failed to detect repository to watch from package.json:homepage: ${pjson.homepage}`,
	)
}
const Owner = repoUrl.path.split('/')[1]
const Repo = repoUrl.path.split('/')[2]

new CIApp({
	stackId: STACK_ID,
	repoToWatch: {
		Owner,
		Repo,
	},
}).synth()
