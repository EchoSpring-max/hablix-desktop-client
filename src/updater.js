const https = require('node:https');

const RELEASES_URL = 'https://github.com/EchoSpring-max/hablix-desktop-client/releases';
const LATEST_RELEASE_API = 'https://api.github.com/repos/EchoSpring-max/hablix-desktop-client/releases/latest';
const FIRST_CHECK_DELAY_MS = 10_000;
const CHECK_INTERVAL_MS = 4 * 60 * 60 * 1_000;

function normalizedVersion(version) {
  return String(version || '').trim().replace(/^v/i, '').split('-')[0]
    .split('.').map(part => Number.parseInt(part, 10) || 0);
}

function compareVersions(left, right) {
  const a = normalizedVersion(left);
  const b = normalizedVersion(right);
  const length = Math.max(a.length, b.length);
  for (let index = 0; index < length; index += 1) {
    const difference = (a[index] || 0) - (b[index] || 0);
    if (difference !== 0) return Math.sign(difference);
  }
  return 0;
}

function supportsInstalledUpdates(platform = process.platform, environment = process.env) {
  return !(platform === 'win32' && environment.PORTABLE_EXECUTABLE_FILE);
}

function requestJson(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'Hablix-Desktop-Updater'
      }
    }, response => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        response.resume();
        requestJson(response.headers.location).then(resolve, reject);
        return;
      }
      if (response.statusCode !== 200) {
        response.resume();
        reject(new Error(`GitHub returned HTTP ${response.statusCode}.`));
        return;
      }
      let body = '';
      response.setEncoding('utf8');
      response.on('data', chunk => { body += chunk; });
      response.on('end', () => {
        try { resolve(JSON.parse(body)); } catch (error) { reject(error); }
      });
    });
    request.on('error', reject);
    request.setTimeout(15_000, () => request.destroy(new Error('Update check timed out.')));
  });
}

class UpdateManager {
  constructor({ app, autoUpdater, dialog, shell, getWindow }) {
    this.app = app;
    this.autoUpdater = autoUpdater;
    this.dialog = dialog;
    this.shell = shell;
    this.getWindow = getWindow;
    this.firstCheckTimer = null;
    this.intervalTimer = null;
    this.manualCheck = false;
    this.showingDownloadedPrompt = false;
  }

  start() {
    if (!this.app.isPackaged) return;
    if (supportsInstalledUpdates()) this.configureInstalledUpdater();
    this.firstCheckTimer = setTimeout(() => void this.checkNow(false), FIRST_CHECK_DELAY_MS);
    this.intervalTimer = setInterval(() => void this.checkNow(false), CHECK_INTERVAL_MS);
    this.intervalTimer.unref?.();
  }

  stop() {
    clearTimeout(this.firstCheckTimer);
    clearInterval(this.intervalTimer);
  }

  configureInstalledUpdater() {
    this.autoUpdater.autoDownload = true;
    this.autoUpdater.autoInstallOnAppQuit = true;
    this.autoUpdater.allowPrerelease = false;
    this.autoUpdater.logger = console;

    this.autoUpdater.on('update-not-available', () => {
      if (!this.manualCheck) return;
      this.manualCheck = false;
      void this.showMessage({
        type: 'info',
        title: 'Hablix Desktop is up to date',
        message: `You already have the newest version (${this.app.getVersion()}).`
      });
    });

    this.autoUpdater.on('update-available', info => {
      this.manualCheck = false;
      console.info(`Downloading Hablix Desktop ${info.version} update.`);
    });
    this.autoUpdater.on('download-progress', progress => {
      console.info(`Update download ${Math.round(progress.percent || 0)}% complete.`);
    });
    this.autoUpdater.on('update-downloaded', info => void this.offerRestart(info));
    this.autoUpdater.on('error', error => {
      console.error('Hablix Desktop update error:', error);
      if (!this.manualCheck) return;
      this.manualCheck = false;
      void this.showMessage({
        type: 'error',
        title: 'Could not check for updates',
        message: 'Hablix Desktop could not check for updates right now.',
        detail: 'Please try again later or download the newest release from GitHub.'
      });
    });
  }

  async checkNow(manual = true) {
    if (!this.app.isPackaged) {
      if (manual) {
        await this.showMessage({
          type: 'info',
          title: 'Updates are disabled in development',
          message: 'Automatic updates are available in packaged releases.'
        });
      }
      return;
    }

    this.manualCheck = manual;
    try {
      if (supportsInstalledUpdates()) {
        await this.autoUpdater.checkForUpdates();
      } else {
        await this.checkPortableRelease(manual);
      }
    } catch (error) {
      console.error('Hablix Desktop update check failed:', error);
      if (!manual) return;
      this.manualCheck = false;
      await this.showMessage({
        type: 'error',
        title: 'Could not check for updates',
        message: 'Hablix Desktop could not check for updates right now.',
        detail: 'Please try again later.'
      });
    }
  }

  async checkPortableRelease(manual) {
    const release = await requestJson(LATEST_RELEASE_API);
    const latestVersion = release.tag_name || release.name;
    if (compareVersions(latestVersion, this.app.getVersion()) <= 0) {
      if (manual) {
        await this.showMessage({
          type: 'info',
          title: 'Hablix Desktop is up to date',
          message: `You already have the newest version (${this.app.getVersion()}).`
        });
      }
      return;
    }

    const result = await this.showMessage({
      type: 'info',
      title: 'Hablix Desktop update available',
      message: `Version ${normalizedVersion(latestVersion).join('.')} is ready to download.`,
      detail: 'This is the portable Windows edition, so Windows cannot replace it while it is running.',
      buttons: ['Download Update', 'Later'],
      defaultId: 0,
      cancelId: 1
    });
    if (result.response === 0) void this.shell.openExternal(release.html_url || RELEASES_URL);
  }

  async offerRestart(info) {
    if (this.showingDownloadedPrompt) return;
    this.showingDownloadedPrompt = true;
    const result = await this.showMessage({
      type: 'info',
      title: 'Hablix Desktop update ready',
      message: `Version ${info.version} has been downloaded.`,
      detail: 'Restart now to finish installing it. You can also quit normally and the update will install then.',
      buttons: ['Restart and Update', 'Later'],
      defaultId: 0,
      cancelId: 1
    });
    this.showingDownloadedPrompt = false;
    if (result.response === 0) this.autoUpdater.quitAndInstall(false, true);
  }

  showMessage(options) {
    const window = this.getWindow?.();
    return window && !window.isDestroyed()
      ? this.dialog.showMessageBox(window, options)
      : this.dialog.showMessageBox(options);
  }
}

module.exports = {
  CHECK_INTERVAL_MS,
  FIRST_CHECK_DELAY_MS,
  UpdateManager,
  compareVersions,
  normalizedVersion,
  supportsInstalledUpdates
};
