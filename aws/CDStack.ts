import * as CDK from '@aws-cdk/core'
import * as IAM from '@aws-cdk/aws-iam'
import * as CodeBuild from '@aws-cdk/aws-codebuild'
import * as CodePipeline from '@aws-cdk/aws-codepipeline'
import * as SSM from '@aws-cdk/aws-ssm'
import * as S3 from '@aws-cdk/aws-s3'

/**
 * This is the CloudFormation stack sets up the continuous deployment of the project.
 */
export class CDStack extends CDK.Stack {
	public constructor(
		parent: CDK.App,
		id: string,
		properties: {
			Repo: string
			Owner: string
			Branch: string
		},
	) {
		super(parent, id)

		const { Repo, Owner, Branch } = properties

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

		const project = new CodeBuild.CfnProject(this, 'CodeBuildProject', {
			name: id,
			description:
				'This project sets up the continuous integration of the BDD Feature Runner AWS example project',
			source: {
				type: 'CODEPIPELINE',
				buildSpec: 'continuous-deployment.yml',
			},
			serviceRole: codeBuildRole.roleArn,
			artifacts: {
				type: 'CODEPIPELINE',
			},
			environment: {
				type: 'LINUX_CONTAINER',
				computeType: 'BUILD_GENERAL1_LARGE',
				image: 'aws/codebuild/standard:2.0',
			},
		})
		project.node.addDependency(codeBuildRole)

		const githubToken = SSM.StringParameter.fromStringParameterAttributes(
			this,
			'ghtoken',
			{
				parameterName: '/codebuild/github-token',
				version: 1,
			},
		)

		const bucket = new S3.Bucket(this, 'bucket', {
			removalPolicy: CDK.RemovalPolicy.RETAIN,
		})

		const codePipelineRole = new IAM.Role(this, 'CodePipelineRole', {
			assumedBy: new IAM.ServicePrincipal('codepipeline.amazonaws.com'),
			inlinePolicies: {
				controlCodeBuild: new IAM.PolicyDocument({
					statements: [
						new IAM.PolicyStatement({
							resources: [project.attrArn],
							actions: ['codebuild:*'],
						}),
					],
				}),
				writeToCDBucket: new IAM.PolicyDocument({
					statements: [
						new IAM.PolicyStatement({
							resources: [bucket.bucketArn, `${bucket.bucketArn}/*`],
							actions: ['s3:*'],
						}),
					],
				}),
			},
		})

		const pipeline = new CodePipeline.CfnPipeline(this, 'CodePipeline', {
			roleArn: codePipelineRole.roleArn,
			artifactStore: {
				type: 'S3',
				location: bucket.bucketName,
			},
			name: id,
			stages: [
				{
					name: 'Source',
					actions: [
						{
							name: 'CloneSource',
							actionTypeId: {
								category: 'Source',
								owner: 'ThirdParty',
								version: '1',
								provider: 'GitHub',
							},
							outputArtifacts: [
								{
									name: 'Source',
								},
							],
							configuration: {
								Branch,
								Owner,
								Repo,
								OAuthToken: githubToken.stringValue,
							},
						},
					],
				},
				{
					name: 'Test',
					actions: [
						{
							name: 'Test',
							inputArtifacts: [
								{
									name: 'Source',
								},
							],
							actionTypeId: {
								category: 'Build',
								owner: 'AWS',
								version: '1',
								provider: 'CodeBuild',
							},
							configuration: {
								ProjectName: project.name,
							},
							outputArtifacts: [
								{
									name: 'BuildId',
								},
							],
						},
					],
				},
			],
		})
		pipeline.node.addDependency(codePipelineRole)

		new CodePipeline.CfnWebhook(this, 'webhook', {
			name: `${id}-InvokePipelineFromGitHubChange`,
			targetPipeline: id,
			targetPipelineVersion: 1,
			targetAction: 'Source',
			filters: [
				{
					jsonPath: '$.ref',
					matchEquals: `refs/heads/${Branch}`,
				},
			],
			authentication: 'GITHUB_HMAC',
			authenticationConfiguration: {
				secretToken: githubToken.stringValue,
			},
			registerWithThirdParty: false,
		})
	}
}
