
# Web Build & Deployment Instructions

## 🚨 Issue: Template HTML Being Served

If your GitHub Pages deployment is showing `%WEB_TITLE%` or other template placeholders, it means the build step is not running correctly or the unbundled template files are being deployed instead of the compiled output.

## ✅ Solution: Clean Web Rebuild

This project now includes a comprehensive clean build script that:

1. **Removes all previous build artifacts** (dist/, .expo cache)
2. **Runs a fresh Expo web export** with production settings
3. **Generates the service worker** for PWA functionality
4. **Copies all PWA files** (.nojekyll, 404.html, manifest.json, icons)
5. **Updates index.html** with routing and service worker scripts
6. **Verifies the build** to ensure no template placeholders remain

## 🛠️ How to Perform a Clean Rebuild

### Option 1: Automated Script (Recommended)

Run the clean build script:

```bash
node scripts/clean-web-build.js
```

This will:
- Clean all previous build artifacts
- Build the web app from scratch
- Verify the output is correct
- Report any issues

### Option 2: Manual Build with Deployment

Run the build and deploy script:

```bash
bash scripts/build-and-deploy-web.sh
```

This will:
- Run the clean build
- Ask if you want to deploy immediately
- Deploy to GitHub Pages if you confirm

### Option 3: Step-by-Step Manual Process

If you prefer to run each step manually:

```bash
# 1. Clean previous builds
rm -rf dist .expo

# 2. Build the web app
npx expo export -p web --output-dir dist

# 3. Generate service worker
npx workbox generateSW workbox-config.js

# 4. Copy PWA files
cp public/.nojekyll dist/
cp public/404.html dist/
cp public/manifest.json dist/

# 5. Deploy to GitHub Pages
npx gh-pages -d dist
```

## 🔍 Verification

After building, verify the output:

```bash
# Check that critical files exist
ls -la dist/index.html dist/404.html dist/.nojekyll dist/manifest.json

# Verify no template placeholders in index.html
grep "%WEB_TITLE%" dist/index.html
# (Should return nothing - if it finds the placeholder, the build failed)

# Check build size
du -sh dist/
# (Should be several MB, not just a few KB)

# Check for JavaScript bundles
ls -la dist/assets/*.js
# (Should show multiple .js files)
```

## 🚀 Automatic Deployment via GitHub Actions

The GitHub Actions workflow (`.github/workflows/deploy-web.yml`) now uses the clean build script automatically.

**To trigger automatic deployment:**

1. Push your changes to the `main` branch:
   ```bash
   git add .
   git commit -m "Trigger clean web rebuild"
   git push origin main
   ```

2. The workflow will:
   - Run the clean build script
   - Verify the output (including checking for template placeholders)
   - Deploy to GitHub Pages if verification passes
   - Fail with clear error messages if issues are detected

3. Check the Actions tab in your GitHub repository to monitor progress

## 📋 GitHub Pages Configuration

Ensure your repository is configured correctly:

1. Go to **Settings** → **Pages**
2. Under **Source**, select **GitHub Actions**
3. Save the settings

The deployment URL will be:
```
https://[your-username].github.io/[repo-name]/
```

## 🐛 Troubleshooting

### Issue: Still seeing `%WEB_TITLE%` after rebuild

**Cause:** The Expo export step may have failed silently, or the wrong files are being deployed.

**Solution:**
1. Delete the `dist/` folder completely: `rm -rf dist`
2. Clear Expo cache: `rm -rf .expo`
3. Run the clean build script again: `node scripts/clean-web-build.js`
4. Check the output for any error messages
5. Verify `dist/index.html` does NOT contain `%WEB_TITLE%`

### Issue: Build succeeds but app doesn't load

**Cause:** JavaScript bundles may not be generated or paths may be incorrect.

**Solution:**
1. Check that `dist/assets/` contains `.js` files
2. Open `dist/index.html` and verify it has `<script>` tags pointing to the bundles
3. Check browser console for 404 errors on script files
4. Ensure `app.config.js` has `web.output: 'static'` and `web.bundler: 'metro'`

### Issue: Routing doesn't work (404 on refresh)

**Cause:** Missing `404.html` or `.nojekyll` files.

**Solution:**
1. Verify `dist/404.html` exists and contains the redirect script
2. Verify `dist/.nojekyll` exists (even if empty)
3. Check that `dist/index.html` has the redirect handler script

### Issue: PWA install doesn't work

**Cause:** Missing `manifest.json`, service worker, or PWA icons.

**Solution:**
1. Verify `dist/manifest.json` exists
2. Verify `dist/sw.js` exists
3. Check that `dist/icon-192.png` and `dist/icon-512.png` exist
4. Open browser DevTools → Application → Manifest to see any errors

## 📊 Build Output Structure

A successful build should have this structure:

```
dist/
├── index.html          ✅ Main HTML (no template placeholders)
├── 404.html            ✅ Client-side routing fallback
├── .nojekyll           ✅ Prevents Jekyll processing
├── manifest.json       ✅ PWA manifest
├── sw.js               ✅ Service worker (optional but recommended)
├── icon-192.png        ✅ PWA icon (192x192)
├── icon-512.png        ✅ PWA icon (512x512)
└── assets/
    ├── *.js            ✅ JavaScript bundles (multiple files)
    ├── *.css           ✅ Stylesheets
    └── *.png/jpg/svg   ✅ Images and other assets
```

## 🎯 Success Criteria

Your build is ready to deploy when:

- ✅ `dist/index.html` exists and does NOT contain `%WEB_TITLE%` or `%PUBLIC_URL%`
- ✅ `dist/404.html` exists with redirect script
- ✅ `dist/.nojekyll` exists
- ✅ `dist/assets/` contains multiple `.js` files
- ✅ Total build size is several MB (not just a few KB)
- ✅ Running `node scripts/clean-web-build.js` completes without errors

## 📞 Need Help?

If you're still experiencing issues after following these steps:

1. Check the GitHub Actions logs for detailed error messages
2. Run the build locally and check for errors: `node scripts/clean-web-build.js`
3. Verify your `app.config.js` has the correct web configuration
4. Ensure all dependencies are installed: `npm ci`

## 🔄 Quick Reference Commands

```bash
# Clean rebuild
node scripts/clean-web-build.js

# Build and deploy interactively
bash scripts/build-and-deploy-web.sh

# Deploy manually (after building)
npx gh-pages -d dist

# Test locally before deploying
npx serve dist -p 3000
# Then visit http://localhost:3000

# Trigger GitHub Actions deployment
git push origin main
```
