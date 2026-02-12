
# 🚀 GitHub Pages Deployment - Quick Start

## Prerequisites Checklist

Before deploying, ensure:

- [ ] Code is committed to Git
- [ ] GitHub repository exists
- [ ] `npm install` completed successfully
- [ ] Backend API is accessible

## Deployment Steps

### 1️⃣ Enable GitHub Pages

1. Go to your GitHub repository
2. Click **Settings** → **Pages**
3. Under **Source**, select **GitHub Actions**
4. Click **Save**

### 2️⃣ Deploy

**Option A: Automatic (Recommended)**
```bash
git add .
git commit -m "Deploy to GitHub Pages"
git push origin main
```

**Option B: Manual**
```bash
npm run deploy:web
```

### 3️⃣ Verify Deployment

1. Go to **Actions** tab in GitHub
2. Wait for "Deploy Web App to GitHub Pages" to complete (green checkmark)
3. Visit: `https://[your-username].github.io/[repo-name]/`

## 🎯 Your App URL

After deployment, your app will be available at:

```
https://[your-username].github.io/[repo-name]/
```

Replace:
- `[your-username]` with your GitHub username
- `[repo-name]` with your repository name

## ✅ Post-Deployment Checklist

Test these features on the live site:

- [ ] App loads without errors
- [ ] Navigation works (click around, refresh pages)
- [ ] Login/authentication works
- [ ] Backend API calls work
- [ ] Images and assets load
- [ ] PWA install prompt appears (desktop/mobile)
- [ ] Service worker registers (check DevTools)

## 🐛 Quick Troubleshooting

**App shows 404 error:**
- Wait 2-3 minutes for GitHub Pages to propagate
- Check Settings → Pages shows "Your site is live"
- Verify GitHub Actions workflow completed successfully

**Blank white screen:**
- Open browser DevTools (F12) → Console tab
- Look for error messages
- Check Network tab for failed requests

**Authentication doesn't work:**
- Verify backend URL is correct
- Check browser console for CORS errors
- Ensure backend is accessible from browser

**Assets not loading:**
- Check browser console for 404 errors
- Verify build completed successfully
- Run `npm run verify:web` locally

## 📞 Need Help?

1. Check `GITHUB_PAGES_DEPLOYMENT.md` for detailed guide
2. Review GitHub Actions logs for errors
3. Run `npm run verify:web` to check build
4. Check browser console for runtime errors

## 🎉 Success!

Once deployed, your SmallFarm Copilot app is:
- ✅ Live on the web
- ✅ Installable as a PWA
- ✅ Automatically deployed on every push
- ✅ Accessible from any device

**Share your app:** `https://[your-username].github.io/[repo-name]/`
