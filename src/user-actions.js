const USER_ACTIONS = Object.freeze({
  navigator: { type: 'control', selector: '.navigation-item.icon.icon-rooms' },
  catalog: { type: 'control', selector: '.navigation-item.icon.icon-catalog' },
  inventory: { type: 'control', selector: '.navigation-item.icon.icon-inventory' },
  friends: { type: 'control', selector: '.navigation-item.icon.icon-friendall' },
  messages: { type: 'control', selector: '.navigation-item.icon.icon-message' },
  camera: { type: 'control', selector: '.navigation-item.icon.icon-camera', reason: 'enter-room' },
  shake: { type: 'command', command: ':shake' },
  rotate: { type: 'command', command: ':rotate' },
  laugh: { type: 'command', command: ':d' },
  wave: { type: 'command', command: 'o/' },
  kiss: { type: 'command', command: ':kiss' },
  jump: { type: 'command', command: ':jump' },
  idle: { type: 'command', command: ':idle' },
  respect: { type: 'command', command: '_b' },
  flip: { type: 'command', command: ':flip' },
  zoom: { type: 'command', command: ':zoom ' },
  sign: { type: 'command', command: ':sign ' },
  furnitureChooser: { type: 'command', command: ':furni' },
  userChooser: { type: 'command', command: ':chooser' },
  toggleFps: { type: 'command', command: ':togglefps' },
  screenshot: { type: 'command', command: ':screenshot' },
  clientInfo: { type: 'command', command: ':client' }
});

const ADMIN_ACTIONS = Object.freeze({
  pickAll: { type: 'command', command: ':pickall' },
  ejectAll: { type: 'command', command: ':ejectall' },
  floorEditor: { type: 'command', command: ':floor' },
  broadcastFloorEditor: { type: 'command', command: ':bcfloor' },
  roomSettings: { type: 'command', command: ':settings' }
});

function runUserActionInPage(action) {
  const actions = {
    navigator: { type: 'control', selector: '.navigation-item.icon.icon-rooms' },
    catalog: { type: 'control', selector: '.navigation-item.icon.icon-catalog' },
    inventory: { type: 'control', selector: '.navigation-item.icon.icon-inventory' },
    friends: { type: 'control', selector: '.navigation-item.icon.icon-friendall' },
    messages: { type: 'control', selector: '.navigation-item.icon.icon-message' },
    camera: { type: 'control', selector: '.navigation-item.icon.icon-camera', reason: 'enter-room' },
    shake: { type: 'command', command: ':shake' },
    rotate: { type: 'command', command: ':rotate' },
    laugh: { type: 'command', command: ':d' },
    wave: { type: 'command', command: 'o/' },
    kiss: { type: 'command', command: ':kiss' },
    jump: { type: 'command', command: ':jump' },
    idle: { type: 'command', command: ':idle' },
    respect: { type: 'command', command: '_b' },
    flip: { type: 'command', command: ':flip' },
    zoom: { type: 'command', command: ':zoom ' },
    sign: { type: 'command', command: ':sign ' },
    furnitureChooser: { type: 'command', command: ':furni' },
    userChooser: { type: 'command', command: ':chooser' },
    toggleFps: { type: 'command', command: ':togglefps' },
    screenshot: { type: 'command', command: ':screenshot' },
    clientInfo: { type: 'command', command: ':client' }
  };
  const adminActions = {
    pickAll: { type: 'command', command: ':pickall' },
    ejectAll: { type: 'command', command: ':ejectall' },
    floorEditor: { type: 'command', command: ':floor' },
    broadcastFloorEditor: { type: 'command', command: ':bcfloor' },
    roomSettings: { type: 'command', command: ':settings' }
  };
  const selected = actions[action] || adminActions[action];

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
  if (!Object.prototype.hasOwnProperty.call(USER_ACTIONS, action) &&
      !Object.prototype.hasOwnProperty.call(ADMIN_ACTIONS, action)) {
    throw new Error(`Unknown user action: ${action}`);
  }
  return `(${runUserActionInPage.toString()})(${JSON.stringify(action)})`;
}

module.exports = { ADMIN_ACTIONS, USER_ACTIONS, createUserActionScript, runUserActionInPage };
