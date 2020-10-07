import { readFileSync } from 'fs'
import * as path from 'path'
import { parse } from 'url'
import { CDApp } from './CDApp'
import { stackBaseName } from './stackBaseName'

const pjson = JSON.parse(
	readFileSync(path.join(__dirname, '..', '..', 'package.json'), 'utf-8'),
)
const repoUrl = parse(pjson.homepage)
if (repoUrl.path === undefined || repoUrl.path === null) {
	throw new Error(
		`Failed to detect repository to watch from package.json:homepage: ${pjson.homepage}`,
	)
}
const Owner = repoUrl.path.split('/')[1]
const Repo = repoUrl.path.split('/')[2]
new CDApp({
	stackName: `${stackBaseName()}-cd`,
	repoToWatch: {
		Owner,
		Repo,
		Branch: 'saga',
	},
}).synth()
