// Import necessary modules from Electron
const { app, BrowserWindow } = require('electron');
const path = require('path');

// Function to create the main browser window
const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      // preload script can be added here later for secure communication
      // between main and renderer processes.
    }
  });

  // Load the index.html file into the window
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open DevTools for debugging, can be removed for production
  // mainWindow.webContents.openDevTools();
};

// This method is called when Electron has finished initialization
// and is ready to create browser windows.
app.whenReady().then(() => {
  createWindow();

  // Handle macOS 'activate' event - re-create a window when the
  // dock icon is clicked and no other windows are open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit the app when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});