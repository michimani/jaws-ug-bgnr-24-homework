#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { JawsUgBgnr24HomeworkStack } from '../lib/jaws-ug-bgnr-24-homework-stack';

const app = new cdk.App();
new JawsUgBgnr24HomeworkStack(app, 'JawsUgBgnr24HomeworkStack');
