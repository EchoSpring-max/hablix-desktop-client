const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const mainSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'main.js'), 'utf8');
const roomEditorSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'room-editor.html'), 'utf8');

test('Windows application menu exposes user and admin command dropdowns', () => {
  assert.match(mainSource, /label: 'User Commands'/);
  assert.match(mainSource, /label: 'Admin Commands'/);
  assert.match(mainSource, /if \(hasStaffAccess\)/);
});

test('application menu opens the bundled room editor', () => {
  assert.match(mainSource, /function openRoomEditor\(\)/);
  assert.match(mainSource, /label: 'Room Editor…'/);
  assert.match(mainSource, /loadFile\(path\.join\(__dirname, 'room-editor\.html'\)\)/);
  assert.match(mainSource, /accelerator: 'CmdOrCtrl\+Shift\+E'/);
});

test('room editor includes floor finishes and PlusEMU furniture export', () => {
  assert.match(roomEditorSource, /Floor finish/);
  assert.match(roomEditorSource, /Furniture catalog/);
  assert.match(roomEditorSource, /INSERT INTO items \(base_item, user_id, room_id/);
  assert.match(roomEditorSource, /name:'place_furniture'/);
});

test('room editor includes an interactive live room viewer', () => {
  assert.match(roomEditorSource, /id="viewerDialog"/);
  assert.match(roomEditorSource, /id="liveCanvas"/);
  assert.match(roomEditorSource, /function drawLive\(\)/);
  assert.match(roomEditorSource, /Rotate view right/);
});

test('application menu exposes the Gold VIP command dropdown', () => {
  assert.match(mainSource, /label: 'Gold VIP Commands'/);
  for (const command of [':flagme', ':moonwalk', ':superpull', ':superpush', ':transform', ':wordquiz', ':youtube', ':enable 191']) {
    assert.match(mainSource, new RegExp(command.replace(' ', '\\s')));
  }
});
