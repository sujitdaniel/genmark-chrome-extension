# LinkedIn Social Assistant Chrome Extension

AI-powered productivity tools for LinkedIn: profile analyzer, feed classifier, and comment assistant.

## Build & Deploy

1. **Install dependencies:**
   ```sh
   npm install
   ```

2. **Build the extension:**
   ```sh
   npm run build
   ```
   This will output all extension files to the `dist/` folder, with content scripts in `dist/content/`.

3. **Prepare for Chrome Web Store:**
   - Copy `manifest.json` into the `dist/` folder if not already present.
   - Ensure `background.js` and all assets are in `dist/`.
   - Zip the contents of the `dist/` folder (not the folder itself).

4. **Upload to Chrome Web Store:**
   - Go to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
   - Upload your zip file and follow the publishing steps.

## File Structure
- `src/content/` – Content scripts (profile.tsx, feed.tsx, post.tsx)
- `src/popup/` – Popup UI
- `background.js` – Background service worker
- `manifest.json` – Chrome Extension manifest (v3)
- `dist/` – Build output for upload

## Dev Tips
- Use `npm run dev` for local development (with Vite hot reload for popup)
- Content scripts require a full extension reload in Chrome after each build

---

**Questions?** Open an issue or contact the maintainer.
