# Hablix Desktop

A small Windows desktop client for [Hablix](https://hablix.org/client) with automatic Discord Rich Presence.

## Features

- Loads Hablix in a dedicated desktop window and keeps the login session between launches.
- Shows a branded boot splash using the Hablix login-page artwork while the hotel loads.
- Connects automatically to the locally running Discord desktop app through the Hablix RPC application (`1553805351479017632`).
- Displays the registered `hablix-large` artwork asset on every activity.
- Updates the activity for signing in, loading, visiting rooms, browsing the navigator or catalog, checking inventory, chatting with friends, changing outfits, and being away.
- Adds an always-available **User Commands** dropdown to the Windows application menu for standard room commands and quick access to the navigator, catalog, inventory, friends, messages, and camera. Command shortcuts prefill the chat box so the user can review and press Enter.
- Adds an **Admin Commands** dropdown to the Windows application menu with shortcuts for Hablix's existing room, chatlog, selected-user, and report tools. The dropdown appears only when the server-authorized moderator toolbar control is present, and Hablix continues to enforce every action permission.
- Restricts in-app navigation to `hablix.org`; external links open in the default browser.
- Uses Electron isolation, sandboxing, and a deny-by-default permission policy.

## Development

Requirements: Node.js 20+ and the Discord desktop app.

```powershell
npm install
npm start
```

Run the test suite with `npm test`.

## Discord Rich Presence

1. Keep the Discord desktop app running and ensure activity sharing is enabled in Discord.
2. Start Hablix Desktop. Rich Presence connects and updates automatically.

No Discord token, password, bot secret, or RPC configuration is requested or stored. Activity detection reads only non-sensitive client UI markers such as the active panel and room name; it never reads login fields or chat messages.

## Build for Windows

```powershell
npm run dist
```

The installer and portable executable are written to `dist/`.

## Project status

This is an independent, unofficial client. Hablix and Discord are trademarks of their respective owners.
