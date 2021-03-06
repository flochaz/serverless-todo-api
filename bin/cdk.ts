#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { PipelineStack } from '../lib/pipeline-stack';
import {InfraStage} from "../lib/infra-stage";

const app = new cdk.App();
const domainName = app.node.tryGetContext("domainName");

new PipelineStack(app, 'ServerlessTodoApi-PipelineStack', {
    repositoryName: "serverless-todo-api",
    branchName: "main",
    ownerName: "flochaz",
    domainName: domainName ? domainName : 'flochaz-modernapp',
});


// Implement Infra Stage for developer environment
new InfraStage(app, 'ServerlessTodoApi-Dev', {
    domainName: domainName ? domainName : 'flochaz-modernapp',
    callbackUrls: ['http://localhost', 'http://localhost:3000'],
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION
    },
});

app.synth();
