// frontend/preload.js

const { contextBridge, ipcRenderer } = require('electron');

// Expose a safe, limited API to the renderer process
contextBridge.exposeInMainWorld('api', {
  // Each function here sends a message to the main process and waits for a response
  getNotes: () => ipcRenderer.invoke('get-notes'),
  // We will add more functions here:
  // createNote: (noteData) => ipcRenderer.invoke('create-note', noteData),
  // updateNote: (noteId, noteData) => ipcRenderer.invoke('update-note', noteId, noteData),
  // deleteNote: (noteId) => ipcRenderer.invoke('delete-note', noteId),
});