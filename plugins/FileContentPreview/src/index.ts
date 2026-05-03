import patch0 from './patches/MessageHandlers';
import patch1 from './patches/RowManager';
import { debugLog } from './utils/debugLogger';

let patches: any[] = [];

export default {
  onLoad: () => {
    debugLog('plugin.load');
    patches.push(patch0());
    patches.push(patch1());
  },
  onUnload: () => {
    debugLog('plugin.unload', { patches: patches.length });
    for (let unpatch of patches) unpatch();
  },
};
