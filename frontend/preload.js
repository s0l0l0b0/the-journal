// frontend/preload.js

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Queries
  getNotes: () => ipcRenderer.invoke('get-notes'),
  getDeletedNotes: () => ipcRenderer.invoke('get-deleted-notes'),

  // Commands
  createNote: (noteData) => ipcRenderer.invoke('create-note', noteData),
  updateNote: (noteId, noteData) => ipcRenderer.invoke('update-note', noteId, noteData),
  softDeleteNote: (noteId) => ipcRenderer.invoke('soft-delete-note', noteId),
  restoreNote: (noteId) => ipcRenderer.invoke('restore-note', noteId),
  permanentlyDeleteNote: (noteId) => ipcRenderer.invoke('permanently-delete-note', noteId),
  // NEW: Expose an event listener for the backend-ready signal.
  onBackendReady: (callback) => ipcRenderer.on('backend-ready', callback)
});