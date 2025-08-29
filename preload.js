const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getNodes: () => ipcRenderer.invoke('get-nodes'),
  addNode: (node) => ipcRenderer.invoke('add-node', node),
  updateNodeDescription: (id, description) => ipcRenderer.invoke('update-node-description', id, description),
  renameNode: (id, name) => ipcRenderer.invoke('rename-node', id, name),
  deleteNode: (id) => ipcRenderer.invoke('delete-node', id),
});
