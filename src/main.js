const path = require('node:path');
const { app, BrowserWindow, ipcMain, Menu, session, shell } = require('electron');
const { ConfigStore } = require('./config');
const { isAllowedHablixUrl, isSafeExternalUrl } = require('./navigation');
const { PresenceManager } = require('./presence');

const HABLIX_URL = 'https://hablix.org/client';
let mainWindow;
let settingsWindow;
let configStore;
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
  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.webContents.on('render-process-gone', () => {
    if (!mainWindow.isDestroyed()) void mainWindow.loadURL(HABLIX_URL);
  });
  void mainWindow.loadURL(HABLIX_URL);
}

function openSettings() {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    title: 'Discord Rich Presence',
    parent: mainWindow,
    modal: true,
    width: 580,
    height: 720,
    minWidth: 520,
    minHeight: 640,
    resizable: true,
    backgroundColor: '#111827',
    webPreferences: secureWebPreferences({
      preload: path.join(__dirname, 'preload.js')
    })
  });
  settingsWindow.removeMenu();
  settingsWindow.on('closed', () => { settingsWindow = null; });
  void settingsWindow.loadFile(path.join(__dirname, 'settings.html'));
}

function buildMenu() {
  return Menu.buildFromTemplate([
    {
      label: 'Settings',
      submenu: [
        { label: 'Discord Rich Presence', accelerator: 'CmdOrCtrl+,', click: openSettings },
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

app.whenReady().then(async () => {
  configStore = new ConfigStore(app.getPath('userData'));

  session.fromPartition('persist:hablix').setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false);
  });

  ipcMain.handle('settings:get', () => configStore.load());
  ipcMain.handle('settings:save', async (_event, input) => {
    const config = configStore.save(input);
    await presence.configure(config);
    return config;
  });
  ipcMain.on('settings:close', () => settingsWindow?.close());

  Menu.setApplicationMenu(buildMenu());
  createMainWindow();
  const config = configStore.load();
  await presence.configure(config);
  if (!config.clientId) openSettings();

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
