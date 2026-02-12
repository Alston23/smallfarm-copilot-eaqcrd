
# 📦 Required package.json Scripts

The following scripts need to be added to your `package.json` file to enable the clean web rebuild functionality.

## ⚠️ Current Issue

Your `package.json` currently has:
```json
"scripts": {
  "build:web": "expo export -p web && npx workbox generateSW workbox-config.js",
  ...
}
```

But the GitHub Actions workflow is trying to run:
```bash
npm run build:web:github
npm run verify:web
npm run deploy:web
```

These scripts don't exist, which is why the deployment is failing.

## ✅ Required Scripts

Add these scripts to the `"scripts"` section of your `package.json`:

```json
{
  "scripts": {
    "dev": "EXPO_NO_TELEMETRY=1 expo start --tunnel",
    "android": "EXPO_NO_TELEMETRY=1 expo start --android",
    "ios": "EXPO_NO_TELEMETRY=1 expo start --ios",
    "web": "EXPO_NO_TELEMETRY=1 expo start --web",
    
    "build:web": "expo export -p web && npx workbox generateSW workbox-config.js",
    "build:web:github": "node scripts/clean-web-build.js",
    "build:web:clean": "node scripts/clean-web-build.js",
    
    "preview:web": "npx serve dist -p 3000",
    "test:web": "node scripts/test-build-locally.js",
    "verify:web": "node scripts/verify-web-build.js",
    
    "deploy:web": "npm run build:web:github && gh-pages -d dist",
    "deploy:web:manual": "gh-pages -d dist",
    
    "build:android": "expo prebuild -p android",
    "lint": "eslint ."
  }
}
```

## 📋 Script Descriptions

### Build Scripts
- **`build:web`** - Standard Expo web build (existing)
- **`build:web:github`** - Clean rebuild for GitHub Pages (NEW - required by workflow)
- **`build:web:clean`** - Alias for clean rebuild (NEW)

### Testing Scripts
- **`preview:web`** - Start local server to test the build (NEW)
- **`test:web`** - Test build locally with verification (NEW)
- **`verify:web`** - Verify build output is correct (NEW - required by workflow)

### Deployment Scripts
- **`deploy:web`** - Build and deploy to GitHub Pages (NEW)
- **`deploy:web:manual`** - Deploy existing build without rebuilding (NEW)

## 🔧 How to Add These Scripts

### Option 1: Manual Edit

1. Open `package.json` in your editor
2. Find the `"scripts"` section
3. Add the new scripts listed above
4. Save the file

### Option 2: Use npm set-script (if available)

```bash
npm set-script build:web:github "node scripts/clean-web-build.js"
npm set-script verify:web "node scripts/verify-web-build.js"
npm set-script deploy:web "npm run build:web:github && gh-pages -d dist"
npm set-script preview:web "npx serve dist -p 3000"
npm set-script test:web "node scripts/test-build-locally.js"
```

## ✅ Verify Scripts Were Added

After adding the scripts, verify they work:

```bash
# Test the clean build script
npm run build:web:github

# Test the verification script
npm run verify:web

# Test local preview
npm run preview:web
```

## 🚀 Usage After Adding Scripts

Once the scripts are added, you can use them like this:

```bash
# Clean rebuild
npm run build:web:github

# Verify the build
npm run verify:web

# Test locally
npm run test:web

# Deploy to GitHub Pages
npm run deploy:web

# Or just deploy existing build
npm run deploy:web:manual
```

## 🎯 Priority Scripts

If you only want to add the minimum required scripts for GitHub Actions to work:

```json
{
  "scripts": {
    "build:web:github": "node scripts/clean-web-build.js",
    "verify:web": "node scripts/verify-web-build.js"
  }
}
```

These two scripts are **required** for the GitHub Actions workflow to function.

## 📝 Complete Example

Here's what your complete `scripts` section should look like:

```json
{
  "name": "smallfarm-copilot-eaqcrd",
  "version": "1.0.0",
  "main": "index.ts",
  "scripts": {
    "dev": "EXPO_NO_TELEMETRY=1 expo start --tunnel",
    "android": "EXPO_NO_TELEMETRY=1 expo start --android",
    "ios": "EXPO_NO_TELEMETRY=1 expo start --ios",
    "web": "EXPO_NO_TELEMETRY=1 expo start --web",
    "build:web": "expo export -p web && npx workbox generateSW workbox-config.js",
    "build:web:github": "node scripts/clean-web-build.js",
    "build:web:clean": "node scripts/clean-web-build.js",
    "preview:web": "npx serve dist -p 3000",
    "test:web": "node scripts/test-build-locally.js",
    "verify:web": "node scripts/verify-web-build.js",
    "deploy:web": "npm run build:web:github && gh-pages -d dist",
    "deploy:web:manual": "gh-pages -d dist",
    "build:android": "expo prebuild -p android",
    "lint": "eslint ."
  },
  "dependencies": {
    ...
  }
}
```

## ✅ Next Steps

After adding these scripts:

1. **Test locally:**
   ```bash
   npm run build:web:github
   npm run verify:web
   ```

2. **Deploy:**
   ```bash
   npm run deploy:web
   ```
   
   OR push to GitHub for automatic deployment:
   ```bash
   git add package.json
   git commit -m "Add web build scripts"
   git push origin main
   ```

3. **Verify deployment:**
   - Visit your GitHub Pages URL
   - Check that the app loads (no `%WEB_TITLE%` placeholders)
   - Test navigation and functionality
