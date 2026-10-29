const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('emochordAPI', {
  isElectron: true,
  platform: process.platform,
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSettings: (patch) => ipcRenderer.invoke('settings:set', patch),
  toggleFullscreen: () => ipcRenderer.invoke('window:toggleFullscreen'),
  openMidiOrRecordingFile: () => ipcRenderer.invoke('midi:openFile'),
  getStartupFile: () => ipcRenderer.invoke('midi:getStartupFile'),
  onExternalMidiOpen: (cb) => {
    if (typeof cb !== 'function') return;
    ipcRenderer.on('midi:externalOpen', (_e, payload) => cb(payload));
  },
  saveRecording: (payload) => ipcRenderer.invoke('recording:save', payload)
});
