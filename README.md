# Hablix Desktop

A desktop client for [Hablix](https://hablix.org/client) on Windows, macOS, and Linux with automatic Discord Rich Presence.

## Features

- Loads Hablix in a dedicated desktop window and keeps the login session between launches.
- Shows a branded boot splash using the Hablix login-page artwork while the hotel loads.
- Connects automatically to the locally running Discord desktop app through the Hablix RPC application (`1553805351479017632`).
- Displays the registered `hablix-large` artwork asset on every activity.
- Updates the activity for signing in, loading, the exact room being visited (including rooms hosted inside an embedded client frame), browsing the navigator or catalog, checking inventory, chatting with friends, changing outfits, and being away.
- Adds an always-available **User Commands** dropdown to the desktop application menu with Nitro user commands, Gold VIP commands and effects, VIP expressions, room-view commands, and quick-access controls. Command shortcuts prefill the chat box so the user can review and press Enter.
- Adds an **Admin Commands** dropdown with all top-level Hablix moderation tools plus permission-gated room-management commands. The dropdown appears only when the server-authorized moderator toolbar control is present, and Hablix continues to enforce every action permission and confirmation.
- Restricts in-app navigation to `hablix.org`; external links open in the default browser.
- Uses Electron isolation, sandboxing, and a deny-by-default permission policy.
- Checks GitHub Releases automatically, downloads updates in the background, and offers to restart when an update is ready. The Windows portable edition links directly to the new download because a running portable executable cannot replace itself.

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

Install version 1.8.0 or newer once to enable automatic updates. Installed builds also include **Hablix → Check for Updates…** (or the app menu on macOS) for an immediate check.

## Build for macOS

On macOS 11 or newer:

```bash
npm ci
npm run dist:mac
```

This creates a universal DMG and ZIP for both Apple Silicon and Intel Macs in `dist/`. Public releases are currently unsigned and unnotarized, so on first launch use **Control-click → Open** and confirm macOS's prompt. A normal double-click works after the first approval.

## Build for Linux

On an x64 or ARM64 Linux system:

```bash
npm ci
npm run dist:linux
```

This creates an AppImage and a Debian/Ubuntu `.deb` package for the machine's architecture in `dist/`. Make an AppImage executable with `chmod +x` before launching it. Other distributions can use the AppImage without installing a system package.

## Project status

This is an independent, unofficial client. Hablix and Discord are trademarks of their respective owners.
