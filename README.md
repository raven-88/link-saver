# 🔒 Link Saver (URL Vault)

[![Package Extension](https://github.com/raven-88/link-saver/actions/workflows/package.yml/badge.svg)](https://github.com/raven-88/link-saver/actions/workflows/package.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Platform](https://img.shields.io/badge/Platform-Brave%20%7C%20Chrome-orange.svg)](#)

A premium, aesthetically pleasing browser extension designed specifically for Brave and Chrome-based browsers. **Link Saver** allows you to easily capture, catalog, and vault URLs with a single click, providing a native-feeling, elegant experience.

---

## ✨ Features

- **⚡ Instant Save**: Capture and vault your current active tab's URL with a single click.
- **🎨 Premium Aesthetic**: A modern, glassmorphic UI built to match a clean and professional dark mode design.
- **📦 Local & Secure**: All saved URLs are kept securely within your local browser storage (`chrome.storage`), respecting your privacy.
- **🔍 Quick Search & Management**: Filter and manage your saved links with a fast, search-focused layout.

---

## 🛠️ Tech Stack

- **Core**: Vanilla HTML5, CSS3, & Modern ES6+ JavaScript.
- **Icons**: [Lucide Icons](https://lucide.dev/) (via a local lightweight bundle).
- **Extension Standard**: Manifest V3 (Chrome & Brave Extension API).

---

## 📂 File Structure

```text
├── .github/                   # GitHub configurations (Workflows & Templates)
│   ├── ISSUE_TEMPLATE/        # Custom issue forms
│   └── workflows/             # CI/CD package-on-release workflows
├── extension/                 # Chrome/Brave extension source files
│   ├── manifest.json          # Extension configuration & MV3 definitions
│   ├── popup.html             # The main extension popup UI
│   ├── popup.css              # Custom styling (premium dark mode/glassmorphism)
│   ├── popup.js               # Extension logic (saving, search, list rendering)
│   ├── background.js          # Background service worker
│   ├── lucide.min.js          # Locally bundled Lucide icons
│   └── *.png                  # Assets and icons
├── LICENSE                    # MIT License open source details
├── CONTRIBUTING.md            # Guidelines for local setup & PR submission
└── SECURITY.md                # Security vulnerability reporting process
```

---

## 🚀 Installation & Setup

1. **Download / Clone** the repository to your local machine.
2. Open your browser and navigate to the extensions page:
   - **Brave**: `brave://extensions/`
   - **Chrome**: `chrome://extensions/`
3. Toggle the **Developer mode** switch in the top right corner.
4. Click on **Load unpacked** in the top left.
5. Select the **`extension`** folder from this project directory.

---

## 🛡️ Permissions Used

- `activeTab`: To retrieve the title and URL of the active tab you wish to save.
- `storage`: To save, persist, and fetch your URLs locally.
- `tabs` & `scripting`: To ensure reliable interaction and communication with browser tabs.

---

## 📄 License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.

