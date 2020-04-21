import urllib.parse
import boto3
import datetime

s3 = boto3.client('s3')
transcribe = boto3.client('transcribe')

TRANSCRIBE_OUTPUT_BUCKET_NAME = '<TRANSCRIBE-OUTPUT-BUCKET-NAME>'


def lambda_handler(event, context):
    region = event['Records'][0]['awsRegion']
    bucket = event['Records'][0]['s3']['bucket']['name']
    key = urllib.parse.unquote_plus(
        event['Records'][0]['s3']['object']['key'], encoding='utf-8')
    try:
        transcribe_result_name = f'{datetime.datetime.now().strftime("%Y%m%d%H%M%S")}_Transcription'
        transcribe_source_file = f'https://s3.{region}.amazonaws.com/{bucket}/{key}'
        transcribe.start_transcription_job(
            TranscriptionJobName=transcribe_result_name,
            LanguageCode='en-US',
            Media={
                'MediaFileUri': transcribe_source_file
            },
            OutputBucketName=TRANSCRIBE_OUTPUT_BUCKET_NAME
        )
    except Exception as e:
        print(e)
        print(
            f'Error getting object {key} from bucket {bucket}. Make sure they exist and your bucket is in the same region as this function.')
        raise e
