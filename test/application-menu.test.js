const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const mainSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'main.js'), 'utf8');

test('Windows application menu exposes user and admin command dropdowns', () => {
  assert.match(mainSource, /label: 'User Commands'/);
  assert.match(mainSource, /label: 'Admin Commands'/);
  assert.match(mainSource, /if \(hasStaffAccess\)/);
});
