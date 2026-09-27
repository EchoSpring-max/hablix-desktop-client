const test = require('node:test');
const assert = require('node:assert/strict');
const { CLIENT_ID, LARGE_IMAGE_KEY, PresenceManager } = require('../src/presence');

test('uses the configured Discord application and artwork asset', () => {
  assert.equal(CLIENT_ID, '1553805351479017632');
  assert.equal(LARGE_IMAGE_KEY, 'hablix-large');

  const presence = new PresenceManager();
  const activity = presence.createActivity({
    details: 'Playing Hablix',
    state: 'In the hotel'
  });

  assert.equal(activity.largeImageKey, 'hablix-large');
  assert.equal(activity.largeImageText, 'Hablix');
});
