import { findByStoreName, findByProps } from '@vendetta/metro';
import filetypes from '../filetypes';
import MessageHandlers from '../utils/MessageHandlersPatcher';
import { FCModal } from '../ui/FCModal';
import { resolveFileActionFromEvent } from '../utils/fileActions';

const SelectedChannelStore = findByStoreName('SelectedChannelStore');
const MessageStore = findByStoreName('MessageStore');
const modals = findByProps('pushModal');

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
  if (!action) return false;
  openPreview(action);
  return true;
}

function resolveInviteFileAction(args) {
  const nativeEvent = getNativeEvent(args);
  const message = getMessage(nativeEvent, args?.[0]);
  return resolveFileActionFromEvent({ nativeEvent, message, isPreviewableAttachment });
}

function handleInviteFileAction(args, originalFunction) {
  const action = resolveInviteFileAction(args);

  if (!action) {
    return originalFunction(...args);
  }

  runFileAction(action);
  return null;
}

export default function patch() {
  const unpatchTap = MessageHandlers.patchInstead('handleTapInviteEmbed', handleInviteFileAction);
  const unpatchAccept = MessageHandlers.patchInstead('handleTapInviteEmbedAccept', handleInviteFileAction);

  return () => {
    unpatchTap();
    unpatchAccept();
  };
}
