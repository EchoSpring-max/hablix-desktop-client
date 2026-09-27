const path = require('node:path');
const { app, BrowserWindow, Menu, session, shell } = require('electron');
const { ActivityTracker } = require('./activity');
const { isAllowedHablixUrl, isSafeExternalUrl } = require('./navigation');
const { PresenceManager } = require('./presence');

const HABLIX_URL = 'https://hablix.org/client';
let mainWindow;
let activityTracker;
const presence = new PresenceManager();

function secureWebPreferences(extra = {}) {
  return {
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: true,
    ...extra
  };
}

function openExternal(url) {
  if (isSafeExternalUrl(url)) void shell.openExternal(url);
}

function applyNavigationPolicy(window) {
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (isAllowedHablixUrl(url)) {
      void window.loadURL(url);
    } else {
      openExternal(url);
    }
    return { action: 'deny' };
  });

  window.webContents.on('will-navigate', (event, url) => {
    if (isAllowedHablixUrl(url)) return;
    event.preventDefault();
    openExternal(url);
  });
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    title: 'Hablix Desktop',
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#101522',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    show: false,
    webPreferences: secureWebPreferences({ partition: 'persist:hablix' })
  });

  applyNavigationPolicy(mainWindow);
  activityTracker = new ActivityTracker(mainWindow, presence);
  activityTracker.start();
  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.webContents.on('render-process-gone', () => {
    if (mainWindow && !mainWindow.isDestroyed()) void mainWindow.loadURL(HABLIX_URL);
  });
  mainWindow.on('closed', () => {
    activityTracker?.stop();
    activityTracker = null;
    mainWindow = null;
  });
  void mainWindow.loadURL(HABLIX_URL);
}

function buildMenu() {
  return Menu.buildFromTemplate([
    {
      label: 'Hablix',
      submenu: [
        { label: 'Reload Hotel', accelerator: 'CmdOrCtrl+R', click: () => mainWindow?.reload() },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    }
  ]);
}

app.whenReady().then(() => {
  session.fromPartition('persist:hablix').setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false);
  });

  Menu.setApplicationMenu(buildMenu());
  createMainWindow();
  void presence.start();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  void presence.stop();
});
