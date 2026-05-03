import { getAssetIDByName } from '@vendetta/ui/assets';
import { showToast } from '@vendetta/ui/toasts';
import { debugError, debugLog } from './debugLogger';

const shownToastKeys = new Set<string>();

function getInfoIcon() {
  return getAssetIDByName('ic_information_filled_24px');
}

export function showDiagnosticToast(message: string) {
  debugLog('diagnostic.toast', { message });

  try {
    showToast(message, getInfoIcon());
  } catch (error) {
    debugError('diagnostic.toast.error', { message: (error as any)?.message ?? String(error) });
  }
}

export function showDiagnosticToastOnce(key: string, message: string) {
  if (shownToastKeys.has(key)) return;
  shownToastKeys.add(key);
  showDiagnosticToast(message);
}
