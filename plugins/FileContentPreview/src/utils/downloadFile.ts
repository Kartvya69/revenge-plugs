import { ReactNative, clipboard } from '@vendetta/metro/common';
import { getAssetIDByName } from '@vendetta/ui/assets';
import { showToast } from '@vendetta/ui/toasts';
import { debugError, debugLog } from './debugLogger';

interface DownloadMessages {
  saveText: string;
  failText: string;
  copyText?: string;
}

function getDownloadMediaAsset() {
  return ReactNative.NativeModules.MediaManager?.downloadMediaAsset;
}

export function copyFileUrl(url: string, copyText: string) {
  debugLog('file.copyUrl', { hasUrl: Boolean(url) });
  clipboard.setString(url);
  showToast(copyText, getAssetIDByName('toast_copy_link'));
}

export function downloadFile(url: string, { saveText, failText }: DownloadMessages) {
  const downloadMediaAsset = getDownloadMediaAsset();
  debugLog('file.download.start', { hasUrl: Boolean(url) });

  if (typeof downloadMediaAsset !== 'function') {
    debugError('file.download.unavailable');
    showToast(failText, getAssetIDByName('ic_close_circle'));
    return Promise.resolve(false);
  }

  return Promise.resolve(downloadMediaAsset(url, 0))
    .then((saved) => {
      debugLog('file.download.result', { saved: Boolean(saved) });
      if (saved) {
        showToast(saveText, getAssetIDByName('ic_selection_checked_24px'));
      } else {
        showToast(failText, getAssetIDByName('ic_close_circle'));
      }
      return Boolean(saved);
    })
    .catch((error) => {
      debugError('file.download.error', { message: error?.message ?? String(error) });
      showToast(failText, getAssetIDByName('ic_close_circle'));
      return false;
    });
}
