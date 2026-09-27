# Hablix Desktop

A small Windows desktop client for [Hablix](https://hablix.org/client) with configurable Discord Rich Presence.

## Features

- Loads Hablix in a dedicated desktop window and keeps the login session between launches.
- Connects to the locally running Discord desktop app through Discord RPC, preconfigured for the Hablix application (`1553805351479017632`).
- Includes an in-app settings screen for the Discord Application ID, activity text, and artwork keys.
- Restricts in-app navigation to `hablix.org`; external links open in the default browser.
- Uses Electron isolation, sandboxing, and a deny-by-default permission policy.

## Development

Requirements: Node.js 20+ and the Discord desktop app.

```powershell
npm install
npm start
```

Run the test suite with `npm test`.

## Configure Discord Rich Presence

1. Keep the Discord desktop app running and ensure activity sharing is enabled in Discord.
2. Start Hablix Desktop. The bundled Hablix Discord Application ID connects automatically.
3. To change the activity text or artwork keys, open **Settings > Discord Rich Presence**.

No Discord token, password, or bot secret is requested or stored. Settings are saved locally in Electron's per-user application data directory.

## Build for Windows

```powershell
npm run dist
```

The installer and portable executable are written to `dist/`.

## Project status

This is an independent, unofficial client. Hablix and Discord are trademarks of their respective owners.
