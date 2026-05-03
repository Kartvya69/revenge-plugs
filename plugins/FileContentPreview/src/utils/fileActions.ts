export const FILE_CONTENT_ACTION_KEY = '__fileContentPreviewAction';
export const FILE_COMPONENT_CUSTOM_ID_PREFIX = 'file-content-preview';

export type FileActionType = 'preview' | 'download';

export interface FileAttachment {
  filename: string;
  url: string;
  size: number;
}

export interface FileActionData extends FileAttachment {
  action: FileActionType;
}

interface FileComponentButton {
  type: 2;
  id: string;
  state: 0;
  style: number;
  label: string;
  custom_id: string;
  customId: string;
  disabled: boolean;
  [FILE_CONTENT_ACTION_KEY]: FileActionData;
}

interface FileComponentRow {
  type: 1;
  id: string;
  components: FileComponentButton[];
}

const fileActionsById = new Map<string, FileActionData>();

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

export function createFileActionCustomId(action: FileActionType, attachmentIndex: number | string): string {
  return `${FILE_COMPONENT_CUSTOM_ID_PREFIX}:${action}:${attachmentIndex}`;
}

function createFileActionRowId(attachmentIndex: number | string): string {
  return `${FILE_COMPONENT_CUSTOM_ID_PREFIX}:row:${attachmentIndex}`;
}

function createFileButton(attachment: FileAttachment, action: FileActionType, attachmentIndex: number | string): FileComponentButton {
  const customId = createFileActionCustomId(action, attachmentIndex);
  const data = createFileActionData(attachment, action);
  fileActionsById.set(customId, data);

  return withFileActionData({
    type: 2,
    id: customId,
    state: 0,
    style: action === 'preview' ? 1 : 2,
    label: action === 'preview' ? 'Preview' : 'Download',
    custom_id: customId,
    customId,
    disabled: false,
  }, data);
}

export function createFileActionButtons(attachment: FileAttachment, attachmentIndex: number | string): FileComponentRow[] {
  return [
    {
      type: 1,
      id: createFileActionRowId(attachmentIndex),
      components: [
        createFileButton(attachment, 'preview', attachmentIndex),
        createFileButton(attachment, 'download', attachmentIndex),
      ],
    },
  ];
}

function getNativeEventCustomId(nativeEvent: any): string | null {
  if (typeof nativeEvent === 'string') return nativeEvent;

  const customId =
    nativeEvent?.id ??
    nativeEvent?.componentId ??
    nativeEvent?.custom_id ??
    nativeEvent?.customId ??
    nativeEvent?.component?.id ??
    nativeEvent?.component?.componentId ??
    nativeEvent?.component?.custom_id ??
    nativeEvent?.component?.customId ??
    nativeEvent?.component?.custom_id;

  return typeof customId === 'string' ? customId : null;
}

function getFileActionFromComponents(components: any[] | undefined, customId: string | null): FileActionData | null {
  if (!customId) return null;

  for (const row of components ?? []) {
    for (const component of row?.components ?? []) {
      const componentCustomId = component?.id ?? component?.custom_id ?? component?.customId;
      if (componentCustomId === customId) {
        return getFileActionData(component);
      }
    }
  }

  return null;
}

export function isFileActionCustomId(customId: unknown): customId is string {
  return typeof customId === 'string' && customId.startsWith(`${FILE_COMPONENT_CUSTOM_ID_PREFIX}:`);
}

export function resolveFileActionFromEvent({
  nativeEvent,
  message,
  isPreviewableAttachment,
}: {
  nativeEvent: { index?: number } | null | undefined;
  message: { codedLinks?: any[]; attachments?: FileAttachment[]; components?: any[] } | null | undefined;
  isPreviewableAttachment: (attachment: FileAttachment) => boolean;
}): FileActionData | null {
  const customId = getNativeEventCustomId(nativeEvent);
  const eventAction = getFileActionData(nativeEvent) ?? getFileActionData((nativeEvent as any)?.component);
  if (eventAction) return eventAction;

  const registeredAction = customId ? fileActionsById.get(customId) : null;
  if (registeredAction) return registeredAction;

  const componentAction = getFileActionFromComponents(message?.components, customId);
  if (componentAction) return componentAction;

  const index = nativeEvent?.index;
  if (typeof index !== 'number' || index < 0 || !message) return null;

  const codedLinks = message.codedLinks ?? [];
  const taggedAction = getFileActionData(codedLinks[index]);
  if (taggedAction) return taggedAction;

  if (index < codedLinks.length) return null;

  const textFiles = (message.attachments ?? []).filter(isPreviewableAttachment);
  const actionOffset = index - codedLinks.length;
  const attachment = textFiles[actionOffset];

  return attachment ? createFileActionData(attachment, 'preview') : null;
}
