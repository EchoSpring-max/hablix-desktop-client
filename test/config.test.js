const test = require('node:test');
const assert = require('node:assert/strict');
const { DEFAULTS, normalizeConfig } = require('../src/config');

test('ships with the configured Hablix Discord Application ID', () => {
  assert.equal(DEFAULTS.clientId, '1553805351479017632');
});

test('normalizes a valid settings object', () => {
  const config = normalizeConfig({
    clientId: '123456789012345678',
    details: '  Playing Hablix  ',
    state: 'At the pool',
    showPlayButton: false
  });

  assert.equal(config.clientId, '123456789012345678');
  assert.equal(config.details, 'Playing Hablix');
  assert.equal(config.state, 'At the pool');
  assert.equal(config.showPlayButton, false);
});

test('rejects an invalid Discord Application ID', () => {
  assert.throws(
    () => normalizeConfig({ clientId: 'not-an-id' }),
    /17 to 20 digits/
  );
});

test('falls back to useful text and strips control characters', () => {
  const config = normalizeConfig({ details: '\u0000', state: '' });
  assert.equal(config.details, 'Exploring Hablix');
  assert.equal(config.state, 'In the hotel');
});
