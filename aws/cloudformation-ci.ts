import { App, RemovalPolicy, Stack } from '@aws-cdk/cdk';
import { readFileSync } from 'fs';
import * as path from 'path';
import {
    PolicyDocument,
    PolicyStatement,
    Role,
    ServicePrincipal,
} from '@aws-cdk/aws-iam';
import * as codebuild from '@aws-cdk/aws-codebuild';
import * as codepipeline from '@aws-cdk/aws-codepipeline';
import { Bucket } from '@aws-cdk/aws-s3';
import { StringParameter } from '@aws-cdk/aws-ssm';
import { parse } from 'url';

/**
 * This is the CloudFormation stack sets up the continuous integration of the projec.
 */
export class CI extends Stack {
    constructor(
        parent: App,
        id: string,
        properties: {
            Branch: string;
            Repo: string;
            Owner: string;
        },
    ) {
        super(parent, id);

        const { Branch, Repo, Owner } = properties;

        const bucket = new Bucket(this, 'bucket', {
            removalPolicy: RemovalPolicy.Destroy,
        });

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
        });

        codeBuildRole.addToPolicy(
            new PolicyStatement({
                resources: [codeBuildRole.roleArn],
                actions: ['iam:PassRole', 'iam:GetRole'],
            }),
        );

        const project = new codebuild.CfnProject(this, 'CodeBuildProject', {
            name: id,
            description: `This project sets up the continuous integration of the BDD Feature Runner AWS example project`,
            source: {
                type: 'CODEPIPELINE',
            },
            serviceRole: codeBuildRole.roleArn,
            artifacts: {
                type: 'CODEPIPELINE',
            },
            environment: {
                type: 'LINUX_CONTAINER',
                computeType: 'BUILD_GENERAL1_LARGE',
                image: 'aws/codebuild/standard:2.0',
                environmentVariables: [
                    {
                        name: 'GH_USERNAME',
                        value: '/codebuild/github-username',
                        type: 'PARAMETER_STORE',
                    },
                    {
                        name: 'GH_TOKEN',
                        value: '/codebuild/github-token',
                        type: 'PARAMETER_STORE',
                    },
                    {
                        name: 'AWS_REGION',
                        value: this.region.toString(),
                    },
                ],
            },
        });
        project.node.addDependency(codeBuildRole);

        const codePipelineRole = new Role(this, 'CodePipelineRole', {
            assumedBy: new ServicePrincipal('codepipeline.amazonaws.com'),
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
        });

        const githubToken = StringParameter.fromStringParameterAttributes(
            this,
            'ghtoken',
            {
                parameterName: '/codebuild/github-token',
                version: 1,
            },
        );

        const p = new codepipeline.CfnPipeline(this, 'CodePipeline', {
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
                            name: 'SourceAction',
                            actionTypeId: {
                                category: 'Source',
                                owner: 'ThirdParty',
                                version: '1',
                                provider: 'GitHub',
                            },
                            outputArtifacts: [
                                {
                                    name: 'SourceOutput',
                                },
                            ],
                            configuration: {
                                Branch,
                                Owner,
                                Repo,
                                OAuthToken: githubToken.stringValue,
                            },
                            runOrder: 1,
                        },
                    ],
                },
                {
                    name: 'Deploy',
                    actions: [
                        {
                            name: 'DeployAction',
                            inputArtifacts: [{ name: 'SourceOutput' }],
                            actionTypeId: {
                                category: 'Build',
                                owner: 'AWS',
                                version: '1',
                                provider: 'CodeBuild',
                            },
                            configuration: {
                                ProjectName: project.name,
                            },
                            runOrder: 1,
                            outputArtifacts: [
                                {
                                    name: 'BuildId',
                                },
                            ],
                        },
                    ],
                },
            ],
        });
        p.node.addDependency(codePipelineRole);

        new codepipeline.CfnWebhook(this, 'webhook', {
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
        });
    }
}

class CIApp extends App {
    constructor() {
        super();

        const pjson = JSON.parse(
            readFileSync(
                path.join(__dirname, '..', '..', 'package.json'),
                'utf-8',
            ),
        );
        const Branch = pjson.release.branch || 'master';
        const repoUrl = parse(pjson.homepage);
        const Owner = repoUrl.path!.split('/')[1];
        const Repo = repoUrl.path!.split('/')[2];

        new CI(this, 'bdd-feature-runner-aws-ci', {
            Branch,
            Owner,
            Repo,
        });
    }
}

new CIApp().synth();
