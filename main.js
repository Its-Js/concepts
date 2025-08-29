// main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Initialize the database
const db = new sqlite3.Database(path.join(__dirname, 'concepts.db'));

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS nodes (
      id TEXT PRIMARY KEY,
      position_x REAL NOT NULL,
      position_y REAL NOT NULL,
      label TEXT NOT NULL,
      description TEXT
    )
  `);
});

function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 680,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  win.loadURL('http://localhost:5173'); // We'll use Vite dev server here
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers
ipcMain.handle('get-nodes', async () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM nodes', (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows.map(row => ({
          id: row.id,
          position: { x: row.position_x, y: row.position_y },
          data: { label: row.label, description: row.description },
        })));
      }
    });
  });
});

ipcMain.handle('add-node', async (event, node) => {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO nodes (id, position_x, position_y, label, description) VALUES (?, ?, ?, ?, ?)',
      [node.id, node.position.x, node.position.y, node.data.label, node.data.description],
      (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      }
    );
  });
});

ipcMain.handle('update-node-description', async (event, id, description) => {
  return new Promise((resolve, reject) => {
    db.run('UPDATE nodes SET description = ? WHERE id = ?', [description, id], (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
});

ipcMain.handle('delete-node', async (event, id) => {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM nodes WHERE id = ?', [id], (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
});

ipcMain.handle('rename-node', async (event, id, name) => {
  return new Promise((resolve, reject) => {
    db.run('UPDATE nodes SET label = ? WHERE id = ?', [name, id], (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
});
