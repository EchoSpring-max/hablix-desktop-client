const DOM_PROBE = `(() => {
  const roomKey = '__hablixDesktopRoomName';

  const captureRoomName = () => {
    const roomTools = document.querySelector('.nitro-room-tools-container');
    if (!roomTools) {
      window[roomKey] = '';
      return;
    }

    const roomNameElement = document.querySelector(
      '.nitro-room-tools-info .fs-4, .nitro-room-tools-info [class*="room-name"]'
    );
    const roomInfo = document.querySelector('.nitro-room-tools-info');
    const rawText = roomNameElement?.textContent || roomInfo?.textContent || '';
    const firstLine = rawText.split(/\\r?\\n/)[0].trim();
    if (firstLine && firstLine.length <= 128) window[roomKey] = firstLine;
  };

  if (!window.__hablixDesktopActivityObserver) {
    window.__hablixDesktopActivityObserver = new MutationObserver(captureRoomName);
    window.__hablixDesktopActivityObserver.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
    captureRoomName();
  }

  return {
    url: location.href,
    title: document.title,
    readyState: document.readyState,
    isLogin: Boolean(document.querySelector('#login-form, #loginForm, input[name="username"]')),
    hasHotelClient: Boolean(document.querySelector('.nitro-room-tools-container, [class*="nitro-"], canvas')),
    hasStaffAccess: Boolean(document.querySelector('.navigation-item.icon.icon-modtools')),
    roomName: window[roomKey] || '',
    panel: document.querySelector('.nitro-avatar-editor') ? 'avatar-editor' :
      document.querySelector('.nitro-catalog') ? 'catalog' :
      document.querySelector('.nitro-navigator') ? 'navigator' :
      document.querySelector('.nitro-inventory') ? 'inventory' :
      document.querySelector('.nitro-friends-messenger') ? 'messenger' :
      document.querySelector('.nitro-friends') ? 'friends' : ''
  };
})()`;

function cleanRoomName(value) {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 96);
}

function deriveActivity(snapshot = {}) {
  const roomName = cleanRoomName(snapshot.roomName);
  const location = roomName ? `In ${roomName}` : 'In the hotel';

  if (snapshot.isLoading || snapshot.readyState === 'loading') {
    return { details: 'Loading Hablix', state: 'Entering the hotel' };
  }

  if (!snapshot.isFocused) {
    return { details: 'Away from Hablix', state: location };
  }

  if (snapshot.isLogin) {
    return { details: 'At the front desk', state: 'Signing in' };
  }

  const panelActivities = {
    'avatar-editor': 'Changing their look',
    catalog: 'Browsing the catalog',
    navigator: 'Finding a room',
    inventory: 'Checking their inventory',
    messenger: 'Chatting with friends',
    friends: 'Checking their friends list'
  };

  if (panelActivities[snapshot.panel]) {
    return { details: panelActivities[snapshot.panel], state: location };
  }

  if (roomName) {
    return { details: `In ${roomName}`, state: 'Playing Hablix' };
  }

  if (snapshot.hasHotelClient) {
    return { details: 'Playing Hablix', state: 'Exploring the hotel' };
  }

  return { details: 'Visiting Hablix', state: 'At the hotel' };
}

class ActivityTracker {
  constructor(window, presence, onStaffAccessChange = () => {}) {
    this.window = window;
    this.presence = presence;
    this.onStaffAccessChange = onStaffAccessChange;
    this.hasStaffAccess = null;
    this.timer = null;
    this.isLoading = true;
  }

  start() {
    this.window.webContents.on('did-start-navigation', (_event, _url, _isInPlace, isMainFrame) => {
      if (!isMainFrame) return;
      this.isLoading = true;
      void this.refresh();
    });
    this.window.webContents.on('did-frame-finish-load', (_event, isMainFrame) => {
      if (!isMainFrame) return;
      this.isLoading = false;
      void this.refresh();
    });
    this.window.webContents.on('did-navigate-in-page', () => void this.refresh());
    this.window.on('focus', () => void this.refresh());
    this.window.on('blur', () => void this.refresh());
    this.timer = setInterval(() => void this.refresh(), 2_000);
    void this.refresh();
  }

  async refresh() {
    if (!this.window || this.window.isDestroyed()) return;

    let pageState = {};
    if (!this.isLoading) {
      try {
        pageState = await this.window.webContents.executeJavaScript(DOM_PROBE, true);
      } catch {
        pageState = {};
      }
    }

    const hasStaffAccess = pageState.hasStaffAccess === true;
    if (hasStaffAccess !== this.hasStaffAccess) {
      this.hasStaffAccess = hasStaffAccess;
      this.onStaffAccessChange(hasStaffAccess);
    }

    await this.presence.setActivity(deriveActivity({
      ...pageState,
      isLoading: this.isLoading,
      isFocused: this.window.isFocused()
    }));
  }

  stop() {
    clearInterval(this.timer);
    this.timer = null;
  }
}

module.exports = { ActivityTracker, DOM_PROBE, cleanRoomName, deriveActivity };
