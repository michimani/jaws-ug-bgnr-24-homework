import boto3
import datetime
import json
import re
import urllib.parse
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

s3 = boto3.client('s3')
translate = boto3.client('translate')

TRANSLATE_OUTPUT_BUCKET_NAME = '<TRANSLATE-OUTPUT-BUCKET-NAME>'
SLACK_WEBHOOK_URL = '<SLACK-WEBHOOK-URL>'


def lambda_handler(event, context):
    bucket = event['Records'][0]['s3']['bucket']['name']
    key = urllib.parse.unquote_plus(
        event['Records'][0]['s3']['object']['key'], encoding='utf-8')
    try:
        # 文字起こし結果オブジェクト (json ファイル) を取得
        transcribe_result_obj = s3.get_object(Bucket=bucket, Key=key)

        # json 内から文字起こし結果の文字列を取得
        transcribe_result_json = json.loads(
            transcribe_result_obj['Body'].read().decode('utf-8'))
        input_text = transcribe_result_json['results']['transcripts'][0]['transcript']

        # 翻訳
        response = translate.translate_text(
            Text=input_text,
            SourceLanguageCode='en',
            TargetLanguageCode='ja'
        )

        # 翻訳結果を S3 バケットに出力
        output_key = f'{datetime.datetime.now().strftime("%Y%m%d%H%M%S")}_Translate.txt'
        translated_text = response.get('TranslatedText')
        s3.put_object(
            Bucket=TRANSLATE_OUTPUT_BUCKET_NAME,
            Key=output_key,
            Body=translated_text
        )

        # 翻訳結果を Slack に通知
        if re.match(r'^https:\/\/hooks\.slack\.com\/services\/.*', SLACK_WEBHOOK_URL):
            post_to_slack(translated_text)

    except Exception as e:
        print(e)
        raise e


def post_to_slack(message):
    req = Request(SLACK_WEBHOOK_URL, json.dumps(
        {'text': message}).encode('utf-8'))
    try:
        response = urlopen(req)
        response.read()
    except HTTPError as e:
        print(f'Request failed: {e.code} {e.reason}')
    except URLError as e:
        print(f'Server connection failed: {e.reason}')
