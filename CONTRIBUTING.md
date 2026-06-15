# 🤝 Contributing to Link Saver

Thank you for your interest in contributing to **Link Saver**! We want to make contributing to this project as easy and transparent as possible.

---

## 🚀 How to Get Started

### 1. Fork and Clone
1. Fork the repository on GitHub.
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/link-saver.git
   cd link-saver
   ```

### 2. Run Locally (Developer Mode)
Since this is a vanilla browser extension, there are no build steps required to test!
1. Open your browser's extensions page:
   - **Brave**: `brave://extensions/`
   - **Chrome**: `chrome://extensions/`
2. Toggle the **Developer mode** switch in the top right.
3. Click **Load unpacked** in the top left.
4. Select the **`extension`** folder from the repository.

---

## 🎨 Guidelines

### Coding Standards
- **Vanilla Only**: Keep dependency usage to a minimum. Use vanilla HTML, CSS, and modern ES6+ JavaScript.
- **Manifest V3**: All updates must comply with Chrome Extension Manifest V3 specifications.
- **Aesthetic Excellence**: Link Saver prioritizes visual design. Ensure any UI modifications align with the existing glassmorphic, clean, and modern dark mode aesthetic.
- **No Private Keys**: Never check in `.pem` or `.crx` files. They are automatically ignored in `.gitignore`.

### Git Commit Messages
- Use clear and concise commit messages describing the change.
- Format: `[category]: Short explanation` (e.g., `feat: Add export to JSON button` or `fix: Fix search filter casing`).

---

## 📬 Submitting a Pull Request

1. Create a new branch for your feature or bug fix:
   ```bash
   git checkout -b feature/my-new-feature
   ```
2. Make your changes and verify them locally.
3. Commit and push your changes to your fork:
   ```bash
   git push origin feature/my-new-feature
   ```
4. Open a Pull Request on the main repository and fill out the provided template.
