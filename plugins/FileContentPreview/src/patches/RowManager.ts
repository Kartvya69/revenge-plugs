/**
 * Patch the in-chat messages (RowManager.generate)
 */
import { findByStoreName, findByName, findByProps } from '@vendetta/metro';
import { after } from '@vendetta/patcher';
import filetypes from '../filetypes';
import { GENERATED_FILE_ACTIONS, createFileActionData, withFileActionData } from '../utils/fileActions';
import { debugLog } from '../utils/debugLogger';
import { showDiagnosticToastOnce } from '../utils/runtimeDiagnostics';

const ThemeStore = findByStoreName('ThemeStore');

const RowManager = findByName('RowManager');
const getEmbedThemeColors = findByName('getEmbedThemeColors');
const CodedLinkExtendedType = findByProps("CodedLinkExtendedType")?.CodedLinkExtendedType ?? { EMBEDDED_ACTIVITY_INVITE: 3 };

function getCodedLinkColors() {
  let colors = getEmbedThemeColors?.(ThemeStore.theme)?.colors || {
    acceptLabelGreenBackgroundColor: -14385083,
    headerColor: -6973533,
    borderColor: 268435455,
    backgroundColor: -14276817,
  };
  return {
    acceptLabelBackgroundColor: colors.acceptLabelGreenBackgroundColor,
    headerColor: colors.headerColor,
    borderColor: colors.borderColor,
    backgroundColor: colors.backgroundColor,
  };
}

function isPreviewableAttachment(attachment) {
  return filetypes.has(attachment.filename?.toLowerCase().split('.').pop());
}

function getActionLabel(action) {
  return action === 'download' ? 'Download' : 'Preview';
}

function makeRPL(attachment, action) {
  const filename = attachment.filename ?? 'unknown';
  const size = attachment.size ?? 0;

  return withFileActionData({
    ...getCodedLinkColors(),
    thumbnailCornerRadius: 15,
    headerText: '',
    titleText: 'File' + ' — ' + size,
    structurableSubtitleText: null,
    type: null,
    extendedType: CodedLinkExtendedType.EMBEDDED_ACTIVITY_INVITE,
    participantAvatarUris: [],
    acceptLabelText: getActionLabel(action),
    splashUrl: null,
    noParticipantsText: '\n' + filename,
    ctaEnabled: true,
  }, createFileActionData({ filename, url: attachment.url, size }, action));
}

export default function patch() {
  return after('generate', RowManager.prototype, (_, row) => {
    const { message } = row;
    if (!message) return;
    if (!message.attachments?.length) return;
    let rpls: any[] = [];
    let attachs: any[] = [];
    const messageId = message.id ?? message.messageId ?? 'unknown';
    debugLog('row.generate.start', {
      messageId,
      attachments: message.attachments.length,
      codedLinks: message.codedLinks?.length ?? 0,
    });
    message.attachments.forEach((attachment) => {
      if (isPreviewableAttachment(attachment)) {
        rpls.push(...GENERATED_FILE_ACTIONS.map((action) => makeRPL(attachment, action)));
      } else {
        attachs.push(attachment);
      }
    });
    if (rpls.length) {
      if (!message.codedLinks?.length) message.codedLinks = [];
      message.codedLinks.push(...rpls);
      message.attachments = attachs;
      showDiagnosticToastOnce('row.generate.injected', 'FCP file actions injected');
      debugLog('row.generate.injected', {
        messageId,
        actionRows: rpls.length,
        remainingAttachments: attachs.length,
        actions: GENERATED_FILE_ACTIONS,
      });
    }
  });
}
