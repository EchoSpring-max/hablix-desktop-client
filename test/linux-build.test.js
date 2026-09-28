const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const packageJson = require('../package.json');

const root = path.join(__dirname, '..');

test('Linux build produces AppImage and Debian packages', () => {
  assert.match(packageJson.scripts['dist:linux'], /--publish never/);
  assert.equal(packageJson.build.linux.icon, 'src/assets/icon.png');
  assert.equal(packageJson.build.linux.category, 'Game');
  assert.deepEqual(packageJson.build.linux.target, ['AppImage', 'deb']);
});

test('Linux workflow builds x64 and ARM64 release assets', () => {
  const workflow = fs.readFileSync(path.join(root, '.github', 'workflows', 'linux-release.yml'), 'utf8');
  assert.match(workflow, /architecture: x64/);
  assert.match(workflow, /architecture: arm64/);
  assert.match(workflow, /ubuntu-24\.04-arm/);
  assert.match(workflow, /npm run dist:linux/);
  assert.match(workflow, /dist\/\*\.AppImage/);
  assert.match(workflow, /dist\/\*\.deb/);
});
