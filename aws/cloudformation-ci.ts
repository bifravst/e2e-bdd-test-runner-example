import { App, Stack, PhysicalName } from '@aws-cdk/cdk'
import { readFileSync } from 'fs'
import * as path from 'path'
import {
	PolicyDocument,
	PolicyStatement,
	Role,
	ServicePrincipal,
} from '@aws-cdk/aws-iam'
import {
	BuildEnvironmentVariableType,
	Project,
	ComputeType,
	LinuxBuildImage,
	Source,
} from '@aws-cdk/aws-codebuild'
import { parse } from 'url'

/**
 * This is the CloudFormation stack sets up the continuous integration of the projec.
 */
export class CI extends Stack {
	constructor(
		parent: App,
		id: string,
		properties: {
			Repo: string
			Owner: string
		},
	) {
		super(parent, id)

		const { Repo, Owner } = properties

		const codeBuildRole = new Role(this, 'CodeBuildRole', {
			assumedBy: new ServicePrincipal('codebuild.amazonaws.com'),
			inlinePolicies: {
				rootPermissions: new PolicyDocument({
					statements: [
						new PolicyStatement({
							resources: ['*'],
							actions: ['*'],
						}),
					],
				}),
			},
		})

		codeBuildRole.addToPolicy(
			new PolicyStatement({
				resources: [codeBuildRole.roleArn],
				actions: ['iam:PassRole', 'iam:GetRole'],
			}),
		)

		new Project(this, 'CodeBuildProject', {
			projectName: PhysicalName.of(id),
			description: `This project sets up the continuous integration of the BDD Feature Runner AWS example project`,
			source: Source.gitHub({
				cloneDepth: 25,
				repo: Repo,
				owner: Owner,
				reportBuildStatus: true,
				webhook: true,
			}),
			badge: true,
			environment: {
				computeType: ComputeType.Large,
				buildImage: LinuxBuildImage.STANDARD_2_0,
				environmentVariables: {
					GH_USERNAME: {
						value: '/codebuild/github-username',
						type: BuildEnvironmentVariableType.ParameterStore,
					},
					GH_TOKEN: {
						value: '/codebuild/github-token',
						type: BuildEnvironmentVariableType.ParameterStore,
					},
					AWS_REGION: {
						value: this.region.toString(),
						type: BuildEnvironmentVariableType.PlainText,
					},
				},
			},
			role: codeBuildRole,
		})
	}
}

class CIApp extends App {
	constructor() {
		super()

		const pjson = JSON.parse(
			readFileSync(path.join(__dirname, '..', '..', 'package.json'), 'utf-8'),
		)
		const repoUrl = parse(pjson.homepage)
		const Owner = repoUrl.path!.split('/')[1]
		const Repo = repoUrl.path!.split('/')[2]

		new CI(this, 'bdd-feature-runner-aws-ci', {
			Owner,
			Repo,
		})
	}
}

new CIApp().synth()
