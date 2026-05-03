/**
 * Patch the in-chat messages (RowManager.generate)
 */
import { findByStoreName, findByName, findByProps } from '@vendetta/metro';
import { after } from '@vendetta/patcher';
import filetypes from '../filetypes';
import { createFileActionData, withFileActionData } from '../utils/fileActions';

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

function makeRPL(attachment) {
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
    acceptLabelText: 'Preview',
    splashUrl: null,
    noParticipantsText: '\n' + filename,
    ctaEnabled: true,
  }, createFileActionData({ filename, url: attachment.url, size }, 'preview'));
}

export default function patch() {
  return after('generate', RowManager.prototype, (_, row) => {
    const { message } = row;
    if (!message) return;
    if (!message.attachments?.length) return;
    let rpls: any[] = [];
    let attachs: any[] = [];
    message.attachments.forEach((attachment) => {
      if (isPreviewableAttachment(attachment)) {
        rpls.push(makeRPL(attachment));
      } else {
        attachs.push(attachment);
      }
    });
    if (rpls.length) {
      if (!message.codedLinks?.length) message.codedLinks = [];
      message.codedLinks.push(...rpls);
      message.attachments = attachs;
    }
  });
}
