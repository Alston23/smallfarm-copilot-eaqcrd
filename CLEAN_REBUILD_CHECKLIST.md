
# ✅ Clean Web Rebuild Checklist

Use this checklist to perform a clean web rebuild and resolve the `%WEB_TITLE%` template placeholder issue.

## 🧹 Pre-Build Cleanup

- [ ] Delete `dist/` folder: `rm -rf dist`
- [ ] Delete `.expo/` cache: `rm -rf .expo`
- [ ] Ensure you're on the latest code: `git pull origin main`
- [ ] Dependencies are installed: `npm ci`

## 🔨 Build Process

- [ ] Run clean build script: `node scripts/clean-web-build.js`
- [ ] Build completes without errors
- [ ] Script reports "✅ CLEAN WEB BUILD COMPLETE!"

## 🔍 Verification

### Critical Files Exist
- [ ] `dist/index.html` exists
- [ ] `dist/404.html` exists
- [ ] `dist/.nojekyll` exists
- [ ] `dist/manifest.json` exists
- [ ] `dist/assets/` directory exists

### Content Verification
- [ ] `dist/index.html` does NOT contain `%WEB_TITLE%`
- [ ] `dist/index.html` does NOT contain `%PUBLIC_URL%`
- [ ] `dist/index.html` contains `<script>` tags
- [ ] `dist/404.html` contains redirect script
- [ ] `dist/assets/` contains `.js` files (JavaScript bundles)

### Size Check
- [ ] Total build size is > 1 MB (run: `du -sh dist/`)
- [ ] `dist/index.html` is > 1 KB
- [ ] `dist/assets/` contains multiple files

## 🚀 Deployment

### Option A: Automatic (GitHub Actions)
- [ ] Commit changes: `git add . && git commit -m "Clean web rebuild"`
- [ ] Push to GitHub: `git push origin main`
- [ ] Check Actions tab for workflow status
- [ ] Wait for deployment to complete (~2-5 minutes)
- [ ] Visit your GitHub Pages URL

### Option B: Manual (gh-pages)
- [ ] Run: `npx gh-pages -d dist`
- [ ] Wait for deployment to complete (~1-2 minutes)
- [ ] Visit your GitHub Pages URL

## ✅ Post-Deployment Verification

- [ ] Visit your GitHub Pages URL
- [ ] App loads without showing `%WEB_TITLE%`
- [ ] Home page displays correctly
- [ ] Navigation works (click between tabs/pages)
- [ ] Refresh page works (doesn't show 404)
- [ ] Authentication works (if applicable)
- [ ] API calls work (check browser console)
- [ ] PWA install prompt appears (mobile/desktop)

## 🐛 If Issues Persist

### Template Placeholders Still Visible
1. [ ] Check `dist/index.html` locally for placeholders
2. [ ] If placeholders exist locally, the build failed - check error messages
3. [ ] If no placeholders locally but visible online, clear browser cache
4. [ ] Try incognito/private browsing mode

### App Doesn't Load
1. [ ] Open browser DevTools → Console
2. [ ] Check for 404 errors on `.js` files
3. [ ] Verify `dist/assets/` has JavaScript bundles
4. [ ] Check GitHub Pages settings (should be "GitHub Actions")

### Routing Doesn't Work
1. [ ] Verify `dist/404.html` exists
2. [ ] Verify `dist/.nojekyll` exists
3. [ ] Check that `dist/index.html` has redirect handler script

## 📊 Expected Results

After a successful clean rebuild and deployment:

```
✅ Build size: 5-15 MB (typical for Expo web app)
✅ dist/index.html: 2-10 KB (contains actual HTML, not templates)
✅ dist/assets/*.js: Multiple bundles (main, vendor, etc.)
✅ No template placeholders (%WEB_TITLE%, %PUBLIC_URL%)
✅ App loads and functions correctly on GitHub Pages
```

## 🎯 Quick Commands

```bash
# Full clean rebuild
node scripts/clean-web-build.js

# Verify build output
ls -la dist/index.html dist/404.html dist/.nojekyll
grep "%WEB_TITLE%" dist/index.html  # Should return nothing
du -sh dist/  # Should be several MB

# Deploy manually
npx gh-pages -d dist

# Test locally first
npx serve dist -p 3000
```

## ✅ Success!

When you see:
- ✅ No template placeholders in the deployed app
- ✅ App loads and functions correctly
- ✅ Navigation and routing work
- ✅ API calls succeed

Your clean rebuild was successful! 🎉
