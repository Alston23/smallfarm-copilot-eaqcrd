
# 🚀 Web Deployment Checklist

Use this checklist to ensure your web app is properly configured for GitHub Pages deployment.

## ✅ Pre-Deployment Checklist

### 1. Configuration Files

- [x] `app.config.js` - Web export configured with static output
- [x] `workbox-config.js` - Service worker caching configured
- [x] `public/manifest.json` - PWA manifest created
- [x] `public/404.html` - GitHub Pages SPA redirect handler
- [x] `public/.nojekyll` - Prevents Jekyll processing
- [x] `.github/workflows/deploy-web.yml` - GitHub Actions workflow
- [x] `package.json` - Build scripts added

### 2. PWA Icons

- [ ] `public/icon-192.png` - 192x192 app icon
- [ ] `public/icon-512.png` - 512x512 app icon
- [ ] `public/favicon.png` - 48x48 favicon

**Action Required**: Generate PWA icons
```bash
# Run the icon generation guide
node scripts/generate-pwa-icons.js

# Quick placeholder (replace with proper icons later)
cp assets/images/final_quest_240x240.png public/icon-192.png
cp assets/images/final_quest_240x240.png public/icon-512.png
cp assets/images/final_quest_240x240.png public/favicon.png
```

### 3. GitHub Repository Settings

- [ ] Repository is public (or GitHub Pages enabled for private repos)
- [ ] GitHub Pages source set to "GitHub Actions"
- [ ] Branch protection rules configured (optional)

**Action Required**: Enable GitHub Pages
1. Go to repository **Settings** → **Pages**
2. Under **Source**, select **GitHub Actions**
3. Save

### 4. Environment Variables

- [x] Backend URL configured in `app.json`
- [ ] Secrets configured in GitHub (if needed)

**Current Backend URL**: `https://8zg7gm9pb3edeprgzqzexfwtbq2w637s.app.specular.dev`

To use a different backend URL:
1. Update `app.json` → `extra.backendUrl`
2. Or add `EXPO_PUBLIC_BACKEND_URL` secret in GitHub

### 5. Platform-Specific Code

- [x] Web platform guards added for native-only APIs
- [x] Image upload handles web file input
- [x] Camera features show web-not-supported alerts
- [x] File system exports disabled on web

## 🧪 Testing Checklist

### Local Testing

```bash
# Build the web app
npm run build:web:github

# Preview locally
npm run preview:web
```

- [ ] App loads at http://localhost:3000
- [ ] All routes work (no 404s)
- [ ] Navigation works correctly
- [ ] Images and assets load
- [ ] API calls work
- [ ] Dark mode works
- [ ] Responsive design works

### PWA Testing

- [ ] Service worker registers successfully
- [ ] App is installable (check browser install prompt)
- [ ] App works offline (after first load)
- [ ] Manifest.json loads correctly
- [ ] Icons display correctly

### Cross-Browser Testing

- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (macOS/iOS)
- [ ] Mobile browsers

## 🚢 Deployment Steps

### Option 1: Automatic Deployment (Recommended)

1. Commit all changes
   ```bash
   git add .
   git commit -m "Configure web export for GitHub Pages"
   git push origin main
   ```

2. Monitor deployment
   - Go to **Actions** tab on GitHub
   - Watch the "Deploy Web App to GitHub Pages" workflow
   - Wait for green checkmark

3. Visit your site
   - URL: `https://[username].github.io/[repo-name]/`
   - Or custom domain if configured

### Option 2: Manual Deployment

```bash
# Build and deploy
npm run deploy:github
```

## 🔍 Post-Deployment Verification

### 1. Check Deployment Status

- [ ] GitHub Actions workflow completed successfully
- [ ] No errors in workflow logs
- [ ] Deployment shows in **Environments** tab

### 2. Test Live Site

- [ ] Site loads at GitHub Pages URL
- [ ] All routes work (test deep links)
- [ ] Refresh works on any route (no 404s)
- [ ] PWA install prompt appears
- [ ] Service worker caches assets
- [ ] Backend API calls work
- [ ] Authentication works (if applicable)

### 3. PWA Installation Test

**Desktop (Chrome/Edge)**:
1. Visit the site
2. Look for install icon in address bar
3. Click to install
4. Verify app opens in standalone window

**Mobile (iOS Safari)**:
1. Visit the site
2. Tap Share button
3. Tap "Add to Home Screen"
4. Verify app opens without browser UI

**Mobile (Android Chrome)**:
1. Visit the site
2. Tap menu (three dots)
3. Tap "Install app" or "Add to Home Screen"
4. Verify app opens in standalone mode

### 4. Performance Check

- [ ] Lighthouse score > 90 (Performance)
- [ ] Lighthouse score > 90 (PWA)
- [ ] First Contentful Paint < 2s
- [ ] Time to Interactive < 3s

Run Lighthouse:
```bash
# In Chrome DevTools
# 1. Open DevTools (F12)
# 2. Go to Lighthouse tab
# 3. Click "Generate report"
```

## 🐛 Troubleshooting

### Issue: 404 on Route Refresh

**Symptom**: Refreshing any route except `/` returns 404

**Solution**: Verify `404.html` exists in dist folder
```bash
ls dist/404.html
# If missing, rebuild:
npm run build:web:github
```

### Issue: Service Worker Not Registering

**Symptom**: Console shows "Service Worker registration failed"

**Solution**: Check service worker file
```bash
ls dist/sw.js
# If missing, check workbox-config.js and rebuild
```

### Issue: PWA Not Installable

**Symptom**: No install prompt appears

**Solution**: Check requirements
- [ ] HTTPS enabled (GitHub Pages provides this)
- [ ] manifest.json exists and loads
- [ ] Icons exist (192x192 and 512x512)
- [ ] Service worker registered
- [ ] No console errors

### Issue: Assets Not Loading

**Symptom**: Images or fonts return 404

**Solution**: Check `.nojekyll` file
```bash
ls dist/.nojekyll
# If missing:
touch dist/.nojekyll
```

### Issue: API Calls Failing

**Symptom**: Backend API returns CORS errors

**Solution**: Verify backend CORS configuration
- Backend must allow requests from GitHub Pages domain
- Check `app.json` backend URL is correct
- Test API endpoint directly in browser

## 📊 Monitoring

### GitHub Actions

- Check **Actions** tab for deployment history
- Review logs for any warnings or errors
- Set up notifications for failed deployments

### Analytics (Optional)

Consider adding:
- Google Analytics
- Plausible Analytics
- Vercel Analytics

### Error Tracking (Optional)

Consider adding:
- Sentry
- LogRocket
- Bugsnag

## 🔄 Updating the Web App

### Regular Updates

1. Make changes to code
2. Test locally: `npm run web`
3. Build: `npm run build:web:github`
4. Preview: `npm run preview:web`
5. Commit and push to `main`
6. GitHub Actions deploys automatically

### Emergency Rollback

If deployment breaks:
1. Go to **Actions** tab
2. Find last successful deployment
3. Click "Re-run jobs"

Or revert commit:
```bash
git revert HEAD
git push origin main
```

## 🎯 Success Criteria

Your web deployment is successful when:

- ✅ Site loads at GitHub Pages URL
- ✅ All routes work without 404s
- ✅ PWA is installable on desktop and mobile
- ✅ Service worker caches assets
- ✅ App works offline (after first load)
- ✅ Backend API calls work correctly
- ✅ Authentication works (if applicable)
- ✅ Lighthouse PWA score > 90
- ✅ No console errors
- ✅ Responsive design works on all devices

## 📚 Next Steps

After successful deployment:

1. **Custom Domain** (Optional)
   - Add CNAME record in DNS
   - Configure in GitHub Pages settings
   - Update `package.json` homepage

2. **Performance Optimization**
   - Optimize images (WebP format)
   - Enable compression
   - Implement lazy loading

3. **SEO** (Optional)
   - Add meta tags
   - Create sitemap.xml
   - Add robots.txt

4. **Analytics**
   - Set up analytics tracking
   - Monitor user behavior
   - Track conversion goals

5. **Monitoring**
   - Set up error tracking
   - Monitor performance
   - Track uptime

---

**Congratulations!** 🎉

You now have a single codebase that runs as:
- Native iOS app
- Native Android app
- Web app on GitHub Pages

For detailed documentation, see `WEB_DEPLOYMENT_GUIDE.md`
