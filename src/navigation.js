const HABLIX_HOST = 'hablix.org';

function isAllowedHablixUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' &&
      (url.hostname === HABLIX_HOST || url.hostname.endsWith(`.${HABLIX_HOST}`));
  } catch {
    return false;
  }
}

function isSafeExternalUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

module.exports = { isAllowedHablixUrl, isSafeExternalUrl };
