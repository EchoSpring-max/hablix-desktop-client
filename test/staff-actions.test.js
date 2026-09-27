const test = require('node:test');
const assert = require('node:assert/strict');
const { createStaffActionScript, runStaffActionInPage } = require('../src/staff-actions');

test('staff actions fail closed without the server-authorized mod icon', async () => {
  const originalDocument = global.document;
  global.document = { querySelector: () => null };
  try {
    assert.deepEqual(await runStaffActionInPage('room'), {
      ok: false,
      reason: 'not-authorized'
    });
  } finally {
    global.document = originalDocument;
  }
});

test('only known non-destructive staff openers can be scripted', () => {
  assert.match(createStaffActionScript('reports'), /Report Tool/);
  assert.throws(() => createStaffActionScript('ban-user'), /Unknown staff action/);
});

test('authorized shortcuts open the existing Hablix tool instead of duplicating actions', async () => {
  const originalDocument = global.document;
  let toolbarClicked = false;
  let roomToolClicked = false;
  const toolbar = { click: () => { toolbarClicked = true; } };
  const roomTool = {
    disabled: false,
    textContent: 'Room Tool',
    click: () => { roomToolClicked = true; }
  };
  global.document = {
    querySelector: selector => selector.includes('icon-modtools') ? toolbar : null,
    querySelectorAll: () => [roomTool]
  };

  try {
    assert.deepEqual(await runStaffActionInPage('room'), { ok: true });
    assert.equal(toolbarClicked, true);
    assert.equal(roomToolClicked, true);
  } finally {
    global.document = originalDocument;
  }
});
