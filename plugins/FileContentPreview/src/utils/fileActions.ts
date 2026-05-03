export const FILE_CONTENT_ACTION_KEY = '__fileContentPreviewAction';

export type FileActionType = 'preview';

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
  if (data.action !== 'preview') return null;
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
  const eventAction = getFileActionData(nativeEvent);
  if (eventAction) return eventAction;

  const index = nativeEvent?.index;
  if (typeof index !== 'number' || index < 0 || !message) return null;

  const codedLinks = message.codedLinks ?? [];
  const taggedAction = getFileActionData(codedLinks[index]);
  if (taggedAction) return taggedAction;

  if (index < codedLinks.length) return null;

  const actionOffset = index - codedLinks.length;
  const textFiles = (message.attachments ?? []).filter(isPreviewableAttachment);
  const attachment = textFiles[actionOffset];

  return attachment ? createFileActionData(attachment, 'preview') : null;
}
