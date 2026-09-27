const fs = require('node:fs');
const path = require('node:path');

const DEFAULTS = Object.freeze({
  clientId: '',
  details: 'Exploring Hablix',
  state: 'In the hotel',
  largeImageKey: '',
  largeImageText: 'Hablix',
  showPlayButton: true
});

function cleanText(value, fallback = '', maxLength = 128) {
  if (typeof value !== 'string') return fallback;
  const cleaned = value.trim().replace(/[\u0000-\u001f\u007f]/g, '');
  return cleaned.slice(0, maxLength) || fallback;
}

function normalizeConfig(input = {}) {
  const clientId = cleanText(input.clientId, '', 20);
  if (clientId && !/^\d{17,20}$/.test(clientId)) {
    throw new Error('Discord Application ID must contain 17 to 20 digits.');
  }

  return {
    clientId,
    details: cleanText(input.details, DEFAULTS.details),
    state: cleanText(input.state, DEFAULTS.state),
    largeImageKey: cleanText(input.largeImageKey, '', 64),
    largeImageText: cleanText(input.largeImageText, DEFAULTS.largeImageText),
    showPlayButton: input.showPlayButton !== false
  };
}

class ConfigStore {
  constructor(userDataPath) {
    this.filePath = path.join(userDataPath, 'settings.json');
  }

  load() {
    try {
      return normalizeConfig(JSON.parse(fs.readFileSync(this.filePath, 'utf8')));
    } catch (error) {
      if (error.code !== 'ENOENT') console.warn('Could not load settings:', error.message);
      return { ...DEFAULTS };
    }
  }

  save(input) {
    const config = normalizeConfig(input);
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    const temporaryPath = `${this.filePath}.tmp`;
    fs.writeFileSync(temporaryPath, `${JSON.stringify(config, null, 2)}\n`, { mode: 0o600 });
    fs.renameSync(temporaryPath, this.filePath);
    return config;
  }
}

module.exports = { ConfigStore, DEFAULTS, normalizeConfig };
