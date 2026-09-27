const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const sourceDirectory = path.join(__dirname, '..', 'src');

test('splash screen uses the local Hablix login-page artwork', () => {
  const html = fs.readFileSync(path.join(sourceDirectory, 'splash.html'), 'utf8');
  assert.match(html, /assets\/hablix-logo\.png/);
  assert.match(html, /Content-Security-Policy/);
  assert.equal(fs.existsSync(path.join(sourceDirectory, 'assets', 'hablix-logo.png')), true);
});

test('splash lifecycle has minimum and fallback timing', () => {
  const mainSource = fs.readFileSync(path.join(sourceDirectory, 'main.js'), 'utf8');
  assert.match(mainSource, /MIN_SPLASH_TIME_MS/);
  assert.match(mainSource, /MAX_SPLASH_TIME_MS/);
  assert.match(mainSource, /did-frame-finish-load/);
  assert.match(mainSource, /did-fail-load/);
});
