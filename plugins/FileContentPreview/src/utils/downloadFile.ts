import { ReactNative, clipboard } from '@vendetta/metro/common';
import { getAssetIDByName } from '@vendetta/ui/assets';
import { showToast } from '@vendetta/ui/toasts';

interface DownloadMessages {
  saveText: string;
  failText: string;
  copyText?: string;
}

function getDownloadMediaAsset() {
  return ReactNative.NativeModules.MediaManager?.downloadMediaAsset;
}

export function copyFileUrl(url: string, copyText: string) {
  clipboard.setString(url);
  showToast(copyText, getAssetIDByName('toast_copy_link'));
}

export function downloadFile(url: string, { saveText, failText }: DownloadMessages) {
  const downloadMediaAsset = getDownloadMediaAsset();

  if (typeof downloadMediaAsset !== 'function') {
    showToast(failText, getAssetIDByName('ic_close_circle'));
    return Promise.resolve(false);
  }

  return Promise.resolve(downloadMediaAsset(url, 0))
    .then((saved) => {
      if (saved) {
        showToast(saveText, getAssetIDByName('ic_selection_checked_24px'));
      } else {
        showToast(failText, getAssetIDByName('ic_close_circle'));
      }
      return Boolean(saved);
    })
    .catch(() => {
      showToast(failText, getAssetIDByName('ic_close_circle'));
      return false;
    });
}
