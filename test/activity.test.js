const test = require('node:test');
const assert = require('node:assert/strict');
const { cleanRoomName, deriveActivity } = require('../src/activity');

test('reports the login screen as the front desk', () => {
  assert.deepEqual(deriveActivity({ isFocused: true, isLogin: true }), {
    details: 'At the front desk',
    state: 'Signing in'
  });
});

test('reports loading before page-specific states', () => {
  assert.deepEqual(deriveActivity({ isFocused: false, isLoading: true, isLogin: true }), {
    details: 'Loading Hablix',
    state: 'Entering the hotel'
  });
});

test('reports active Nitro panels with the current room', () => {
  assert.deepEqual(deriveActivity({
    isFocused: true,
    hasHotelClient: true,
    panel: 'catalog',
    roomName: 'Welcome Lounge'
  }), {
    details: 'Browsing the catalog',
    state: 'In Welcome Lounge'
  });
});

test('reports room exploration when no panel is open', () => {
  assert.deepEqual(deriveActivity({
    isFocused: true,
    hasHotelClient: true,
    roomName: 'Pool'
  }), {
    details: 'Exploring a room',
    state: 'Pool'
  });
});

test('reports background windows as away', () => {
  assert.deepEqual(deriveActivity({ isFocused: false, roomName: 'Lobby' }), {
    details: 'Away from Hablix',
    state: 'In Lobby'
  });
});

test('sanitizes room names before sending them to Discord', () => {
  assert.equal(cleanRoomName('  Lobby\u0000\n  '), 'Lobby');
  assert.equal(cleanRoomName('x'.repeat(120)).length, 96);
});
