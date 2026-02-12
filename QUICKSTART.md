
# 🚀 Quick Start - Web Deployment

Get your SmallFarm Copilot web app deployed to GitHub Pages in 5 minutes.

## Prerequisites

- ✅ Node.js 20+ installed
- ✅ Git repository on GitHub
- ✅ Dependencies installed (`npm install`)

## Step 1: Generate PWA Icons (2 minutes)

```bash
# Quick placeholder icons (replace with proper icons later)
mkdir -p public
cp assets/images/final_quest_240x240.png public/icon-192.png
cp assets/images/final_quest_240x240.png public/icon-512.png
cp assets/images/final_quest_240x240.png public/favicon.png
```

**Note**: For production, generate proper sized icons. See `scripts/generate-pwa-icons.js` for details.

## Step 2: Enable GitHub Pages (1 minute)

1. Go to your GitHub repository
2. Click **Settings** → **Pages**
3. Under **Source**, select **GitHub Actions**
4. Click **Save**

## Step 3: Deploy (2 minutes)

```bash
# Commit and push
git add .
git commit -m "Configure web export for GitHub Pages"
git push origin main
```

GitHub Actions will automatically build and deploy your app.

## Step 4: Verify Deployment (1 minute)

1. Go to **Actions** tab on GitHub
2. Wait for green checkmark (usually 2-3 minutes)
3. Visit: `https://[your-username].github.io/[repo-name]/`

## ✅ Done!

Your app is now live on GitHub Pages as a Progressive Web App!

## 🧪 Test Locally First (Optional)

```bash
# Build
npm run build:web:github

# Preview
npm run preview:web

# Open http://localhost:3000
```

## 📱 Install as PWA

### Desktop (Chrome/Edge)
1. Visit your GitHub Pages URL
2. Click install icon in address bar
3. App opens in standalone window

### Mobile (iOS)
1. Visit your GitHub Pages URL in Safari
2. Tap Share → Add to Home Screen
3. App opens without browser UI

### Mobile (Android)
1. Visit your GitHub Pages URL in Chrome
2. Tap menu → Install app
3. App opens in standalone mode

## 🔧 Troubleshooting

### Routes return 404 on refresh
**Fix**: Rebuild to ensure 404.html is copied
```bash
npm run build:web:github
```

### PWA not installable
**Fix**: Check icons exist
```bash
ls public/icon-*.png public/favicon.png
```

### API calls failing
**Fix**: Check backend URL in `app.json`
```json
"extra": {
  "backendUrl": "https://your-backend-url.com"
}
```

## 📚 Full Documentation

- **Detailed Guide**: See `WEB_DEPLOYMENT_GUIDE.md`
- **Checklist**: See `DEPLOYMENT_CHECKLIST.md`
- **Icon Generation**: Run `node scripts/generate-pwa-icons.js`

## 🎯 What You Get

✅ **One Codebase, Three Platforms**:
- Native iOS app (via Expo/EAS Build)
- Native Android app (via Expo/EAS Build)
- Web app on GitHub Pages (PWA)

✅ **PWA Features**:
- Installable on desktop and mobile
- Offline support with service worker
- App-like experience without browser UI
- Fast loading with asset caching

✅ **Automatic Deployment**:
- Push to main → Auto-deploy to GitHub Pages
- No manual build steps required
- GitHub Actions handles everything

## 🚀 Next Steps

1. **Replace placeholder icons** with proper sized icons
2. **Test on multiple devices** (desktop, mobile, tablets)
3. **Monitor deployment** in GitHub Actions
4. **Share your app** with users!

---

**Need Help?**
- Check `WEB_DEPLOYMENT_GUIDE.md` for detailed documentation
- Review `DEPLOYMENT_CHECKLIST.md` for complete checklist
- Check GitHub Actions logs for deployment errors
