
# 🚀 START HERE - Fix Your Web Deployment

Your GitHub Pages is showing `%WEB_TITLE%` instead of your app. Here's how to fix it in **3 simple steps**:

## Step 1: Add Scripts to package.json ⚙️

Open `package.json` and add these two lines to the `"scripts"` section:

```json
"build:web:github": "node scripts/clean-web-build.js",
"verify:web": "node scripts/verify-web-build.js",
```

**Full example:**
```json
"scripts": {
  "dev": "EXPO_NO_TELEMETRY=1 expo start --tunnel",
  "android": "EXPO_NO_TELEMETRY=1 expo start --android",
  "ios": "EXPO_NO_TELEMETRY=1 expo start --ios",
  "web": "EXPO_NO_TELEMETRY=1 expo start --web",
  "build:web": "expo export -p web && npx workbox generateSW workbox-config.js",
  "build:web:github": "node scripts/clean-web-build.js",
  "verify:web": "node scripts/verify-web-build.js",
  "build:android": "expo prebuild -p android",
  "lint": "eslint ."
}
```

## Step 2: Run Clean Rebuild 🔨

Run this command in your terminal:

```bash
node scripts/clean-web-build.js
```

**What this does:**
- Deletes old build files
- Builds your web app from scratch
- Verifies no template placeholders remain
- Prepares everything for deployment

**Expected output:**
```
✅ CLEAN WEB BUILD COMPLETE!
📦 Build output is ready in dist/ folder
```

## Step 3: Deploy 🚀

**Option A: Automatic (Recommended)**

Push to GitHub:
```bash
git add .
git commit -m "Fix web deployment"
git push origin main
```

Then:
1. Go to your repository on GitHub
2. Click the "Actions" tab
3. Watch the deployment workflow run
4. Wait 2-3 minutes for deployment to complete

**Option B: Manual**

Deploy directly:
```bash
npx gh-pages -d dist
```

## ✅ Verify It Worked

Visit your GitHub Pages URL:
```
https://[your-username].github.io/[repo-name]/
```

**You should see:**
- ✅ Your actual SmallFarm Copilot app
- ✅ No `%WEB_TITLE%` placeholders
- ✅ Working navigation and features

**If you still see placeholders:**
- Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
- Try incognito/private browsing mode

## 🆘 Need More Help?

See these detailed guides:
- **Quick Start:** `REBUILD_NOW.md`
- **Detailed Instructions:** `WEB_BUILD_INSTRUCTIONS.md`
- **Step-by-Step Checklist:** `CLEAN_REBUILD_CHECKLIST.md`
- **Complete Summary:** `DEPLOYMENT_FIX_SUMMARY.md`

## 🎯 That's It!

Three simple steps:
1. ⚙️ Add scripts to package.json
2. 🔨 Run `node scripts/clean-web-build.js`
3. 🚀 Push to GitHub or run `npx gh-pages -d dist`

Your web app will be live and working in just a few minutes! 🎉
