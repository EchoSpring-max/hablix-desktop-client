const RPC = require('discord-rpc');

class PresenceManager {
  constructor() {
    this.client = null;
    this.config = null;
    this.reconnectTimer = null;
    this.startedAt = new Date();
    this.stopped = false;
  }

  async configure(config) {
    this.config = config;
    this.stopped = false;
    await this.disconnect();
    if (!config.clientId) return;
    await this.connect();
  }

  async connect() {
    if (!this.config?.clientId || this.stopped) return;

    const client = new RPC.Client({ transport: 'ipc' });
    this.client = client;

    client.once('ready', async () => {
      try {
        await client.setActivity(this.createActivity());
        console.info('Discord Rich Presence connected.');
      } catch (error) {
        console.warn('Could not set Discord activity:', error.message);
      }
    });

    client.on('disconnected', () => this.scheduleReconnect());
    client.on('error', (error) => console.warn('Discord RPC error:', error.message));

    try {
      await client.login({ clientId: this.config.clientId });
    } catch (error) {
      console.warn('Discord is unavailable:', error.message);
      this.scheduleReconnect();
    }
  }

  createActivity() {
    const activity = {
      details: this.config.details,
      state: this.config.state,
      startTimestamp: this.startedAt,
      instance: false
    };

    if (this.config.largeImageKey) {
      activity.largeImageKey = this.config.largeImageKey;
      activity.largeImageText = this.config.largeImageText;
    }

    if (this.config.showPlayButton) {
      activity.buttons = [{ label: 'Play Hablix', url: 'https://hablix.org/client' }];
    }

    return activity;
  }

  scheduleReconnect() {
    if (this.reconnectTimer || this.stopped || !this.config?.clientId) return;
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

module.exports = { PresenceManager };
