import test from 'node:test';
import assert from 'node:assert/strict';

import {
  FILE_CONTENT_ACTION_KEY,
  createFileActionButtons,
  createFileActionData,
  resolveFileActionFromEvent,
} from '../plugins/FileContentPreview/src/utils/fileActions.ts';

const textAttachment = {
  filename: 'notes.txt',
  url: 'https://cdn.example.test/notes.txt',
  size: 1234,
};

const imageAttachment = {
  filename: 'photo.png',
  url: 'https://cdn.example.test/photo.png',
  size: 5678,
};

const isPreviewableAttachment = (attachment) => attachment.filename.endsWith('.txt');

test('resolves preview actions from tagged coded links when original attachments were removed', () => {
  const action = createFileActionData(textAttachment, 'preview');
  const message = {
    codedLinks: [
      { type: 'real-invite' },
      { [FILE_CONTENT_ACTION_KEY]: action },
    ],
    attachments: [],
  };

  assert.deepEqual(
    resolveFileActionFromEvent({
      nativeEvent: { index: 1 },
      message,
      isPreviewableAttachment,
    }),
    action,
  );
});

test('maps generated preview rows back to original attachments', () => {
  const message = {
    codedLinks: [{ type: 'real-invite' }],
    attachments: [imageAttachment, textAttachment],
  };
  const firstFileActionIndex = message.codedLinks.length;

  assert.deepEqual(
    resolveFileActionFromEvent({
      nativeEvent: { index: firstFileActionIndex },
      message,
      isPreviewableAttachment,
    }),
    createFileActionData(textAttachment, 'preview'),
  );
});

test('maps generated preview and download coded-link rows back to original attachments', () => {
  const message = {
    codedLinks: [{ type: 'real-invite' }],
    attachments: [imageAttachment, textAttachment],
  };
  const firstFileActionIndex = message.codedLinks.length;

  assert.deepEqual(
    resolveFileActionFromEvent({
      nativeEvent: { index: firstFileActionIndex },
      message,
      isPreviewableAttachment,
    }),
    createFileActionData(textAttachment, 'preview'),
  );

  assert.deepEqual(
    resolveFileActionFromEvent({
      nativeEvent: { index: firstFileActionIndex + 1 },
      message,
      isPreviewableAttachment,
    }),
    createFileActionData(textAttachment, 'download'),
  );
});

test('resolves adjacent Preview and Download component buttons from the generated action row', () => {
  const [row] = createFileActionButtons(textAttachment, 0);
  const [previewButton, downloadButton] = row.components;
  const message = {
    codedLinks: [],
    attachments: [],
    components: [row],
  };

  assert.equal(typeof row.id, 'string');
  assert.notEqual(row.id, '');
  assert.equal(previewButton.state, 0);
  assert.equal(downloadButton.state, 0);
  assert.equal(previewButton.id, previewButton.customId);
  assert.equal(downloadButton.id, downloadButton.customId);

  assert.deepEqual(
    resolveFileActionFromEvent({
      nativeEvent: { messageId: 'message-1', componentId: previewButton.id },
      message,
      isPreviewableAttachment,
    }),
    createFileActionData(textAttachment, 'preview'),
  );

  assert.deepEqual(
    resolveFileActionFromEvent({
      nativeEvent: { messageId: 'message-1', componentId: downloadButton.id },
      message,
      isPreviewableAttachment,
    }),
    createFileActionData(textAttachment, 'download'),
  );
});

test('ignores real coded links and out-of-range generated action indexes', () => {
  const message = {
    codedLinks: [{ type: 'real-invite' }],
    attachments: [textAttachment],
  };

  assert.equal(
    resolveFileActionFromEvent({
      nativeEvent: { index: 0 },
      message,
      isPreviewableAttachment,
    }),
    null,
  );

  assert.equal(
    resolveFileActionFromEvent({
      nativeEvent: { index: message.codedLinks.length + 2 },
      message,
      isPreviewableAttachment,
    }),
    null,
  );
});
