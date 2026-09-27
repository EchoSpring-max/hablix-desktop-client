const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const packageJson = require('../package.json');

const root = path.join(__dirname, '..');

test('macOS build produces universal DMG and ZIP packages', () => {
  assert.equal(packageJson.build.mac.icon, 'build/icon.icns');
  assert.equal(packageJson.build.mac.minimumSystemVersion, '11.0');
  assert.deepEqual(packageJson.build.mac.target.map(target => target.target), ['dmg', 'zip']);
  assert.equal(packageJson.build.mac.target.every(target => target.arch.includes('universal')), true);
});

test('macOS icon generation and release workflow are included', () => {
  const iconScript = fs.readFileSync(path.join(root, 'scripts', 'create-mac-icon.sh'), 'utf8');
  const workflow = fs.readFileSync(path.join(root, '.github', 'workflows', 'macos-release.yml'), 'utf8');
  assert.match(iconScript, /iconutil -c icns/);
  assert.match(workflow, /runs-on: macos-14/);
  assert.match(workflow, /npm run dist:mac/);
  assert.match(workflow, /gh release upload/);
});
