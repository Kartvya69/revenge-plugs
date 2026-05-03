import { findByStoreName, findByProps } from '@vendetta/metro';
import filetypes from '../filetypes';
import MessageHandlers from '../utils/MessageHandlersPatcher';
import { FCModal } from '../ui/FCModal';
import { downloadFile } from '../utils/downloadFile';
import { resolveFileActionFromEvent } from '../utils/fileActions';
import getMessages from '../translations';

const SelectedChannelStore = findByStoreName('SelectedChannelStore');
const MessageStore = findByStoreName('MessageStore');
const modals = findByProps('pushModal');
const intl = findByProps('intl').intl;

function isPreviewableAttachment(attachment) {
  return filetypes.has(attachment.filename?.toLowerCase().split('.').pop());
}

function getMessage(nativeEvent) {
  if (!nativeEvent?.messageId) return null;

  const { messageId } = nativeEvent;
  let channel = SelectedChannelStore.getChannelId();
  let message = MessageStore.getMessage(channel, messageId);

  if (!message) return null;

  /** Starter thread messages */
  if (message.messageReference && message.messageReference.type == 0 && message.messageReference.channel_id != channel) {
    message = MessageStore.getMessage(message.messageReference.channel_id, message.messageReference.message_id);
  }
  /** Forwards */
  if (message?.messageSnapshots?.[0]?.message) {
    message = message.messageSnapshots[0].message;
  }

  return message;
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

function handleFileAction(args) {
  const nativeEvent = args?.[0]?.nativeEvent;
  const message = getMessage(nativeEvent);
  const action = resolveFileActionFromEvent({ nativeEvent, message, isPreviewableAttachment });

  if (!action) return;

  if (action.action === 'download') {
    const translations = getMessages(intl.currentLocale);
    downloadFile(action.url, {
      saveText: translations.FILE_SAVED,
      failText: translations.FILE_SAVE_ERROR,
    });
    return;
  }

  openPreview(action);
}

export default function patch() {
  const unpatchTap = MessageHandlers.patch('handleTapInviteEmbed', handleFileAction);
  const unpatchAccept = MessageHandlers.patch('handleTapInviteEmbedAccept', handleFileAction);

  return () => {
    unpatchTap();
    unpatchAccept();
  };
}
