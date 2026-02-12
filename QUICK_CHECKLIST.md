
# ✅ Web Export Quick Checklist

Print this or keep it open while setting up web export.

## Before You Start

- [ ] Node.js 20+ installed
- [ ] Git repository on GitHub
- [ ] Dependencies installed (`npm install`)
- [ ] App works locally (`npm run web`)

## Setup Steps

### 1. Add NPM Scripts ⏱️ 2 minutes

Open `package.json` and add to the `"scripts"` section:

```json
"build:web:github": "expo export -p web --output-dir dist && npx workbox generateSW workbox-config.js && cp public/.nojekyll dist/ && cp public/404.html dist/ && cp public/manifest.json dist/",
"preview:web": "npx serve dist -p 3000",
"deploy:github": "npm run build:web:github && gh-pages -d dist",
"verify:web": "node scripts/verify-web-build.js"
```

- [ ] Scripts added to package.json
- [ ] File saved

### 2. Generate PWA Icons ⏱️ 1 minute

Run these commands:

```bash
mkdir -p public
cp assets/images/final_quest_240x240.png public/icon-192.png
cp assets/images/final_quest_240x240.png public/icon-512.png
cp assets/images/final_quest_240x240.png public/favicon.png
```

- [ ] public/ folder created
- [ ] icon-192.png exists
- [ ] icon-512.png exists
- [ ] favicon.png exists

### 3. Enable GitHub Pages ⏱️ 1 minute

1. Go to GitHub repository
2. Click **Settings**
3. Click **Pages** (left sidebar)
4. Under **Source**, select **GitHub Actions**
5. Click **Save**

- [ ] GitHub Pages enabled
- [ ] Source set to "GitHub Actions"

### 4. Verify Setup ⏱️ 1 minute

Run:
```bash
npm run verify:web
```

- [ ] All configuration files exist
- [ ] All PWA icons exist
- [ ] All scripts present
- [ ] Backend URL configured

### 5. Build and Test ⏱️ 3 minutes

```bash
npm run build:web:github
npm run preview:web
```

Open http://localhost:3000 and test:

- [ ] App loads
- [ ] Navigation works
- [ ] Images load
- [ ] No console errors
- [ ] Dark mode works

### 6. Deploy ⏱️ 2 minutes

```bash
git add .
git commit -m "Configure web export for GitHub Pages"
git push origin main
```

- [ ] Changes committed
- [ ] Pushed to main branch
- [ ] GitHub Actions running (check Actions tab)

### 7. Verify Deployment ⏱️ 3 minutes

Wait for GitHub Actions to complete (2-3 minutes), then:

1. Go to **Actions** tab
2. Wait for green checkmark
3. Visit: `https://[username].github.io/[repo-name]/`

- [ ] Deployment succeeded (green checkmark)
- [ ] Site loads at GitHub Pages URL
- [ ] All routes work (test a few)
- [ ] Refresh works (no 404s)

### 8. Test PWA Installation ⏱️ 2 minutes

**Desktop (Chrome/Edge):**
- [ ] Install icon appears in address bar
- [ ] Click to install
- [ ] App opens in standalone window

**Mobile (iOS Safari):**
- [ ] Share → Add to Home Screen
- [ ] App opens without browser UI

**Mobile (Android Chrome):**
- [ ] Menu → Install app
- [ ] App opens in standalone mode

## ✅ Success!

If all checkboxes are checked, you're done! 🎉

Your app is now:
- ✅ Live on GitHub Pages
- ✅ Installable as a PWA
- ✅ Works offline
- ✅ Auto-deploys on push to main

## 🐛 If Something Failed

### Scripts not found
→ Double-check package.json scripts section

### Icons missing
→ Run: `ls public/icon-*.png public/favicon.png`

### Build fails
→ Check: `npm run verify:web`

### 404 on routes
→ Rebuild: `npm run build:web:github`

### Site doesn't load
→ Check GitHub Pages is enabled (Settings → Pages)

### Deployment fails
→ Check GitHub Actions logs (Actions tab)

## 📚 Need More Help?

- **Quick Start**: `QUICKSTART.md`
- **Full Guide**: `WEB_DEPLOYMENT_GUIDE.md`
- **Detailed Checklist**: `DEPLOYMENT_CHECKLIST.md`
- **Setup Instructions**: `SETUP_INSTRUCTIONS.md`

---

**Total Time**: ~15 minutes

**Result**: One codebase → Three platforms (iOS, Android, Web)
