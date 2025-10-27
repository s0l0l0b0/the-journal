// frontend/main.js

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const axios = require('axios');

const isDev = process.env.NODE_ENV !== 'production';
const backendPort = 8000;
const backendUrl = `http://127.0.0.1:${backendPort}`;

let pythonProcess = null;

// Function to start the Python backend
const startPythonBackend = () => {
  // In development, we run the uvicorn command directly.
  // In production, we'll need to run a packaged executable.
  const command = 'uv';
  const args = ['run', 'uvicorn', 'app.server.main:app', '--port', `${backendPort}`];

  pythonProcess = spawn(command, args, {
    // The CWD must be the backend directory where pyproject.toml is
    cwd: path.join(__dirname, '..', 'backend'),
    // Hide the backend console window on Windows in production
    windowsHide: !isDev,
  });

  pythonProcess.stdout.on('data', (data) => {
    console.log(`[Backend STDOUT]: ${data}`);
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`[Backend STDERR]: ${data}`);
  });

  pythonProcess.on('close', (code) => {
    console.log(`[Backend Process] exited with code ${code}`);
  });
};

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      // This preload script is the bridge between the renderer and main process
      preload: path.join(__dirname, 'preload.js'),
      // Security best practices:
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open DevTools automatically in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
};

app.whenReady().then(() => {
  console.log('App is ready, starting backend...');
  startPythonBackend();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Ensure the backend process is killed when the app quits
app.on('will-quit', () => {
  if (pythonProcess) {
    console.log('App is quitting, terminating backend process...');
    pythonProcess.kill();
    pythonProcess = null;
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// --- IPC Handlers: Main process listens for events from the Renderer ---

ipcMain.handle('get-notes', async () => {
  try {
    const response = await axios.get(`${backendUrl}/notes`);
    return response.data;
  } catch (error) {
    console.error('Failed to get notes:', error.message);
    return null; // Or handle the error as you see fit
  }
});

ipcMain.handle('get-deleted-notes', async () => {
    try {
        const response = await axios.get(`${backendUrl}/notes/deleted`);
        return response.data;
    } catch (error) {
        console.error('Failed to get deleted notes:', error.message);
        return null;
    }
});

ipcMain.handle('create-note', async (event, noteData) => {
    try {
        const response = await axios.post(`${backendUrl}/notes`, noteData);
        return response.data;
    } catch (error) {
        console.error('Failed to create note:', error.message);
        return null;
    }
});

ipcMain.handle('update-note', async (event, noteId, noteData) => {
    try {
        const response = await axios.put(`${backendUrl}/notes/${noteId}`, noteData);
        return response.data;
    } catch (error) {
        console.error(`Failed to update note ${noteId}:`, error.message);
        return null;
    }
});

ipcMain.handle('soft-delete-note', async (event, noteId) => {
    try {
        await axios.delete(`${backendUrl}/notes/${noteId}`);
        return true;
    } catch (error) {
        console.error(`Failed to delete note ${noteId}:`, error.message);
        return false;
    }
});

ipcMain.handle('restore-note', async (event, noteId) => {
    try {
        await axios.put(`${backendUrl}/notes/${noteId}/restore`);
        return true;
    } catch (error) {
        console.error(`Failed to restore note ${noteId}:`, error.message);
        return false;
    }
});

ipcMain.handle('permanently-delete-note', async (event, noteId) => {
    try {
        await axios.delete(`${backendUrl}/notes/${noteId}/permanent`);
        return true;
    } catch (error) {
        console.error(`Failed to permanently delete note ${noteId}:`, error.message);
        return false;
    }
});