const test = require('node:test');
const assert = require('node:assert/strict');
const packageJson = require('../package.json');

test('uses the application icon throughout the Windows installer', () => {
  const appIcon = packageJson.build.win.icon;
  assert.equal(appIcon, 'src/assets/icon.ico');
  assert.equal(packageJson.build.nsis.installerIcon, appIcon);
  assert.equal(packageJson.build.nsis.uninstallerIcon, appIcon);
  assert.equal(packageJson.build.nsis.installerHeaderIcon, appIcon);
  assert.equal(packageJson.build.nsis.artifactName, 'Hablix-Desktop-Setup-${version}.${ext}');
  assert.equal(packageJson.build.portable.artifactName, 'Hablix-Desktop-Portable-${version}.${ext}');
});

test('publishes update metadata to the project GitHub releases', () => {
  assert.deepEqual(packageJson.build.publish, {
    provider: 'github',
    owner: 'EchoSpring-max',
    repo: 'hablix-desktop-client'
  });
  assert.equal(packageJson.dependencies['electron-updater'], '6.8.9');
});
