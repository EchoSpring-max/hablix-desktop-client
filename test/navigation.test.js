const test = require('node:test');
const assert = require('node:assert/strict');
const { isAllowedHablixUrl, isSafeExternalUrl } = require('../src/navigation');

test('allows Hablix HTTPS pages and subdomains', () => {
  assert.equal(isAllowedHablixUrl('https://hablix.org/client'), true);
  assert.equal(isAllowedHablixUrl('https://www.hablix.org/'), true);
});

test('blocks lookalike, insecure, and script URLs', () => {
  assert.equal(isAllowedHablixUrl('https://hablix.org.example.com/'), false);
  assert.equal(isAllowedHablixUrl('http://hablix.org/'), false);
  assert.equal(isAllowedHablixUrl('javascript:alert(1)'), false);
});

test('external links are limited to web protocols', () => {
  assert.equal(isSafeExternalUrl('https://discord.hablix.org'), true);
  assert.equal(isSafeExternalUrl('mailto:test@example.com'), false);
  assert.equal(isSafeExternalUrl('file:///etc/passwd'), false);
});
