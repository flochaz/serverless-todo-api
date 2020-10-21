import {App, SecretValue, Stack, StackProps} from '@aws-cdk/core';
import {CdkPipeline, SimpleSynthAction, ShellScriptAction} from '@aws-cdk/pipelines';
import { InfraStage } from './infra-stage';
import {GitHubSourceAction, GitHubTrigger} from '@aws-cdk/aws-codepipeline-actions';
import { Artifact } from '@aws-cdk/aws-codepipeline';
import { PolicyStatement } from '@aws-cdk/aws-iam';
import {LinuxBuildImage} from "@aws-cdk/aws-codebuild";

interface PipelineStackProps extends StackProps {
  readonly repositoryName: string;
  readonly ownerName: string;
  readonly branchName: string;
  readonly domainName: string;
}

export class PipelineStack extends Stack {
  constructor(app: App, id: string, props: PipelineStackProps) {
    super(app, id, props);

    const sourceArtifact = new Artifact('SourceOutput');
    const cloudAssemblyArtifact = new Artifact();

    // Creating CodePipeline object
    const pipeline = new CdkPipeline(this, 'ServerlessTodoApi-Pipeline', {
      cloudAssemblyArtifact,
      sourceAction: new GitHubSourceAction({
        actionName: 'Github',
        // Replace these with your actual GitHub project name
        owner: props.ownerName,
        repo: props.repositoryName,
        trigger: GitHubTrigger.POLL,
        oauthToken: SecretValue.secretsManager('GITHUB_TOKEN'),
        branch: props.branchName,
        output: sourceArtifact,
      }),
      // How it will be built and synthesized
      synthAction: SimpleSynthAction.standardYarnSynth({
        sourceArtifact,
        cloudAssemblyArtifact,
        // We need a build step to compile the TypeScript Lambda
        installCommand: 'make install',
        buildCommand: 'make build',
        environment: {
          buildImage: LinuxBuildImage.STANDARD_4_0,
          privileged: true
        }
      })
    });

    const infraStage = new InfraStage(this, 'ServerlessTodoApi-Beta', {
      domainName: props.domainName,
      callbackUrls: [ 'http://localhost:3000' ]
    })
    // Beta Stage
    const beta = pipeline.addApplicationStage(infraStage);

    beta.addActions(new ShellScriptAction({
      actionName: 'TestUsingBuildArtifact',
      useOutputs: {
        // When the test is executed, this will make $URL contain the
        // load balancer address.
        TODO_API_ENDPOINT: pipeline.stackOutput(infraStage.restApiEndpoint),
      },
      rolePolicyStatements: [
        new PolicyStatement({
          actions: ['execute-api:Invoke'],
          resources: ['arn:aws:execute-api:*:*:*'],
        }),
      ],
      additionalArtifacts: [sourceArtifact],
      // 'test.js' was produced from 'test/test.ts' during the synth step
      commands: ['npm install', 'npm run test'],
    })

    );    
  }
}
