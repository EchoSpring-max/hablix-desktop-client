const form = document.querySelector('#settings-form');
const message = document.querySelector('#message');
const cancelButton = document.querySelector('#cancel');

function setForm(config) {
  for (const [key, value] of Object.entries(config)) {
    const field = form.elements.namedItem(key);
    if (!field) continue;
    if (field.type === 'checkbox') field.checked = Boolean(value);
    else field.value = value;
  }
}

window.hablixDesktop.getSettings().then(setForm).catch((error) => {
  message.textContent = error.message;
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  message.textContent = '';
  const submitButton = form.querySelector('[type="submit"]');
  submitButton.disabled = true;

  const formData = new FormData(form);
  const settings = Object.fromEntries(formData.entries());
  settings.showPlayButton = form.elements.showPlayButton.checked;

  try {
    await window.hablixDesktop.saveSettings(settings);
    window.hablixDesktop.closeSettings();
  } catch (error) {
    message.textContent = error.message;
    submitButton.disabled = false;
  }
});

cancelButton.addEventListener('click', () => window.hablixDesktop.closeSettings());
