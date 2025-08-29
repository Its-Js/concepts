// main.js
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 680,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'), // optional, for communication
    },
  });

  win.loadURL('http://localhost:5173'); // We'll use Vite dev server here
}

app.whenReady().then(createWindow);
