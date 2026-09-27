# Hablix Desktop

A small Windows desktop client for [Hablix](https://hablix.org/client) with configurable Discord Rich Presence.

## Features

- Loads Hablix in a dedicated desktop window and keeps the login session between launches.
- Connects to the locally running Discord desktop app through Discord RPC.
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

1. Create an application in the [Discord Developer Portal](https://discord.com/developers/applications).
2. Copy its Application ID.
3. Start Hablix Desktop and enter that ID in **Settings > Discord Rich Presence**.
4. Optionally upload artwork under the application's Rich Presence assets and enter those asset keys in settings.
5. Keep the Discord desktop app running and ensure activity sharing is enabled in Discord.

No Discord token, password, or bot secret is requested or stored. Settings are saved locally in Electron's per-user application data directory.

## Build for Windows

```powershell
npm run dist
```

The installer and portable executable are written to `dist/`.

## Project status

This is an independent, unofficial client. Hablix and Discord are trademarks of their respective owners.
