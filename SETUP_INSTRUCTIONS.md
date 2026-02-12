
# 🚀 Web Export Setup Instructions

Follow these steps to complete the web export configuration for GitHub Pages.

## ✅ What's Already Done

The following files have been created and configured:

### Configuration Files
- ✅ `app.config.js` - Expo web export configuration
- ✅ `workbox-config.js` - Service worker caching
- ✅ `public/manifest.json` - PWA manifest
- ✅ `public/404.html` - GitHub Pages SPA routing
- ✅ `public/.nojekyll` - Jekyll bypass
- ✅ `.github/workflows/deploy-web.yml` - Deployment workflow
- ✅ `index.html` - PWA-ready HTML

### Documentation
- ✅ `QUICKSTART.md` - 5-minute deployment guide
- ✅ `WEB_DEPLOYMENT_GUIDE.md` - Comprehensive documentation
- ✅ `DEPLOYMENT_CHECKLIST.md` - Step-by-step checklist
- ✅ `WEB_EXPORT_SUMMARY.md` - Configuration overview
- ✅ `README.md` - Updated with web deployment info

### Helper Scripts
- ✅ `scripts/generate-pwa-icons.js` - Icon generation guide
- ✅ `scripts/verify-web-build.js` - Build verification
- ✅ `scripts/setup-web-export.sh` - Automated setup
- ✅ `scripts/add-web-scripts.js` - Script helper

## 📋 What You Need to Do

### Step 1: Add NPM Scripts (Required)

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "build:web:github": "expo export -p web --output-dir dist && npx workbox generateSW workbox-config.js && cp public/.nojekyll dist/ && cp public/404.html dist/ && cp public/manifest.json dist/",
    "preview:web": "npx serve dist -p 3000",
    "deploy:github": "npm run build:web:github && gh-pages -d dist",
    "verify:web": "node scripts/verify-web-build.js"
  }
}
```

**How to add:**
1. Open `package.json`
2. Find the `"scripts"` section
3. Add the four scripts above (keep existing scripts)
4. Save the file

### Step 2: Generate PWA Icons (Required)

Create the required PWA icons:

```bash
# Quick placeholder (replace with proper icons later)
mkdir -p public
cp assets/images/final_quest_240x240.png public/icon-192.png
cp assets/images/final_quest_240x240.png public/icon-512.png
cp assets/images/final_quest_240x240.png public/favicon.png
```

**For production**, generate proper sized icons:
- Use https://realfavicongenerator.net/
- Or run: `node scripts/generate-pwa-icons.js` for instructions

### Step 3: Enable GitHub Pages (Required)

1. Go to your GitHub repository
2. Click **Settings** → **Pages**
3. Under **Source**, select **GitHub Actions**
4. Click **Save**

### Step 4: Verify Setup (Recommended)

```bash
# Check if everything is configured correctly
npm run verify:web
```

This will check:
- Configuration files exist
- PWA icons exist
- Package.json scripts are present
- Dependencies are installed
- Backend URL is configured

### Step 5: Build and Test (Recommended)

```bash
# Build the web app
npm run build:web:github

# Preview locally
npm run preview:web

# Open http://localhost:3000
```

Test checklist:
- [ ] App loads correctly
- [ ] All routes work (no 404s)
- [ ] Navigation works
- [ ] Images load
- [ ] API calls work
- [ ] Dark mode works

### Step 6: Deploy (Final Step)

```bash
# Commit all changes
git add .
git commit -m "Configure web export for GitHub Pages"

# Push to main (triggers automatic deployment)
git push origin main
```

Or deploy manually:
```bash
npm run deploy:github
```

## 🎯 Quick Start (TL;DR)

If you just want to get it working quickly:

```bash
# 1. Add scripts to package.json (see Step 1 above)

# 2. Generate icons
mkdir -p public
cp assets/images/final_quest_240x240.png public/icon-192.png
cp assets/images/final_quest_240x240.png public/icon-512.png
cp assets/images/final_quest_240x240.png public/favicon.png

# 3. Enable GitHub Pages (Settings → Pages → GitHub Actions)

# 4. Deploy
git add .
git commit -m "Configure web export for GitHub Pages"
git push origin main
```

Done! Your app will be live at `https://[username].github.io/[repo-name]/`

## 📚 Documentation

- **Quick Start**: `QUICKSTART.md` - 5-minute guide
- **Full Guide**: `WEB_DEPLOYMENT_GUIDE.md` - Comprehensive docs
- **Checklist**: `DEPLOYMENT_CHECKLIST.md` - Step-by-step
- **Summary**: `WEB_EXPORT_SUMMARY.md` - What's configured

## 🔍 Verification

After deployment, verify:

1. **Site loads**: Visit `https://[username].github.io/[repo-name]/`
2. **Routes work**: Refresh on any route (should not 404)
3. **PWA installable**: Check for install prompt in browser
4. **Service worker**: Check DevTools → Application → Service Workers
5. **Offline**: Disconnect internet, reload (should work)

## 🐛 Troubleshooting

### Scripts not found
**Problem**: `npm run build:web:github` says "script not found"

**Solution**: Add the scripts to package.json (see Step 1)

### Icons missing
**Problem**: PWA not installable or icons show as broken

**Solution**: Generate icons (see Step 2)
```bash
ls public/icon-*.png public/favicon.png
```

### 404 on routes
**Problem**: Refreshing routes returns 404

**Solution**: Ensure 404.html is copied to dist
```bash
npm run build:web:github
ls dist/404.html
```

### GitHub Pages not enabled
**Problem**: Deployment succeeds but site doesn't load

**Solution**: Enable GitHub Pages (see Step 3)

## 🆘 Need Help?

1. **Run verification**: `npm run verify:web`
2. **Check documentation**: See `QUICKSTART.md`
3. **Review checklist**: See `DEPLOYMENT_CHECKLIST.md`
4. **Check logs**: GitHub Actions tab for deployment errors
5. **Test locally**: `npm run preview:web`

## ✅ Success Criteria

Your setup is complete when:

- ✅ All scripts added to package.json
- ✅ PWA icons exist in public/ folder
- ✅ GitHub Pages enabled (Settings → Pages)
- ✅ Build succeeds: `npm run build:web:github`
- ✅ Preview works: `npm run preview:web`
- ✅ Verification passes: `npm run verify:web`
- ✅ Deployment succeeds: GitHub Actions green checkmark
- ✅ Site loads at GitHub Pages URL
- ✅ PWA installable on desktop and mobile

## 🎉 What You Get

After completing these steps, you'll have:

- **Native iOS app** - Full native performance
- **Native Android app** - Full native performance
- **Web app on GitHub Pages** - Free hosting, PWA features
- **Single codebase** - One source for all platforms
- **Automatic deployment** - Push to main = auto-deploy
- **Offline support** - Service worker caching
- **Installable** - Works like a native app

---

**Ready to start?** Follow the steps above or see `QUICKSTART.md` for a streamlined guide.
