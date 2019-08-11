import * as CDK from '@aws-cdk/core'
import * as IAM from '@aws-cdk/aws-iam'
import * as CodeBuild from '@aws-cdk/aws-codebuild'

/**
 * This is the CloudFormation stack sets up the continuous integration of the projec.
 */
export class CIStack extends CDK.Stack {
	public constructor(
		parent: CDK.App,
		id: string,
		properties: {
			Repo: string
			Owner: string
		},
	) {
		super(parent, id)

		const { Repo, Owner } = properties

		const codeBuildRole = new IAM.Role(this, 'CodeBuildRole', {
			assumedBy: new IAM.ServicePrincipal('codebuild.amazonaws.com'),
			inlinePolicies: {
				rootPermissions: new IAM.PolicyDocument({
					statements: [
						new IAM.PolicyStatement({
							resources: ['*'],
							actions: ['*'],
						}),
					],
				}),
			},
		})

		codeBuildRole.addToPolicy(
			new IAM.PolicyStatement({
				resources: [codeBuildRole.roleArn],
				actions: ['iam:PassRole', 'iam:GetRole'],
			}),
		)

		new CodeBuild.Project(this, 'CodeBuildProject', {
			projectName: id,
			description: `This project sets up the continuous integration of the BDD Feature Runner AWS example project`,
			source: CodeBuild.Source.gitHub({
				cloneDepth: 25,
				repo: Repo,
				owner: Owner,
				reportBuildStatus: true,
				webhook: true,
			}),
			badge: true,
			environment: {
				computeType: CodeBuild.ComputeType.LARGE,
				buildImage: CodeBuild.LinuxBuildImage.STANDARD_2_0,
				environmentVariables: {
					GH_USERNAME: {
						value: '/codebuild/github-username',
						type: CodeBuild.BuildEnvironmentVariableType.PARAMETER_STORE,
					},
					GH_TOKEN: {
						value: '/codebuild/github-token',
						type: CodeBuild.BuildEnvironmentVariableType.PARAMETER_STORE,
					},
					AWS_REGION: {
						value: this.region.toString(),
						type: CodeBuild.BuildEnvironmentVariableType.PLAINTEXT,
					},
				},
			},
			role: codeBuildRole,
		})
	}
}
