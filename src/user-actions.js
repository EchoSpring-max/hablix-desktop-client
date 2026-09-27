const USER_ACTIONS = Object.freeze({
  navigator: { type: 'control', selector: '.navigation-item.icon.icon-rooms' },
  catalog: { type: 'control', selector: '.navigation-item.icon.icon-catalog' },
  inventory: { type: 'control', selector: '.navigation-item.icon.icon-inventory' },
  friends: { type: 'control', selector: '.navigation-item.icon.icon-friendall' },
  messages: { type: 'control', selector: '.navigation-item.icon.icon-message' },
  camera: { type: 'control', selector: '.navigation-item.icon.icon-camera', reason: 'enter-room' },
  wave: { type: 'command', command: 'o/' },
  idle: { type: 'command', command: ':idle' },
  respect: { type: 'command', command: '_b' },
  flip: { type: 'command', command: ':flip' },
  zoom: { type: 'command', command: ':zoom ' },
  sign: { type: 'command', command: ':sign ' },
  furnitureChooser: { type: 'command', command: ':furni' },
  userChooser: { type: 'command', command: ':chooser' },
  toggleFps: { type: 'command', command: ':togglefps' },
  screenshot: { type: 'command', command: ':screenshot' }
});

function runUserActionInPage(action) {
  const actions = {
    navigator: { type: 'control', selector: '.navigation-item.icon.icon-rooms' },
    catalog: { type: 'control', selector: '.navigation-item.icon.icon-catalog' },
    inventory: { type: 'control', selector: '.navigation-item.icon.icon-inventory' },
    friends: { type: 'control', selector: '.navigation-item.icon.icon-friendall' },
    messages: { type: 'control', selector: '.navigation-item.icon.icon-message' },
    camera: { type: 'control', selector: '.navigation-item.icon.icon-camera', reason: 'enter-room' },
    wave: { type: 'command', command: 'o/' },
    idle: { type: 'command', command: ':idle' },
    respect: { type: 'command', command: '_b' },
    flip: { type: 'command', command: ':flip' },
    zoom: { type: 'command', command: ':zoom ' },
    sign: { type: 'command', command: ':sign ' },
    furnitureChooser: { type: 'command', command: ':furni' },
    userChooser: { type: 'command', command: ':chooser' },
    toggleFps: { type: 'command', command: ':togglefps' },
    screenshot: { type: 'command', command: ':screenshot' }
  };
  const selected = actions[action];

  if (!selected) return { ok: false, reason: 'unknown-action' };
  if (selected.type === 'control') {
    const control = document.querySelector(selected.selector);
    if (!control) return { ok: false, reason: selected.reason || 'unavailable' };
    control.click();
    return { ok: true };
  }

  const input = document.querySelector('.nitro-chat-input-container input.chat-input');
  if (!input) return { ok: false, reason: 'enter-room' };

  const prototype = Object.getPrototypeOf(input);
  const nativeSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
  if (nativeSetter) nativeSetter.call(input, selected.command);
  else input.value = selected.command;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.focus();
  return { ok: true, prefilled: true };
}

function createUserActionScript(action) {
  if (!Object.prototype.hasOwnProperty.call(USER_ACTIONS, action)) {
    throw new Error(`Unknown user action: ${action}`);
  }
  return `(${runUserActionInPage.toString()})(${JSON.stringify(action)})`;
}

module.exports = { USER_ACTIONS, createUserActionScript, runUserActionInPage };
