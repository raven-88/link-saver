# Agent Guidelines: URL Vault

## Project Overview
**URL Vault** is a browser extension that lets users save URLs to access later. It uses Manifest V3 and is targeted towards the Brave browser with a high emphasis on aesthetics.

## Key Files
- `manifest.json`: Defines the extension (Manifest V3), permissions (`activeTab`, `storage`), and action (`popup.html`).
- `popup.html`: The main UI for the extension.
- *(Expected)* `popup.js`: Logic to handle saving and displaying URLs using `chrome.storage`.
- *(Expected)* `popup.css`: Styling for the popup, aiming for a premium, native-feeling Brave aesthetic.

## Development Rules
- **Aesthetics First**: The UI should be extremely polished, using modern design principles (glassmorphism, clean typography, dark mode by default or matching system preference).
- **Minimalism**: Only include necessary features for saving and viewing URLs.
- **No External Dependencies**: Try to use vanilla HTML/CSS/JS without unnecessary libraries unless requested.
- **Code Quality**: Keep logic simple, modular, and well-commented. Use modern ES6+ JavaScript.
- update this over any update.