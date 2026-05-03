import test from 'node:test';
import assert from 'node:assert/strict';

import { describeFileActionForLog, getLogPrefix } from '../plugins/FileContentPreview/src/utils/debugLogger.ts';

test('debug logger summarizes file actions without leaking full URLs', () => {
  const summary = describeFileActionForLog({
    action: 'download',
    filename: 'notes.txt',
    url: 'https://cdn.discordapp.com/attachments/channel/message/notes.txt?token=secret',
    size: 1234,
  });

  assert.equal(summary.action, 'download');
  assert.equal(summary.filename, 'notes.txt');
  assert.equal(summary.size, 1234);
  assert.equal(summary.hasUrl, true);
  assert.equal(summary.urlHost, 'cdn.discordapp.com');
  assert.equal(JSON.stringify(summary).includes('token=secret'), false);
});

test('debug logger prefix is easy to filter in Revenge logs', () => {
  assert.equal(getLogPrefix(), '[FileContentPreview]');
});
