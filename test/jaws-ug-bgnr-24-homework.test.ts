import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import JawsUgBgnr24Homework = require('../lib/jaws-ug-bgnr-24-homework-stack');

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new JawsUgBgnr24Homework.JawsUgBgnr24HomeworkStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
