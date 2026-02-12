
# 🚀 Perform Clean Web Rebuild NOW

Your GitHub Pages deployment is currently serving template HTML with `%WEB_TITLE%` placeholders. This means the build step is not running correctly.

## ⚡ Quick Fix (2 minutes)

Run this single command to perform a complete clean rebuild:

```bash
node scripts/clean-web-build.js
```

This will:
1. ✅ Delete all previous build artifacts
2. ✅ Build the web app from scratch
3. ✅ Verify no template placeholders remain
4. ✅ Prepare the output for deployment

## 📤 Deploy After Building

### Option 1: Automatic Deployment (Recommended)

Push to GitHub to trigger automatic deployment:

```bash
git add .
git commit -m "Clean web rebuild - fix template placeholders"
git push origin main
```

The GitHub Actions workflow will:
- Run the clean build automatically
- Verify the output
- Deploy to GitHub Pages
- Report any issues

**Check progress:** Go to your repository → Actions tab

### Option 2: Manual Deployment

Deploy immediately from your local machine:

```bash
npx gh-pages -d dist
```

## 🔍 Verify It Worked

After deployment (wait 2-3 minutes), visit your GitHub Pages URL:

```
https://[your-username].github.io/[repo-name]/
```

**You should see:**
- ✅ Your actual app (not template placeholders)
- ✅ Proper navigation and routing
- ✅ Working authentication and API calls

**If you still see `%WEB_TITLE%`:**
- Clear your browser cache (Ctrl+Shift+R or Cmd+Shift+R)
- Try incognito/private browsing mode
- Check the GitHub Actions logs for errors

## 📋 What Changed

The following files were created/updated to fix the issue:

1. **`scripts/clean-web-build.js`** - Comprehensive clean build script
   - Removes old build artifacts
   - Runs fresh Expo export
   - Copies PWA files
   - Verifies output

2. **`.github/workflows/deploy-web.yml`** - Updated workflow
   - Uses the new clean build script
   - Verifies no template placeholders
   - Fails fast if issues detected

3. **Documentation:**
   - `WEB_BUILD_INSTRUCTIONS.md` - Detailed instructions
   - `CLEAN_REBUILD_CHECKLIST.md` - Step-by-step checklist
   - `REBUILD_NOW.md` - This quick start guide

## 🎯 Expected Output

When the clean build script runs successfully, you'll see:

```
🧹 Starting clean web rebuild for GitHub Pages...

📁 Step 1: Cleaning previous build artifacts...
   ✅ dist/ directory removed
   ✅ .expo cache removed
   ✅ Clean complete

📦 Step 2: Building web app with Expo...
   [Expo build output...]
   ✅ Expo export complete

🔍 Step 3: Verifying build output...
   ✅ dist/ directory created with X items
   ✅ index.html is properly built (no template placeholders)

🔧 Step 4: Generating service worker...
   ✅ Service worker generated

📋 Step 5: Copying PWA files...
   ✅ .nojekyll copied
   ✅ 404.html copied
   ✅ manifest.json copied

🔧 Step 6: Updating index.html...
   ✅ Redirect handler added
   ✅ Service worker registration added
   ✅ index.html updated

✅ Step 7: Final verification...
   ✅ index.html (XXXX bytes)
   ✅ 404.html (XXX bytes)
   ✅ .nojekyll (0 bytes)
   ✅ manifest.json (XXX bytes)
   ✅ assets/ directory (XX files, X JS bundles)
   📦 Total build size: X.XX MB

═══════════════════════════════════════════════════════════
✅ CLEAN WEB BUILD COMPLETE!

📦 Build output is ready in dist/ folder
📊 Total size: X.XX MB

📋 Next steps:
   1. Test locally: npm run preview:web
   2. Deploy manually: npm run deploy:web
   3. Or push to GitHub for automatic deployment
```

## 🆘 Need Help?

If the build fails or you encounter issues:

1. **Check the error messages** - The script provides detailed error output
2. **Review the logs** - GitHub Actions logs show what went wrong
3. **Verify dependencies** - Run `npm ci` to ensure all packages are installed
4. **Check the documentation** - See `WEB_BUILD_INSTRUCTIONS.md` for troubleshooting

## ✅ You're Ready!

Run the command now:

```bash
node scripts/clean-web-build.js
```

Then deploy via GitHub Actions (push to main) or manually (npx gh-pages -d dist).

Your web app will be live and working correctly in just a few minutes! 🎉
