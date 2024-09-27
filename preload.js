const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    selectVideo: () => ipcRenderer.invoke('select-video'),
    mergeVideos: (dynamicVideoPath) => ipcRenderer.send('merge-videos', dynamicVideoPath),
    onMergeComplete: (callback) => ipcRenderer.on('merge-complete', callback),
    onMergeError: (callback) => ipcRenderer.on('merge-error', callback)
});
