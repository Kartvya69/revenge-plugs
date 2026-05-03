export const FILE_CONTENT_ACTION_KEY = '__fileContentPreviewAction';
export const FILE_ACTIONS_PER_ATTACHMENT = 2;

export type FileActionType = 'preview' | 'download';

export interface FileAttachment {
  filename: string;
  url: string;
  size: number;
}

export interface FileActionData extends FileAttachment {
  action: FileActionType;
}

export function createFileActionData(attachment: FileAttachment, action: FileActionType): FileActionData {
  return {
    action,
    filename: attachment.filename,
    url: attachment.url,
    size: attachment.size,
  };
}

export function getFileActionData(value: any): FileActionData | null {
  const data = value?.[FILE_CONTENT_ACTION_KEY];
  if (!data || typeof data !== 'object') return null;
  if (data.action !== 'preview' && data.action !== 'download') return null;
  if (typeof data.filename !== 'string' || typeof data.url !== 'string' || typeof data.size !== 'number') return null;
  return data;
}

export function withFileActionData<T extends object>(value: T, data: FileActionData): T & { [FILE_CONTENT_ACTION_KEY]: FileActionData } {
  return Object.assign(value, { [FILE_CONTENT_ACTION_KEY]: data });
}

export function resolveFileActionFromEvent({
  nativeEvent,
  message,
  isPreviewableAttachment,
}: {
  nativeEvent: { index?: number } | null | undefined;
  message: { codedLinks?: any[]; attachments?: FileAttachment[] } | null | undefined;
  isPreviewableAttachment: (attachment: FileAttachment) => boolean;
}): FileActionData | null {
  const index = nativeEvent?.index;
  if (typeof index !== 'number' || index < 0 || !message) return null;

  const codedLinks = message.codedLinks ?? [];
  const taggedAction = getFileActionData(codedLinks[index]);
  if (taggedAction) return taggedAction;

  if (index < codedLinks.length) return null;

  const textFiles = (message.attachments ?? []).filter(isPreviewableAttachment);
  const actionOffset = index - codedLinks.length;
  const attachmentIndex = Math.floor(actionOffset / FILE_ACTIONS_PER_ATTACHMENT);
  const action = actionOffset % FILE_ACTIONS_PER_ATTACHMENT === 0 ? 'preview' : 'download';
  const attachment = textFiles[attachmentIndex];

  return attachment ? createFileActionData(attachment, action) : null;
}
