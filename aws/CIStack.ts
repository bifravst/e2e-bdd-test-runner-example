import { App, Stack } from '@aws-cdk/core'
import {
	PolicyDocument,
	PolicyStatement,
	Role,
	ServicePrincipal,
} from '@aws-cdk/aws-iam'
import {
	BuildEnvironmentVariableType,
	ComputeType,
	LinuxBuildImage,
	Project,
	Source,
} from '@aws-cdk/aws-codebuild'

/**
 * This is the CloudFormation stack sets up the continuous integration of the projec.
 */
export class CIStack extends Stack {
	public constructor(
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
			projectName: id,
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
				computeType: ComputeType.LARGE,
				buildImage: LinuxBuildImage.STANDARD_2_0,
				environmentVariables: {
					GH_USERNAME: {
						value: '/codebuild/github-username',
						type: BuildEnvironmentVariableType.PARAMETER_STORE,
					},
					GH_TOKEN: {
						value: '/codebuild/github-token',
						type: BuildEnvironmentVariableType.PARAMETER_STORE,
					},
					AWS_REGION: {
						value: this.region.toString(),
						type: BuildEnvironmentVariableType.PLAINTEXT,
					},
				},
			},
			role: codeBuildRole,
		})
	}
}
