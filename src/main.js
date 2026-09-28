const path = require('node:path');
const { app, BrowserWindow, dialog, Menu, session, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const { ActivityTracker } = require('./activity');
const { isAllowedHablixUrl, isSafeExternalUrl } = require('./navigation');
const { PresenceManager } = require('./presence');
const { createStaffActionScript } = require('./staff-actions');
const { createUserActionScript } = require('./user-actions');
const { UpdateManager } = require('./updater');

const HABLIX_URL = 'https://hablix.org/client';
const MIN_SPLASH_TIME_MS = 1_600;
const MAX_SPLASH_TIME_MS = 15_000;

if (process.platform === 'darwin') app.setName('Hablix');

let mainWindow;
let splashWindow;
let splashStartedAt = 0;
let splashFallbackTimer;
let revealScheduled = false;
let activityTracker;
let updateManager;
let hasStaffAccess = null;
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

function createSplashWindow() {
  splashStartedAt = Date.now();
  revealScheduled = false;
  splashWindow = new BrowserWindow({
    width: 540,
    height: 350,
    frame: false,
    transparent: true,
    resizable: false,
    movable: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    center: true,
    show: false,
    hasShadow: true,
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: secureWebPreferences()
  });

  splashWindow.once('ready-to-show', () => splashWindow?.show());
  splashWindow.on('closed', () => { splashWindow = null; });
  void splashWindow.loadFile(path.join(__dirname, 'splash.html'));

  clearTimeout(splashFallbackTimer);
  splashFallbackTimer = setTimeout(revealMainWindow, MAX_SPLASH_TIME_MS);
}

function revealMainWindow() {
  if (revealScheduled) return;
  revealScheduled = true;
  const remaining = Math.max(0, MIN_SPLASH_TIME_MS - (Date.now() - splashStartedAt));

  setTimeout(() => {
    clearTimeout(splashFallbackTimer);
    splashFallbackTimer = null;
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show();
      mainWindow.focus();
    }
    if (splashWindow && !splashWindow.isDestroyed()) splashWindow.close();
  }, remaining);
}

async function runStaffAction(action) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const result = await executeInClientFrames(createStaffActionScript(action));
  if (result?.ok) return;

  const details = {
    'not-authorized': 'This menu is available only when Hablix grants moderator or administrator access.',
    'enter-room': 'Enter a room before opening this staff tool.',
    'select-user': 'Select a user in the room before opening the user tool.',
    unavailable: 'Hablix did not expose this staff tool in the current view.'
  };
  void dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Staff tool unavailable',
    message: 'Staff tool unavailable',
    detail: details[result?.reason] || details.unavailable
  });
}

async function runUserAction(action) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const result = await executeInClientFrames(createUserActionScript(action));
  if (result?.ok) return;

  const details = {
    'enter-room': 'Enter a room before using this shortcut.',
    unavailable: 'Hablix did not expose this control in the current view.'
  };
  void dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Quick action unavailable',
    message: 'Quick action unavailable',
    detail: details[result?.reason] || details.unavailable
  });
}

async function executeInClientFrames(script) {
  const fallback = { ok: false, reason: 'unavailable' };
  if (!mainWindow || mainWindow.isDestroyed()) return fallback;

  const failures = [];
  const frames = mainWindow.webContents.mainFrame.framesInSubtree
    .filter(frame => !frame.detached);

  for (const frame of frames) {
    try {
      const result = await frame.executeJavaScript(script, true);
      if (result?.ok) return result;
      if (result) failures.push(result);
    } catch {}
  }

  const reasonPriority = ['select-user', 'enter-room', 'not-authorized', 'unavailable'];
  return reasonPriority
    .map(reason => failures.find(result => result.reason === reason))
    .find(Boolean) || failures[0] || fallback;
}

function setStaffAccess(value) {
  if (hasStaffAccess === value) return;
  hasStaffAccess = value;
  console.info(`Staff quick access ${value ? 'enabled' : 'disabled'}.`);
  Menu.setApplicationMenu(buildMenu());
}

function createMainWindow() {
  createSplashWindow();
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
  activityTracker = new ActivityTracker(mainWindow, presence, setStaffAccess);
  activityTracker.start();
  mainWindow.webContents.on('did-frame-finish-load', (_event, isMainFrame) => {
    if (isMainFrame) revealMainWindow();
  });
  mainWindow.webContents.on('did-fail-load', (_event, _code, _description, _url, isMainFrame) => {
    if (isMainFrame) revealMainWindow();
  });
  mainWindow.webContents.on('render-process-gone', () => {
    if (mainWindow && !mainWindow.isDestroyed()) void mainWindow.loadURL(HABLIX_URL);
  });
  mainWindow.on('closed', () => {
    clearTimeout(splashFallbackTimer);
    splashFallbackTimer = null;
    if (splashWindow && !splashWindow.isDestroyed()) splashWindow.close();
    activityTracker?.stop();
    activityTracker = null;
    mainWindow = null;
  });
  void mainWindow.loadURL(HABLIX_URL);
}

function buildMenu() {
  const template = [];

  if (process.platform === 'darwin') {
    template.push({
      label: app.name,
      submenu: [
        { role: 'about' },
        { label: 'Check for Updates…', click: () => void updateManager?.checkNow() },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    });
  } else {
    template.push({
      label: 'Hablix',
      submenu: [
        { label: 'Reload Hotel', accelerator: 'CmdOrCtrl+R', click: () => mainWindow?.reload() },
        { label: 'Check for Updates…', click: () => void updateManager?.checkNow() },
        { type: 'separator' },
        { role: 'quit' }
      ]
    });
  }

  template.push(
    {
      label: 'User Commands',
      submenu: [
        {
          label: 'Quick Access',
          submenu: [
            { label: 'Navigator', accelerator: 'CmdOrCtrl+Shift+N', click: () => void runUserAction('navigator') },
            { label: 'Catalog', accelerator: 'CmdOrCtrl+Shift+C', click: () => void runUserAction('catalog') },
            { label: 'Inventory', accelerator: 'CmdOrCtrl+Shift+B', click: () => void runUserAction('inventory') },
            { label: 'Friends', accelerator: 'CmdOrCtrl+Shift+F', click: () => void runUserAction('friends') },
            { label: 'Messages', click: () => void runUserAction('messages') },
            { label: 'Camera', click: () => void runUserAction('camera') }
          ]
        },
        { type: 'separator' },
        {
          label: 'Actions & Expressions',
          submenu: [
            { label: 'Wave (o/ or _o/)', click: () => void runUserAction('wave') },
            { label: 'Go Idle (:idle)', click: () => void runUserAction('idle') },
            { label: 'Respect User (_b)', click: () => void runUserAction('respect') },
            { type: 'separator' },
            { label: 'Laugh — VIP (:d or ;d)', click: () => void runUserAction('laugh') },
            { label: 'Kiss — VIP (:kiss)', click: () => void runUserAction('kiss') },
            { label: 'Jump — VIP (:jump)', click: () => void runUserAction('jump') }
          ]
        },
        {
          label: 'Room View',
          submenu: [
            { label: 'Shake Room (:shake)', click: () => void runUserAction('shake') },
            { label: 'Rotate Room (:rotate)', click: () => void runUserAction('rotate') },
            { label: 'Flip Room (:flip or :iddqd)', click: () => void runUserAction('flip') },
            { label: 'Set Zoom (:zoom)', click: () => void runUserAction('zoom') }
          ]
        },
        {
          label: 'Tools',
          submenu: [
            { label: 'Hold Sign (:sign)', click: () => void runUserAction('sign') },
            { label: 'Furniture Chooser (:furni)', click: () => void runUserAction('furnitureChooser') },
            { label: 'User Chooser (:chooser)', click: () => void runUserAction('userChooser') },
            { label: 'Toggle FPS (:togglefps)', click: () => void runUserAction('toggleFps') },
            { label: 'Screenshot (:screenshot)', click: () => void runUserAction('screenshot') },
            { label: 'Client Info (:client, :nitro or :billsonnn)', click: () => void runUserAction('clientInfo') }
          ]
        }
      ]
    }
  );

  if (hasStaffAccess) {
    template.push({
      label: 'Admin Commands',
      submenu: [
        { label: 'Toggle Mod Tools', accelerator: 'CmdOrCtrl+Shift+M', click: () => void runStaffAction('toggle') },
        { type: 'separator' },
        { label: 'Current Room Tool', accelerator: 'CmdOrCtrl+Shift+I', click: () => void runStaffAction('room') },
        { label: 'Current Room Chatlog', accelerator: 'CmdOrCtrl+Shift+L', click: () => void runStaffAction('chatlog') },
        { label: 'Selected User Tool', accelerator: 'CmdOrCtrl+Shift+U', click: () => void runStaffAction('user') },
        { label: 'Reports Queue', accelerator: 'CmdOrCtrl+Shift+T', click: () => void runStaffAction('reports') },
        { type: 'separator' },
        {
          label: 'Room Management Commands',
          submenu: [
            { label: 'Pick Up All Furniture (:pickall)', click: () => void runUserAction('pickAll') },
            { label: 'Eject Everyone (:ejectall)', click: () => void runUserAction('ejectAll') },
            { label: 'Floor Editor (:floor)', click: () => void runUserAction('floorEditor') },
            { label: 'Broadcast Floor Editor (:bcfloor)', click: () => void runUserAction('broadcastFloorEditor') },
            { label: 'Room Settings (:settings)', click: () => void runUserAction('roomSettings') }
          ]
        }
      ]
    });
  }

  template.push(
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
  );

  if (process.platform === 'darwin') {
    template.splice(template.length - 1, 0, { role: 'editMenu' });
    template.push({ role: 'windowMenu' });
  }

  return Menu.buildFromTemplate(template);
}

app.whenReady().then(() => {
  session.fromPartition('persist:hablix').setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false);
  });

  Menu.setApplicationMenu(buildMenu());
  createMainWindow();
  void presence.start();
  updateManager = new UpdateManager({
    app,
    autoUpdater,
    dialog,
    shell,
    getWindow: () => mainWindow
  });
  updateManager.start();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  updateManager?.stop();
  void presence.stop();
});
