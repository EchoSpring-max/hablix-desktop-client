const STAFF_ACTIONS = Object.freeze({
  toggle: null,
  room: 'Room Tool',
  chatlog: 'Chatlog Tool',
  user: 'User:',
  reports: 'Report Tool'
});

function runStaffActionInPage(action) {
  const labels = {
    toggle: null,
    room: 'Room Tool',
    chatlog: 'Chatlog Tool',
    user: 'User:',
    reports: 'Report Tool'
  };
  const label = labels[action];
  const modToolsButton = document.querySelector('.navigation-item.icon.icon-modtools');

  if (!Object.prototype.hasOwnProperty.call(labels, action)) {
    return Promise.resolve({ ok: false, reason: 'unknown-action' });
  }
  if (!modToolsButton) {
    return Promise.resolve({ ok: false, reason: 'not-authorized' });
  }
  if (action === 'toggle') {
    modToolsButton.click();
    return Promise.resolve({ ok: true });
  }

  if (!document.querySelector('.nitro-mod-tools')) modToolsButton.click();

  return new Promise(resolve => {
    setTimeout(() => {
      const buttons = Array.from(document.querySelectorAll('.nitro-mod-tools button'));
      const target = buttons.find(button => (button.textContent || '').trim().startsWith(label));
      if (!target) return resolve({ ok: false, reason: 'unavailable' });
      if (target.disabled) {
        const reason = action === 'user' ? 'select-user' : 'enter-room';
        return resolve({ ok: false, reason });
      }
      target.click();
      resolve({ ok: true });
    }, 120);
  });
}

function createStaffActionScript(action) {
  if (!Object.prototype.hasOwnProperty.call(STAFF_ACTIONS, action)) {
    throw new Error(`Unknown staff action: ${action}`);
  }
  return `(${runStaffActionInPage.toString()})(${JSON.stringify(action)})`;
}

module.exports = { STAFF_ACTIONS, createStaffActionScript, runStaffActionInPage };
