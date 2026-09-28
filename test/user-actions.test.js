const test = require('node:test');
const assert = require('node:assert/strict');
const { ADMIN_ACTIONS, USER_ACTIONS, createUserActionScript, runUserActionInPage } = require('../src/user-actions');

test('standard controls invoke Hablix existing UI', () => {
  const originalDocument = global.document;
  let clicked = false;
  global.document = {
    querySelector: selector => selector.includes('icon-catalog') ? { click: () => { clicked = true; } } : null
  };
  try {
    assert.deepEqual(runUserActionInPage('catalog'), { ok: true });
    assert.equal(clicked, true);
  } finally {
    global.document = originalDocument;
  }
});

test('room commands are prefilled and never submitted automatically', () => {
  const originalDocument = global.document;
  const originalEvent = global.Event;
  let focused = false;
  let dispatched = false;
  const input = Object.create({
    set value(value) { this.currentValue = value; }
  });
  input.dispatchEvent = () => { dispatched = true; };
  input.focus = () => { focused = true; };
  global.document = { querySelector: () => input };
  global.Event = class Event {};
  try {
    assert.deepEqual(runUserActionInPage('zoom'), { ok: true, prefilled: true });
    assert.equal(input.currentValue, ':zoom ');
    assert.equal(dispatched, true);
    assert.equal(focused, true);
  } finally {
    global.document = originalDocument;
    global.Event = originalEvent;
  }
});

test('commands fail closed outside rooms', () => {
  const originalDocument = global.document;
  global.document = { querySelector: () => null };
  try {
    assert.deepEqual(runUserActionInPage('wave'), { ok: false, reason: 'enter-room' });
  } finally {
    global.document = originalDocument;
  }
  assert.throws(() => createUserActionScript('unknown-command'), /Unknown user action/);
});

test('menus cover every Nitro user and permission-gated room command', () => {
  const userCommands = Object.values(USER_ACTIONS)
    .filter(action => action.type === 'command')
    .map(action => action.command);
  assert.deepEqual(userCommands, [
    ':shake', ':rotate', ':d', 'o/', ':kiss', ':jump', ':idle', '_b', ':flip', ':zoom ', ':sign ',
    ':furni', ':chooser', ':togglefps', ':screenshot', ':client'
  ]);
  assert.deepEqual(Object.values(ADMIN_ACTIONS).map(action => action.command), [
    ':pickall', ':ejectall', ':floor', ':bcfloor', ':settings'
  ]);
  assert.match(createUserActionScript('ejectAll'), /:ejectall/);
});
