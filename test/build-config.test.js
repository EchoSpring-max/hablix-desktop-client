const test = require('node:test');
const assert = require('node:assert/strict');
const packageJson = require('../package.json');

test('uses the application icon throughout the Windows installer', () => {
  const appIcon = packageJson.build.win.icon;
  assert.equal(appIcon, 'src/assets/icon.ico');
  assert.equal(packageJson.build.nsis.installerIcon, appIcon);
  assert.equal(packageJson.build.nsis.uninstallerIcon, appIcon);
  assert.equal(packageJson.build.nsis.installerHeaderIcon, appIcon);
});
