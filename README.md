jaws-ug-bgnr-24-homework
---

# 概要

JAWS-UG 初心者支部#24 サーバレスハンズオン勉強会 にて宿題となっていた **文字起こし + 翻訳 パイプライン** を構築するための CDK プロジェクトです。

- [JAWS-UG 初心者支部#24 サーバレスハンズオン勉強会 - connpass](https://jawsug-bgnr.connpass.com/event/165065/)

この CDK プロジェクトで作成されるリソース、構築されるアーキテクチャは次のとおりです。

## 作成されるリソース

- S3 Bucket
  - 文字起こし対象ファイルアップロード用
  - 文字起こし結果出力用
  - 翻訳結果出力用
- Lambda 関数
  - 文字起こし用
  - 翻訳用
- IAM ロール、 IAM ポリシー
  - 文字起こし用 Lambda 関数用
  - 翻訳用 Lambda 関数用

## 構築されるアーキテクチャ

![Architecture created by this CDK project.](./docs/images/JAWS-UG-Beginner-24-Homework.jpg)

## アーキテクチャの詳細

- `transcribe-input-bucket` に英語の音声ファイル (`.mp3`) をアップロードすると、そのイベントをトリガーに、 Amazon Transcribe の API を実行する Lambda 関数が起動します。
- Transcribe による文字起こしの結果は JSON 形式で `transcribe-output` に出力されます。
- `transcribe-output-bucket` への JSON ファイルの出力をトリガーに、 Amazon Translate の API を実行する Lambda 関数が起動します。
- この Lambda 関数では、 Translate による翻訳結果を TXT 形式で `translate-output-bucket` に出力します。また、 Slack の WebHook URL が指定されている場合は Slack への通知も行います。

# 準備

1. AWS CDK のインストール (未インストールの場合)

    ```bash
    $ npm install -g aws-cdk
    $ cdk --version
    1.95.1 (build ed2bbe6)
    ```

2. リポジトリを clone

    ```bash
    $ git clone https://github.com/michimani/jaws-ug-bgnr-24-homework.git
    $ cd jaws-ug-bgnr-24-homework
    ```
    
    対象の AWS アカウントで CDK を初めて使用する場合は、下記のコマンドを実行します。
    
    ```bash
    $ cdk bootstrap
    ```

3. npm パッケージのインストール

    ```bash
    $ npm install
    ```

4. config ファイルの作成

    `stack-config.json.sample` をコピーして `stack-config.json` を作成します。
    
    ```bash
    $ cp stack-config.json.sample stack-config.json
    ```
 
    `stack-config.json` は下記のような内容になっています。
    
    ```json
    {
      "s3_suffix": "replace-to-any-string",
      "slack_webhook_url": "https://*********"
    }
    ```
 
    - `s3_suffix`  
      作成される S3 バケット名のサフィックスを編集します。(自分の名前や日付など、一意になるような文字列を指定します)
    
    - `slack_webhook_url`  
      Slack への通知を行う場合は Incoming WebHook の URL を指定します。
  
5. CloudFormation テンプレートの生成

    ```bash
    $ cdk synth
    ```
    
    `cdk.out` ディレクトリに CloudFormation のテンプレートが生成されます。

6. CDK のデプロイ

    ```bash
    $ cdk deploy
    ```

# パイプラインの実行

`sample/HelloEnglish-Joanna.mp3` を `transcribe-input-****` バケットにアップロードします。  
しばらくすると `translate-output-****` バケットに翻訳結果が `yyyymmddhhmmss_Translate.txt` というキー名で出力されます。Slack の Incoming WebHook URL を指定している場合は、対象となっているチャンネルにも翻訳結果の文章が通知されます。  

サンプルの MP3 ファイルは Amazon Polly のサンプル音源を使用しています。

- [Amazon Polly](https://aws.amazon.com/polly/?nc1=h_ls)

# リソースの削除

作成したリソースを削除する場合は、作成された S3 バケット内のオブジェクトをすべて削除したあとに、下記のコマンドを実行してください。

```bash
$ cdk destroy
```
