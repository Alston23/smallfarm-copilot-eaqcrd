
# GitHub Pages Deployment Guide

This guide covers deploying your SmallFarm Copilot Expo app to GitHub Pages.

## 🚀 Quick Start

### Option 1: Automatic Deployment (Recommended)

The app is configured to automatically deploy to GitHub Pages when you push to the `main` branch.

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Deploy to GitHub Pages"
   git push origin main
   ```

2. **Enable GitHub Pages in your repository settings:**
   - Go to your repository on GitHub
   - Click **Settings** → **Pages**
   - Under **Source**, select **GitHub Actions**
   - Save the settings

3. **Wait for deployment:**
   - Go to the **Actions** tab in your repository
   - Watch the "Deploy Web App to GitHub Pages" workflow
   - Once complete, your app will be live at: `https://[username].github.io/[repo-name]/`

### Option 2: Manual Deployment

Deploy manually from your local machine:

```bash
# Build, verify, and deploy in one command
npm run deploy:web
```

This will:
1. Build the web app for GitHub Pages
2. Run verification checks
3. Deploy to the `gh-pages` branch
4. Your app will be live at: `https://[username].github.io/[repo-name]/`

## 📋 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run build:web:github` | Build the web app for GitHub Pages |
| `npm run verify:web` | Verify the build output is correct |
| `npm run deploy:web` | Build, verify, and deploy to GitHub Pages |

## 🔧 GitHub Repository Setup

### Required Settings

1. **Enable GitHub Pages:**
   - Repository → Settings → Pages
   - Source: **GitHub Actions** (for automatic deployment)
   - OR Source: **Deploy from a branch** → Branch: `gh-pages` (for manual deployment)

2. **Set Repository Secrets (Optional):**
   - Repository → Settings → Secrets and variables → Actions
   - Add `EXPO_PUBLIC_BACKEND_URL` if you want to override the default backend URL

### Permissions

The GitHub Actions workflow requires these permissions (already configured):
- `contents: read` - Read repository contents
- `pages: write` - Deploy to GitHub Pages
- `id-token: write` - Verify deployment

## 🌐 Custom Domain (Optional)

To use a custom domain:

1. **Add CNAME record in your DNS:**
   ```
   Type: CNAME
   Name: www (or subdomain)
   Value: [username].github.io
   ```

2. **Configure in GitHub:**
   - Repository → Settings → Pages
   - Custom domain: Enter your domain (e.g., `www.yourfarm.com`)
   - Check "Enforce HTTPS"

3. **Update build script:**
   ```bash
   CUSTOM_DOMAIN=www.yourfarm.com npm run build:web:github
   ```

## 🔍 Verification Checklist

After deployment, verify:

- [ ] App loads at `https://[username].github.io/[repo-name]/`
- [ ] Navigation works (no 404 errors when refreshing)
- [ ] PWA installable (check browser install prompt)
- [ ] Service worker registered (check DevTools → Application → Service Workers)
- [ ] Backend API calls work (check Network tab)
- [ ] Authentication works (login/logout)
- [ ] Images and assets load correctly

## 🐛 Troubleshooting

### Build Fails

**Error: "dist/ directory does not exist"**
```bash
# Run the build command first
npm run build:web:github
```

**Error: "No JavaScript bundles found"**
- Check that Expo export completed successfully
- Verify `app.config.js` has `web.output: 'static'`

### Deployment Fails

**Error: "Permission denied"**
- Check GitHub Actions permissions in repository settings
- Ensure `pages: write` permission is enabled

**Error: "404 Not Found after deployment"**
- Verify GitHub Pages is enabled in repository settings
- Check that source is set to "GitHub Actions" or "gh-pages" branch
- Wait a few minutes for DNS propagation

### Routing Issues

**Problem: 404 errors when refreshing on routes**
- Verify `404.html` exists in `dist/` folder
- Check that `.nojekyll` file exists
- Verify redirect handler is in `index.html`

**Problem: Assets not loading**
- Check browser console for CORS errors
- Verify asset paths are relative (not absolute)
- Check that `baseUrl` in `app.config.js` matches your GitHub Pages URL

### PWA Issues

**Problem: App not installable**
- Verify `manifest.json` exists and is valid
- Check that icons are present and correct size
- Ensure HTTPS is enabled (required for PWA)

**Problem: Service worker not registering**
- Check that `sw.js` exists in `dist/` folder
- Verify Workbox configuration in `workbox-config.js`
- Check browser console for service worker errors

## 📊 Build Output Structure

After running `npm run build:web:github`, your `dist/` folder should contain:

```
dist/
├── index.html              # Main HTML file
├── 404.html                # Client-side routing fallback
├── .nojekyll               # Prevents Jekyll processing
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker
├── assets/                 # JavaScript bundles and assets
│   ├── [hash].js
│   ├── [hash].css
│   └── ...
└── [other static files]
```

## 🔐 Environment Variables

The app uses these environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `EXPO_PUBLIC_BACKEND_URL` | Backend API URL | `https://8zg7gm9pb3edeprgzqzexfwtbq2w637s.app.specular.dev` |
| `NODE_ENV` | Build environment | `production` |
| `CUSTOM_DOMAIN` | Custom domain for CNAME | (none) |

Set in GitHub Actions:
- Repository → Settings → Secrets and variables → Actions
- Add as repository secrets

## 📱 Progressive Web App (PWA)

Your app is configured as a PWA with:

- ✅ Web app manifest (`manifest.json`)
- ✅ Service worker for offline support (`sw.js`)
- ✅ Installable on desktop and mobile
- ✅ Caching for improved performance
- ✅ Offline fallback

Users can install the app:
- **Desktop:** Click the install icon in the browser address bar
- **Mobile:** Use "Add to Home Screen" from the browser menu

## 🚦 Deployment Status

Check deployment status:

1. **GitHub Actions:**
   - Repository → Actions tab
   - View workflow runs and logs

2. **GitHub Pages:**
   - Repository → Settings → Pages
   - View deployment status and URL

3. **Manual verification:**
   ```bash
   npm run verify:web
   ```

## 📞 Support

If you encounter issues:

1. Check the [Troubleshooting](#-troubleshooting) section
2. Review GitHub Actions logs for error messages
3. Run `npm run verify:web` to check build output
4. Check browser console for runtime errors

## 🎯 Next Steps

After successful deployment:

1. **Test thoroughly:**
   - Test all features on the live site
   - Verify authentication works
   - Check API calls to backend
   - Test on different devices and browsers

2. **Monitor:**
   - Set up analytics (optional)
   - Monitor error logs
   - Check performance metrics

3. **Iterate:**
   - Make changes locally
   - Push to GitHub
   - Automatic deployment will update the live site

---

**Your app is now live on GitHub Pages! 🎉**

Visit: `https://[username].github.io/[repo-name]/`
