const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('emochordAPI', {
  isElectron: true,
  platform: process.platform,
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSettings: (patch) => ipcRenderer.invoke('settings:set', patch),
  toggleFullscreen: () => ipcRenderer.invoke('window:toggleFullscreen'),
  openMidiOrRecordingFile: () => ipcRenderer.invoke('midi:openFile'),
  openVitalPresetFile: () => ipcRenderer.invoke('vital:openFile'),
  getStartupFile: () => ipcRenderer.invoke('midi:getStartupFile'),
  onExternalMidiOpen: (cb) => {
    if (typeof cb !== 'function') return () => {};
    const listener = (_e, payload) => cb(payload);
    ipcRenderer.on('midi:externalOpen', listener);
    return () => {
      ipcRenderer.removeListener('midi:externalOpen', listener);
    };
  },
  saveRecording: (payload) => ipcRenderer.invoke('recording:save', payload)
});
