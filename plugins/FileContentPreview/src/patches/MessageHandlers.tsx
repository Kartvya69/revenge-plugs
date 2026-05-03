import { findByStoreName, findByProps } from '@vendetta/metro';
import filetypes from '../filetypes';
import MessageHandlers from '../utils/MessageHandlersPatcher';
import { FCModal } from '../ui/FCModal';
import { downloadFile } from '../utils/downloadFile';
import { isFileActionCustomId, resolveFileActionFromEvent } from '../utils/fileActions';
import getMessages from '../translations';
import { debugLog, debugWarn, describeFileActionForLog } from '../utils/debugLogger';
import { showDiagnosticToast } from '../utils/runtimeDiagnostics';

const SelectedChannelStore = findByStoreName('SelectedChannelStore');
const MessageStore = findByStoreName('MessageStore');
const modals = findByProps('pushModal');
const intl = findByProps('intl').intl;

function isPreviewableAttachment(attachment) {
  return filetypes.has(attachment.filename?.toLowerCase().split('.').pop());
}

function normalizeMessage(message) {
  if (!message) return null;

  /** Forwards */
  if (message?.messageSnapshots?.[0]?.message) {
    return message.messageSnapshots[0].message;
  }

  return message;
}

function getMessage(nativeEvent, eventData = null) {
  const eventMessage = normalizeMessage(eventData?.message ?? nativeEvent?.message);
  if (eventMessage) return eventMessage;

  if (!nativeEvent?.messageId) return null;

  const { messageId } = nativeEvent;
  let channel = SelectedChannelStore.getChannelId();
  let message = MessageStore.getMessage(channel, messageId);

  if (!message) return null;

  /** Starter thread messages */
  if (message.messageReference && message.messageReference.type == 0 && message.messageReference.channel_id != channel) {
    message = MessageStore.getMessage(message.messageReference.channel_id, message.messageReference.message_id);
  }

  return normalizeMessage(message);
}

function openPreview({ filename, url, size }) {
  debugLog('preview.open', { filename, size, hasUrl: Boolean(url) });
  modals.pushModal({
    key: 'file-content-preview',
    modal: {
      key: 'file-content-preview',
      modal: FCModal,
      props: { filename, url, bytes: size },
      animation: 'slide-up',
      shouldPersistUnderModals: false,
      closable: true,
    },
  });
}

function getNativeEvent(args) {
  return args?.[0]?.nativeEvent ?? args?.[0];
}

function runFileAction(action) {
  if (!action) {
    debugWarn('action.missing');
    showDiagnosticToast('FCP tap: no file action');
    return false;
  }

  debugLog('action.run', describeFileActionForLog(action));
  showDiagnosticToast(`FCP tap: ${action.action === 'download' ? 'Download' : 'Preview'}`);

  if (action.action === 'download') {
    const translations = getMessages(intl.currentLocale);
    downloadFile(action.url, {
      saveText: translations.FILE_SAVED,
      failText: translations.FILE_SAVE_ERROR,
    });
    return true;
  }

  openPreview(action);
  return true;
}

function resolveInviteFileAction(args) {
  const nativeEvent = getNativeEvent(args);
  const message = getMessage(nativeEvent, args?.[0]);
  const action = resolveFileActionFromEvent({ nativeEvent, message, isPreviewableAttachment });

  debugLog('invite.tap', {
    nativeEvent,
    hasMessage: Boolean(message),
    action: describeFileActionForLog(action),
  });

  return action;
}

function handleInviteFileAction(args, originalFunction) {
  const action = resolveInviteFileAction(args);

  if (!action) {
    return originalFunction(...args);
  }

  runFileAction(action);
  return null;
}

function handleButtonActionComponent(args, originalFunction) {
  const nativeEvent = getNativeEvent(args);
  const customId =
    typeof nativeEvent === 'string'
      ? nativeEvent
      : nativeEvent?.id ??
        nativeEvent?.componentId ??
        nativeEvent?.custom_id ??
        nativeEvent?.customId ??
        nativeEvent?.component?.id ??
        nativeEvent?.component?.componentId ??
        nativeEvent?.component?.custom_id ??
        nativeEvent?.component?.customId;

  if (!isFileActionCustomId(customId)) {
    debugLog('button.tap.passthrough', { customId, nativeEvent });
    return originalFunction(...args);
  }

  const message = getMessage(nativeEvent, args?.[0]);
  const action = resolveFileActionFromEvent({ nativeEvent, message, isPreviewableAttachment });

  debugLog('button.tap.fileAction', {
    customId,
    nativeEvent,
    hasMessage: Boolean(message),
    action: describeFileActionForLog(action),
  });

  if (!runFileAction(action)) {
    return originalFunction(...args);
  }

  return null;
}

export default function patch() {
  const unpatchTap = MessageHandlers.patchInstead('handleTapInviteEmbed', handleInviteFileAction);
  const unpatchAccept = MessageHandlers.patchInstead('handleTapInviteEmbedAccept', handleInviteFileAction);
  const unpatchButton = MessageHandlers.patchInstead('handleTapButtonActionComponent', handleButtonActionComponent);

  return () => {
    unpatchTap();
    unpatchAccept();
    unpatchButton();
  };
}
