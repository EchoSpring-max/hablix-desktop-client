const RPC = require('discord-rpc');

const CLIENT_ID = '1553805351479017632';
const LARGE_IMAGE_KEY = 'hablix-large';
const DEFAULT_ACTIVITY = Object.freeze({
  details: 'Starting Hablix',
  state: 'Entering the hotel'
});

class PresenceManager {
  constructor() {
    this.client = null;
    this.reconnectTimer = null;
    this.startedAt = new Date();
    this.stopped = false;
    this.ready = false;
    this.activity = { ...DEFAULT_ACTIVITY };
    this.activityKey = '';
  }

  async start() {
    this.stopped = false;
    await this.connect();
  }

  async connect() {
    if (this.stopped) return;

    const client = new RPC.Client({ transport: 'ipc' });
    this.client = client;
    this.ready = false;

    client.once('ready', async () => {
      if (this.client !== client) return;
      this.ready = true;
      try {
        await client.setActivity(this.createActivity(this.activity));
        console.info(`Discord Rich Presence connected: ${this.activity.details} — ${this.activity.state}`);
      } catch (error) {
        console.warn('Could not set Discord activity:', error.message);
      }
    });

    client.on('disconnected', () => {
      if (this.client !== client) return;
      this.client = null;
      this.ready = false;
      this.scheduleReconnect();
    });
    client.on('error', (error) => console.warn('Discord RPC error:', error.message));

    try {
      await client.login({ clientId: CLIENT_ID });
    } catch (error) {
      console.warn('Discord is unavailable:', error.message);
      if (this.client === client) {
        this.client = null;
        this.ready = false;
      }
      try {
        client.destroy();
      } catch {}
      this.scheduleReconnect();
    }
  }

  createActivity(activity) {
    return {
      details: activity.details,
      state: activity.state,
      startTimestamp: this.startedAt,
      largeImageKey: LARGE_IMAGE_KEY,
      largeImageText: 'Hablix',
      instance: false,
      buttons: [{ label: 'Play Hablix', url: 'https://hablix.org/client' }]
    };
  }

  async setActivity(activity) {
    const key = JSON.stringify(activity);
    if (key === this.activityKey) return;
    this.activity = activity;
    this.activityKey = key;
    if (!this.client || !this.ready) return;
    try {
      await this.client.setActivity(this.createActivity(activity));
      console.info(`Discord activity updated: ${activity.details} — ${activity.state}`);
    } catch (error) {
      console.warn('Could not update Discord activity:', error.message);
    }
  }

  scheduleReconnect() {
    if (this.reconnectTimer || this.stopped) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      void this.connect();
    }, 15_000);
  }

  async disconnect() {
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
    const client = this.client;
    this.client = null;
    this.ready = false;
    if (!client) return;
    try {
      await client.clearActivity();
    } catch {}
    try {
      client.destroy();
    } catch {}
  }

  async stop() {
    this.stopped = true;
    await this.disconnect();
  }
}

module.exports = { CLIENT_ID, DEFAULT_ACTIVITY, LARGE_IMAGE_KEY, PresenceManager };
