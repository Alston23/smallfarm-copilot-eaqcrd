
# ✅ Pre-Deployment Checklist

Before deploying to GitHub Pages, verify these items:

## 📋 Required Setup

### Local Environment
- [ ] Node.js 20+ installed
- [ ] npm dependencies installed (`npm install`)
- [ ] Code committed to Git
- [ ] No uncommitted changes

### GitHub Repository
- [ ] Repository exists on GitHub
- [ ] Code pushed to `main` branch
- [ ] Repository is public (or GitHub Pages enabled for private repos)

### Configuration Files
- [ ] `package.json` has deployment scripts
- [ ] `app.config.js` configured for web export
- [ ] `.github/workflows/deploy-web.yml` exists
- [ ] `public/404.html` exists
- [ ] `public/manifest.json` exists
- [ ] `workbox-config.js` exists

## 🧪 Test Locally

Before deploying, test the build locally:

```bash
# Build the web app
npm run build:web:github

# Verify the build
npm run verify:web
```

Expected output:
- ✅ Build completes without errors
- ✅ `dist/` folder created
- ✅ All critical files present
- ✅ Verification passes

## 🔧 GitHub Settings

### Enable GitHub Pages

1. Go to repository on GitHub
2. Click **Settings**
3. Click **Pages** (left sidebar)
4. Under **Source**, select **GitHub Actions**
5. Click **Save**

### Verify Permissions

The workflow needs these permissions (already configured):
- ✅ `contents: read`
- ✅ `pages: write`
- ✅ `id-token: write`

## 🌐 Backend Configuration

### Verify Backend URL

Check that your backend is accessible:

```bash
# Test backend connection
curl https://8zg7gm9pb3edeprgzqzexfwtbq2w637s.app.specular.dev/api/health
```

Expected: Backend responds (not 404 or timeout)

### Set Environment Variables (Optional)

To use a different backend URL:

1. Go to repository **Settings**
2. Click **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `EXPO_PUBLIC_BACKEND_URL`
5. Value: Your backend URL
6. Click **Add secret**

## 📱 PWA Icons (Recommended)

For best PWA experience, add icons:

- [ ] `public/icon-192.png` (192x192 pixels)
- [ ] `public/icon-512.png` (512x512 pixels)

**Note:** Build will work without these, but PWA install may not work properly.

## 🔍 Pre-Deployment Tests

### Build Test
```bash
npm run build:web:github
```
- [ ] Completes without errors
- [ ] Creates `dist/` folder
- [ ] `dist/index.html` exists
- [ ] `dist/assets/` folder has JS files

### Verification Test
```bash
npm run verify:web
```
- [ ] All critical files present
- [ ] No errors reported
- [ ] Build size reasonable (> 1KB, < 50MB)

### Local Preview (Optional)
```bash
# Install a simple HTTP server
npm install -g serve

# Serve the dist folder
serve dist
```
- [ ] App loads in browser
- [ ] Navigation works
- [ ] No console errors

## 🚀 Deployment Checklist

### Before Pushing

- [ ] All changes committed
- [ ] Build tested locally
- [ ] Verification passed
- [ ] Backend URL correct
- [ ] No sensitive data in code

### GitHub Pages Setup

- [ ] GitHub Pages enabled in Settings
- [ ] Source set to "GitHub Actions"
- [ ] Repository is public (or Pages enabled for private)

### Push to Deploy

```bash
git add .
git commit -m "Deploy to GitHub Pages"
git push origin main
```

### Monitor Deployment

- [ ] Go to **Actions** tab
- [ ] Watch workflow run
- [ ] Check for errors
- [ ] Wait for green checkmark

### Verify Live Site

After deployment completes:

- [ ] Visit `https://[username].github.io/[repo-name]/`
- [ ] App loads without errors
- [ ] Navigation works
- [ ] Refresh doesn't show 404
- [ ] Login works
- [ ] Backend API calls work
- [ ] Images load
- [ ] PWA install prompt appears (desktop)

## 🎯 Post-Deployment

### Test All Features

- [ ] Authentication (email + OAuth)
- [ ] Dashboard loads
- [ ] Inventory management
- [ ] Equipment tracking
- [ ] Season planning
- [ ] Weather insights
- [ ] Financial reports
- [ ] Marketplace
- [ ] AI features
- [ ] Field notes with photos

### PWA Installation

**Desktop:**
- [ ] Install button appears in address bar
- [ ] Click to install
- [ ] App opens in standalone window

**Mobile:**
- [ ] Open in mobile browser
- [ ] "Add to Home Screen" option available
- [ ] Install and launch from home screen

### Performance

- [ ] App loads quickly (< 3 seconds)
- [ ] Navigation is smooth
- [ ] No console errors
- [ ] Service worker registers
- [ ] Offline mode works (after first load)

## 📊 Success Criteria

Your deployment is successful when:

- ✅ GitHub Actions workflow completes with green checkmark
- ✅ App is accessible at GitHub Pages URL
- ✅ All features work on live site
- ✅ No console errors in browser
- ✅ PWA is installable
- ✅ Service worker registers
- ✅ Backend API calls work
- ✅ Authentication works

## 🐛 If Something Goes Wrong

### Build Fails
1. Check GitHub Actions logs
2. Run `npm run build:web:github` locally
3. Fix errors and push again

### Deployment Fails
1. Verify GitHub Pages is enabled
2. Check workflow permissions
3. Review Actions logs for errors

### App Doesn't Load
1. Wait 2-3 minutes for propagation
2. Check Settings → Pages for status
3. Open browser DevTools for errors

### Features Don't Work
1. Check browser console for errors
2. Verify backend URL is correct
3. Test API calls in Network tab

## 📞 Resources

- **Quick Start:** `DEPLOYMENT_QUICK_START.md`
- **Full Guide:** `GITHUB_PAGES_DEPLOYMENT.md`
- **Status:** `WEB_DEPLOYMENT_STATUS.md`
- **Complete:** `DEPLOYMENT_COMPLETE.md`

## ✅ Ready to Deploy?

If all items above are checked, you're ready to deploy!

```bash
# Deploy now
git add .
git commit -m "Deploy to GitHub Pages"
git push origin main
```

Then enable GitHub Pages in Settings → Pages → Source: GitHub Actions

**Your app will be live in 2-5 minutes! 🎉**
