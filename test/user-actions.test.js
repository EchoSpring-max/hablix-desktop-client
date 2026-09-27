const test = require('node:test');
const assert = require('node:assert/strict');
const { USER_ACTIONS, createUserActionScript, runUserActionInPage } = require('../src/user-actions');

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

test('commands fail closed outside rooms and exclude privileged bulk actions', () => {
  const originalDocument = global.document;
  global.document = { querySelector: () => null };
  try {
    assert.deepEqual(runUserActionInPage('wave'), { ok: false, reason: 'enter-room' });
  } finally {
    global.document = originalDocument;
  }
  assert.equal(Object.prototype.hasOwnProperty.call(USER_ACTIONS, 'pickall'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(USER_ACTIONS, 'ejectall'), false);
  assert.throws(() => createUserActionScript('ejectall'), /Unknown user action/);
});
