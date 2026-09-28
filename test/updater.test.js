const assert = require('node:assert/strict');
const test = require('node:test');
const {
  CHECK_INTERVAL_MS,
  FIRST_CHECK_DELAY_MS,
  compareVersions,
  normalizedVersion,
  supportsInstalledUpdates
} = require('../src/updater');

test('normalizes release tags for display and comparison', () => {
  assert.deepEqual(normalizedVersion('v1.8.0'), [1, 8, 0]);
  assert.deepEqual(normalizedVersion('2.0.0-beta.1'), [2, 0, 0]);
});

test('compares semantic release versions', () => {
  assert.equal(compareVersions('v1.8.0', '1.7.0'), 1);
  assert.equal(compareVersions('1.7.0', 'v1.8.0'), -1);
  assert.equal(compareVersions('1.8', '1.8.0'), 0);
});

test('uses installed updates except for the Windows portable package', () => {
  assert.equal(supportsInstalledUpdates('win32', {}), true);
  assert.equal(supportsInstalledUpdates('win32', { PORTABLE_EXECUTABLE_FILE: 'Hablix.exe' }), false);
  assert.equal(supportsInstalledUpdates('darwin', {}), true);
  assert.equal(supportsInstalledUpdates('linux', { APPIMAGE: '/tmp/Hablix.AppImage' }), true);
  assert.equal(supportsInstalledUpdates('linux', {}), true);
});

test('checks shortly after launch and periodically thereafter', () => {
  assert.equal(FIRST_CHECK_DELAY_MS, 10_000);
  assert.equal(CHECK_INTERVAL_MS, 14_400_000);
});
