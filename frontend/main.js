// frontend/main.js

const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const axios = require('axios');

const isDev = process.env.NODE_ENV !== 'production';
const backendPort = 8000;
const backendUrl = `http://127.0.0.1:${backendPort}`;

// MCP Server configuration
const mcpServerPort = 8001;
const mcpServerUrl = `http://127.0.0.1:${mcpServerPort}`;

let pythonProcess = null;
let mainWindow = null;
// NEW: Track backend state
let isBackendReady = false;

// MCP Server state
let mcpServerProcess = null;
let isMcpServerRunning = false;

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

const updateMcpServerMenu = () => {
  const template = [
    {
      label: 'MCP Server',
      submenu: [
        {
          label: 'Start MCP Server',
          enabled: !isMcpServerRunning,
          click: () => {
            startMcpServer();
          }
        },
        {
          label: 'Stop MCP Server',
          enabled: isMcpServerRunning,
          click: () => {
            stopMcpServer();
          }
        },
        { type: 'separator' },
        {
          label: `Status: ${isMcpServerRunning ? 'Running' : 'Stopped'}`,
          enabled: false
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
};

const createWindow = () => {
  mainWindow = new BrowserWindow({
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

  // Load the built React app from dist folder
  mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));

  // Open DevTools automatically in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
};

// This function will ping the backend until it's ready.
const checkBackendReady = () => {
  console.log('Pinging backend...');
  axios.get(backendUrl)
    .then(() => {
      console.log('Backend is ready. Notifying renderer.');
      // UPDATED: Mark backend as ready so new handlers can check this status
      isBackendReady = true;
      if (mainWindow) {
        mainWindow.webContents.send('backend-ready');
      }
    })
    .catch(() => {
      console.log('Backend not ready, trying again in 250ms.');
      setTimeout(checkBackendReady, 250);
    });
};

// MCP Server Functions
const startMcpServer = () => {
  if (mcpServerProcess) {
    console.log('MCP Server is already running');
    return;
  }

  console.log('Starting MCP Server...');
  // Reset check attempts counter
  mcpServerCheckAttempts = 0;

  // Try 'uv' first, fallback to 'python'
  const command = 'uv';
  const args = ['run', 'server.py'];
  const mcpServerPath = path.join(__dirname, '..', 'backend', 'app', 'git_work_tracker');

  console.log(`MCP Server command: ${command} ${args.join(' ')}`);
  console.log(`MCP Server working directory: ${mcpServerPath}`);

  mcpServerProcess = spawn(command, args, {
    cwd: mcpServerPath,
    windowsHide: !isDev,
  });

  mcpServerProcess.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(`[MCP Server STDOUT]: ${output}`);
    // Check for common success indicators
    if (output.includes('Uvicorn running') || output.includes('Application startup complete') || output.includes('started server process')) {
      console.log('MCP Server appears to be starting up...');
    }
  });

  mcpServerProcess.stderr.on('data', (data) => {
    const error = data.toString();
    console.error(`[MCP Server STDERR]: ${error}`);
    // Don't treat all stderr as fatal - some servers log to stderr
  });

  mcpServerProcess.on('error', (error) => {
    console.error(`[MCP Server Error]: ${error.message}`);
    // If 'uv' command fails, try with 'python' as fallback
    if (error.code === 'ENOENT') {
      console.log('uv command not found, trying python...');
      mcpServerProcess = null;

      // Try with python
      const pythonCommand = 'python';
      const pythonArgs = ['server.py'];
      mcpServerProcess = spawn(pythonCommand, pythonArgs, {
        cwd: mcpServerPath,
        windowsHide: !isDev,
      });

      mcpServerProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log(`[MCP Server STDOUT]: ${output}`);
        // Check for common success indicators
        if (output.includes('Uvicorn running') || output.includes('Application startup complete') || output.includes('started server process')) {
          console.log('MCP Server appears to be starting up...');
        }
      });

      mcpServerProcess.stderr.on('data', (data) => {
        const error = data.toString();
        console.error(`[MCP Server STDERR]: ${error}`);
      });

      mcpServerProcess.on('close', (code) => {
        console.log(`[MCP Server Process] exited with code ${code}`);
        mcpServerProcess = null;
        isMcpServerRunning = false;
        updateMcpServerMenu();
      });

      mcpServerProcess.on('error', (err) => {
        console.error(`[MCP Server Error]: Failed to start with python: ${err.message}`);
        mcpServerProcess = null;
        isMcpServerRunning = false;
        updateMcpServerMenu();
      });

      // Wait a bit before starting to check (server needs time to start)
      setTimeout(() => {
        checkMcpServerReady();
      }, 1000);
      return;
    }
  });

  mcpServerProcess.on('close', (code) => {
    console.log(`[MCP Server Process] exited with code ${code}`);
    mcpServerProcess = null;
    isMcpServerRunning = false;
    updateMcpServerMenu();
  });

  // Wait a bit before starting to check (server needs time to start)
  setTimeout(() => {
    checkMcpServerReady();
  }, 1000);
};

const stopMcpServer = () => {
  if (mcpServerProcess) {
    console.log('Stopping MCP Server...');
    mcpServerProcess.kill();
    mcpServerProcess = null;
    isMcpServerRunning = false;
    updateMcpServerMenu();
  }
};

let mcpServerCheckAttempts = 0;
const MAX_MCP_SERVER_CHECK_ATTEMPTS = 60; // 30 seconds max (60 * 500ms)

const checkMcpServerReady = () => {
  // Stop checking if we've exceeded max attempts
  if (mcpServerCheckAttempts >= MAX_MCP_SERVER_CHECK_ATTEMPTS) {
    console.error('MCP Server failed to start after 30 seconds. Check the server logs for errors.');
    mcpServerCheckAttempts = 0;
    if (mcpServerProcess) {
      console.log('Stopping failed MCP server process...');
      mcpServerProcess.kill();
      mcpServerProcess = null;
    }
    isMcpServerRunning = false;
    updateMcpServerMenu();
    return;
  }

  mcpServerCheckAttempts++;
  console.log(`Checking MCP Server... (attempt ${mcpServerCheckAttempts}/${MAX_MCP_SERVER_CHECK_ATTEMPTS})`);

  // FastMCP SSE transport uses /sse for SSE endpoint (GET request)
  // Only check /sse endpoint to avoid POST endpoint warnings
  const endpoints = [
    `${mcpServerUrl}/sse`,  // SSE endpoint (default for FastMCP) - GET request
    `${mcpServerUrl}/`,     // Root path as fallback
  ];

  // Check if process is still running
  if (!mcpServerProcess || mcpServerProcess.killed) {
    console.error('MCP Server process is not running.');
    mcpServerCheckAttempts = 0;
    isMcpServerRunning = false;
    updateMcpServerMenu();
    return;
  }

  // Try endpoints in order
  const tryEndpoint = (index) => {
    if (index >= endpoints.length) {
      // All endpoints failed, try again with first endpoint
      if (mcpServerCheckAttempts === 1 || mcpServerCheckAttempts % 10 === 0) {
        console.log(`MCP Server not ready, trying again... (attempt ${mcpServerCheckAttempts})`);
      }
      setTimeout(checkMcpServerReady, 500);
      return;
    }

    axios.get(endpoints[index], {
      timeout: 2000,
      headers: {
        'Accept': 'text/event-stream, application/json',
        'Content-Type': 'application/json'
      }
    })
      .then((response) => {
        console.log(`MCP Server is ready! Endpoint: ${endpoints[index]}, Status: ${response.status}`);
        mcpServerCheckAttempts = 0;
        isMcpServerRunning = true;
        updateMcpServerMenu();
        if (mainWindow) {
          mainWindow.webContents.send('mcp-server-started');
        }
      })
      .catch((error) => {
        // Try next endpoint
        if (index < endpoints.length - 1) {
          tryEndpoint(index + 1);
        } else {
          // All endpoints failed
          if (mcpServerCheckAttempts === 1 || mcpServerCheckAttempts % 10 === 0) {
            const errorMsg = error.code || error.message || 'Unknown error';
            const errorDetails = error.response ? ` (HTTP ${error.response.status})` : '';
            console.log(`MCP Server not ready: ${errorMsg}${errorDetails}, trying again...`);
          }

          // If process died, stop checking
          if (mcpServerProcess && mcpServerProcess.killed) {
            console.error('MCP Server process has been killed.');
            mcpServerCheckAttempts = 0;
            mcpServerProcess = null;
            isMcpServerRunning = false;
            updateMcpServerMenu();
            return;
          }

          setTimeout(checkMcpServerReady, 500);
        }
      });
  };

  tryEndpoint(0);
};

app.whenReady().then(() => {
  console.log('App is ready, starting backend...');
  startPythonBackend();
  createWindow();

  checkBackendReady();

  // Create initial menu
  updateMcpServerMenu();

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
  if (mcpServerProcess) {
    console.log('App is quitting, terminating MCP server process...');
    mcpServerProcess.kill();
    mcpServerProcess = null;
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// --- IPC Handlers: Main process listens for events from the Renderer ---

// NEW: This is the handler that was missing and causing your error
ipcMain.handle('is-backend-ready', () => {
  return isBackendReady;
});

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

// MCP Server IPC Handlers
ipcMain.handle('start-mcp-server', () => {
  try {
    startMcpServer();
    return { success: true };
  } catch (error) {
    console.error('Failed to start MCP server:', error.message);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('stop-mcp-server', () => {
  try {
    stopMcpServer();
    return { success: true };
  } catch (error) {
    console.error('Failed to stop MCP server:', error.message);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('is-mcp-server-running', () => {
  return isMcpServerRunning;
});

ipcMain.handle('get-mcp-server-status', () => {
  return {
    running: isMcpServerRunning,
    url: mcpServerUrl,
    port: mcpServerPort
  };
});