import s3 = require('@aws-cdk/aws-s3');
import lambda = require('@aws-cdk/aws-lambda');
import iam = require('@aws-cdk/aws-iam');
import * as cdk from '@aws-cdk/core';
import { S3EventSource } from '@aws-cdk/aws-lambda-event-sources';

import fs = require('fs');

export class JawsUgBgnr24HomeworkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    /**
     * S3 buckets
     */
    const s3BucketNameSufix = 'replace-to-any-string' // S3 バケットを一意の名前にするためのサフィックス. 例) your-name
    const s3Buckets: {[key: string]: string} = {
      'TranscribeInput': `transcribe-input-${s3BucketNameSufix}`,
      'TranscribeOutput': `transcribe-output-${s3BucketNameSufix}`,
      'TranslateOutput': `translate-output-${s3BucketNameSufix}`,
    };
    const bucketObjects: {[key: string]: s3.Bucket} = {};

    Object.keys(s3Buckets).forEach(bucketUsage => {
      bucketObjects[bucketUsage] = new s3.Bucket(this, bucketUsage, {
        bucketName: s3Buckets[bucketUsage],
        removalPolicy: cdk.RemovalPolicy.DESTROY
      });
    });

    /**
     * Lambda functions
     */
    // 文字起こし用の Lambda 関数
    const transcribeLambdaFn = new lambda.Function(this, 'Transcribe', {
      code: new lambda.InlineCode(
        fs.readFileSync('lambda/transcribe.py', {encoding: 'utf-8'})
        .replace('<TRANSCRIBE-OUTPUT-BUCKET-NAME>', bucketObjects['TranscribeOutput'].bucketName)),
      handler: 'index.lambda_handler',
      timeout: cdk.Duration.seconds(300),
      runtime: lambda.Runtime.PYTHON_3_7
    });

    // IAM ポリシーの追加 (Transcribe と S3 への FullAccess)
    transcribeLambdaFn.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        'transcribe:*',
        's3:*'
      ],
      resources: ['*']
    }));

    // イベントソースの追加 (文字起こし対象の mp3 が TranscribeInput バケットへ PUT されたことをトリガーとする)
    transcribeLambdaFn.addEventSource(new S3EventSource(bucketObjects['TranscribeInput'], {
      events: [s3.EventType.OBJECT_CREATED_PUT],
      filters: [{suffix: '.mp3'}]
    }));

    // 翻訳用の Lambda 関数
    const slackWebHookUrl = 'https://*********' // 翻訳結果を Slack に通知する場合は WebHook URL を指定する
    const transLateLambdaFn = new lambda.Function(this, 'Translate', {
      code: new lambda.InlineCode(
        fs.readFileSync('lambda/translate_from_transcribe.py', {encoding: 'utf-8'})
          .replace('<TRANSLATE-OUTPUT-BUCKET-NAME>', bucketObjects['TranslateOutput'].bucketName)
          .replace('<SLACK-WEBHOOK-URL>', slackWebHookUrl)),
      handler: 'index.lambda_handler',
      timeout: cdk.Duration.seconds(300),
      runtime: lambda.Runtime.PYTHON_3_7
    });

    // IAM ポリシーの追加 (Translate と S3 への FullAccess)
    transLateLambdaFn.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        'translate:*',
        's3:*'
      ],
      resources: ['*']
    }));

    // イベントソースの追加 (文字起こし結果の json が TranscribeInput バケットへ PUT されたことをトリガーとする)
    transLateLambdaFn.addEventSource(new S3EventSource(bucketObjects['TranscribeOutput'], {
      events: [s3.EventType.OBJECT_CREATED_PUT],
      filters: [{suffix: '.json'}]
    }));
  }
}
