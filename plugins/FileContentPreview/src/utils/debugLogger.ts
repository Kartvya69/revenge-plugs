import type { FileActionData } from './fileActions';

const LOG_PREFIX = '[FileContentPreview]';

export function getLogPrefix() {
  return LOG_PREFIX;
}

function getUrlHost(url: string) {
  try {
    return new URL(url).host;
  } catch {
    return 'invalid-url';
  }
}

export function describeFileActionForLog(action: FileActionData | null | undefined) {
  if (!action) return null;

  return {
    action: action.action,
    filename: action.filename,
    size: action.size,
    hasUrl: Boolean(action.url),
    urlHost: action.url ? getUrlHost(action.url) : null,
  };
}

export function debugLog(event: string, data?: any) {
  try {
    if (data === undefined) {
      console.log(LOG_PREFIX, event);
    } else {
      console.log(LOG_PREFIX, event, data);
    }
  } catch {}
}

export function debugWarn(event: string, data?: any) {
  try {
    if (data === undefined) {
      console.warn(LOG_PREFIX, event);
    } else {
      console.warn(LOG_PREFIX, event, data);
    }
  } catch {}
}

export function debugError(event: string, data?: any) {
  try {
    if (data === undefined) {
      console.error(LOG_PREFIX, event);
    } else {
      console.error(LOG_PREFIX, event, data);
    }
  } catch {}
}
