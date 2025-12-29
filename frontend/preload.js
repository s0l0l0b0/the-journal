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

  // Check Backend Status (CRITICAL FOR FIXING RACE CONDITION)
  isBackendReady: () => ipcRenderer.invoke('is-backend-ready'),
  onBackendReady: (callback) => ipcRenderer.on('backend-ready', callback),

  // MCP Server
  startMcpServer: () => ipcRenderer.invoke('start-mcp-server'),
  stopMcpServer: () => ipcRenderer.invoke('stop-mcp-server'),
  isMcpServerRunning: () => ipcRenderer.invoke('is-mcp-server-running'),
  getMcpServerStatus: () => ipcRenderer.invoke('get-mcp-server-status'),
  onMcpServerStarted: (callback) => ipcRenderer.on('mcp-server-started', callback)
});