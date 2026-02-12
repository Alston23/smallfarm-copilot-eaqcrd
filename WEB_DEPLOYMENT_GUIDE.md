
# Web Deployment Guide - GitHub Pages

This guide explains how to deploy your SmallFarm Copilot app as a static web build to GitHub Pages while keeping iOS and Android as native apps.

## 🎯 Overview

Your app now supports three platforms from a single codebase:
- **iOS**: Native app (via Expo/EAS Build)
- **Android**: Native app (via Expo/EAS Build)
- **Web**: Static PWA hosted on GitHub Pages

## 🚀 Quick Start

### Local Development

```bash
# Run web app locally
npm run web

# Run iOS simulator
npm run ios

# Run Android emulator
npm run android
```

### Build for Web

```bash
# Build static web app
npm run build:web:github

# Preview the build locally
npm run preview:web
```

### Deploy to GitHub Pages

```bash
# Deploy to GitHub Pages (manual)
npm run deploy:github
```

Or push to `main` branch - GitHub Actions will automatically build and deploy.

## 📦 What's Included

### PWA Features
- ✅ **Installable**: Users can install the app on desktop and mobile
- ✅ **Offline Support**: Service worker caches assets for offline use
- ✅ **App-like Experience**: Runs in standalone mode without browser UI
- ✅ **Fast Loading**: Workbox precaching for instant loads

### GitHub Pages Configuration
- ✅ **Client-side Routing**: 404.html redirects to index.html for SPA routing
- ✅ **.nojekyll**: Prevents Jekyll processing of files with underscores
- ✅ **Automatic Deployment**: GitHub Actions workflow on push to main
- ✅ **Custom Domain Support**: Ready for custom domain configuration

## 🔧 Configuration Files

### `app.config.js`
Configures Expo web export with static output and Metro bundler.

### `workbox-config.js`
Configures service worker caching strategies:
- **CacheFirst**: Fonts, images (long-term cache)
- **NetworkFirst**: API calls, general content (network priority)

### `public/manifest.json`
PWA manifest with app metadata, icons, and display settings.

### `public/404.html`
Handles client-side routing on GitHub Pages by redirecting to index.html.

### `.github/workflows/deploy-web.yml`
Automated deployment workflow that builds and deploys on push to main.

## 🌐 GitHub Pages Setup

### 1. Enable GitHub Pages

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Pages**
3. Under **Source**, select **GitHub Actions**
4. Save the settings

### 2. Configure Custom Domain (Optional)

1. In **Settings** → **Pages**, add your custom domain
2. Update `package.json` homepage field:
   ```json
   "homepage": "https://yourdomain.com"
   ```
3. Rebuild and redeploy

### 3. Environment Variables

The backend URL is configured in `app.json`:
```json
"extra": {
  "backendUrl": "https://8zg7gm9pb3edeprgzqzexfwtbq2w637s.app.specular.dev"
}
```

To use a different backend URL for production:
1. Update `app.json` or use environment variables
2. Rebuild the web app

## 📱 Platform-Specific Features

### Web-Only Limitations

Some native features are not available on web:
- **Camera**: Shows alert directing users to mobile app
- **File System**: Export features disabled on web
- **Audio Recording**: Not available on web
- **Native Maps**: react-native-maps not supported on web

### Web Alternatives

The app includes platform detection and web-friendly alternatives:
- **Image Upload**: Uses `<input type="file">` on web
- **Document Picker**: Uses web file picker API
- **Storage**: Uses AsyncStorage (localStorage on web)

## 🔍 Testing

### Local Testing

```bash
# Build the web app
npm run build:web:github

# Serve locally
npm run preview:web

# Open http://localhost:3000
```

### Test Checklist

- [ ] All routes work (no 404s on refresh)
- [ ] PWA is installable (check browser install prompt)
- [ ] Service worker caches assets (check DevTools → Application → Service Workers)
- [ ] Backend API calls work correctly
- [ ] Images and assets load properly
- [ ] Dark mode works
- [ ] Responsive design works on mobile browsers
- [ ] Native-only features show appropriate messages

## 🐛 Troubleshooting

### Routes Return 404 on Refresh

**Solution**: Ensure `404.html` is copied to the dist folder:
```bash
cp public/404.html dist/
```

### Service Worker Not Registering

**Solution**: Check that `sw.js` exists in dist folder:
```bash
npm run build:web:github
ls dist/sw.js
```

### Assets Not Loading

**Solution**: Verify `.nojekyll` file exists:
```bash
touch dist/.nojekyll
```

### PWA Not Installable

**Solution**: Check manifest.json and icons:
- Manifest must be at `/manifest.json`
- Icons must be at `/icon-192.png` and `/icon-512.png`
- HTTPS is required (GitHub Pages provides this)

## 📊 Build Output

After running `npm run build:web:github`, the `dist/` folder contains:

```
dist/
├── index.html          # Main HTML file
├── 404.html            # GitHub Pages SPA redirect
├── manifest.json       # PWA manifest
├── sw.js               # Service worker
├── .nojekyll           # Prevents Jekyll processing
├── _expo/              # Expo assets and bundles
├── assets/             # Static assets (images, fonts)
└── favicon.png         # Favicon
```

## 🚢 Deployment Workflow

### Automatic (Recommended)

1. Push changes to `main` branch
2. GitHub Actions automatically builds and deploys
3. Check deployment status in **Actions** tab
4. Visit your GitHub Pages URL

### Manual

```bash
# Build and deploy in one command
npm run deploy:github
```

This command:
1. Builds the web app with `expo export`
2. Generates service worker with Workbox
3. Copies necessary files (.nojekyll, 404.html, manifest.json)
4. Deploys to GitHub Pages using gh-pages package

## 🔐 Security

- **HTTPS**: GitHub Pages provides free HTTPS
- **CSP**: Consider adding Content Security Policy headers
- **API Keys**: Never commit API keys - use environment variables
- **Backend**: Ensure backend API has proper CORS configuration

## 📈 Performance

### Optimization Tips

1. **Image Optimization**: Use WebP format for images
2. **Code Splitting**: Expo Router automatically splits routes
3. **Caching**: Workbox caches assets for fast subsequent loads
4. **Compression**: GitHub Pages automatically gzips content

### Monitoring

- Use Lighthouse to audit performance
- Check service worker cache hit rate in DevTools
- Monitor bundle size with `expo export --dump-sourcemap`

## 🎨 Customization

### Update App Icons

Replace these files in `assets/images/`:
- `final_quest_240x240.png` (favicon)
- Create `icon-192.png` and `icon-512.png` for PWA

### Update Theme Color

Edit `public/manifest.json`:
```json
{
  "theme_color": "#1F3D1B",
  "background_color": "#1F3D1B"
}
```

### Update App Name

Edit `public/manifest.json`:
```json
{
  "name": "Your App Name",
  "short_name": "Short Name"
}
```

## 📚 Resources

- [Expo Web Documentation](https://docs.expo.dev/workflow/web/)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Workbox Documentation](https://developers.google.com/web/tools/workbox)

## 🆘 Support

If you encounter issues:
1. Check the [Troubleshooting](#-troubleshooting) section
2. Review GitHub Actions logs for deployment errors
3. Test locally with `npm run preview:web`
4. Check browser console for errors

---

**One Codebase, Three Platforms** 🚀
- Native iOS app
- Native Android app  
- Web app on GitHub Pages
