
# 🚀 Deployment Guide

## Web Deployment to GitHub Pages

### Prerequisites
1. GitHub repository with GitHub Pages enabled
2. Node.js and npm installed locally

### Automatic Deployment (Recommended)

The web app automatically deploys to GitHub Pages when you push to the `main` branch.

#### Setup Steps:

1. **Enable GitHub Pages**
   - Go to your repository on GitHub
   - Navigate to **Settings** → **Pages**
   - Under **Source**, select **GitHub Actions**
   - Save the settings

2. **Push to Main Branch**
   ```bash
   git add .
   git commit -m "Configure web deployment"
   git push origin main
   ```

3. **Monitor Deployment**
   - Go to the **Actions** tab in your repository
   - Watch the "Deploy Web App to GitHub Pages" workflow
   - Once complete, your site will be live at:
     `https://[your-username].github.io/[repository-name]/`

### Manual Deployment

If you prefer to deploy manually:

```bash
# Build the web app
npm run build:web

# Deploy to GitHub Pages
npm run deploy:web
```

This will:
1. Build the static web app to the `dist/` folder
2. Generate the service worker for PWA functionality
3. Deploy the `dist/` folder to the `gh-pages` branch
4. Your site will be live at `https://[your-username].github.io/[repository-name]/`

### Custom Domain (Optional)

To use a custom domain:

1. Add a `CNAME` file to the `public/` folder:
   ```
   yourdomain.com
   ```

2. Configure DNS settings with your domain provider:
   - Add a CNAME record pointing to `[your-username].github.io`
   - Or add A records pointing to GitHub's IP addresses

3. In GitHub repository settings:
   - Go to **Settings** → **Pages**
   - Enter your custom domain
   - Enable "Enforce HTTPS"

### Environment Variables

To use different backend URLs for production:

1. Add secrets to your GitHub repository:
   - Go to **Settings** → **Secrets and variables** → **Actions**
   - Add `EXPO_PUBLIC_BACKEND_URL` with your production backend URL

2. The GitHub Actions workflow will use this during build

### Troubleshooting

#### 404 Errors on Refresh
- ✅ Already handled! The workflow creates a `404.html` that redirects to `index.html`
- This enables client-side routing with Expo Router

#### Assets Not Loading
- Check that `assetBundlePatterns` in `app.json` includes all your assets
- Verify the `public/` folder contains all necessary static files

#### Service Worker Not Registering
- Ensure HTTPS is enabled (GitHub Pages provides this automatically)
- Check browser console for service worker errors
- Clear browser cache and reload

#### Build Fails
- Run `npm run build:web` locally to test
- Check the Actions tab for detailed error logs
- Ensure all dependencies are installed: `npm ci`

## iOS Deployment

### TestFlight (Beta Testing)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure iOS build
eas build:configure

# Build for iOS
eas build --platform ios

# Submit to TestFlight
eas submit --platform ios
```

### App Store

1. Build with EAS: `eas build --platform ios --profile production`
2. Download the `.ipa` file
3. Upload to App Store Connect using Transporter
4. Submit for review

## Android Deployment

### Google Play (Internal Testing)

```bash
# Build for Android
eas build --platform android

# Submit to Google Play
eas submit --platform android
```

### Production Release

1. Build with EAS: `eas build --platform android --profile production`
2. Download the `.aab` file
3. Upload to Google Play Console
4. Create a release and submit for review

## Backend Deployment

Your backend is already deployed at:
```
https://8zg7gm9pb3edeprgzqzexfwtbq2w637s.app.specular.dev
```

To update the backend URL:
1. Edit `app.json` → `extra.backendUrl`
2. Rebuild and redeploy all platforms

## Monitoring

### Web Analytics
Consider adding:
- Google Analytics
- Plausible Analytics
- Vercel Analytics

### Error Tracking
Consider adding:
- Sentry
- Bugsnag
- LogRocket

### Performance Monitoring
- Lighthouse CI for web performance
- Firebase Performance Monitoring for mobile

## Continuous Integration

The GitHub Actions workflow automatically:
- ✅ Installs dependencies
- ✅ Builds the web app
- ✅ Generates service worker
- ✅ Creates routing fallback (404.html)
- ✅ Deploys to GitHub Pages

To customize the workflow, edit `.github/workflows/deploy-web.yml`

## Security

### API Keys
- Never commit API keys to the repository
- Use GitHub Secrets for sensitive values
- Use environment variables for configuration

### HTTPS
- ✅ GitHub Pages provides HTTPS automatically
- ✅ Service workers require HTTPS to function

### Content Security Policy
Consider adding CSP headers for enhanced security (requires custom server or Cloudflare Pages)

## Next Steps

1. ✅ Push to GitHub to trigger automatic deployment
2. 📱 Generate PWA icons (see `scripts/generate-pwa-icons.js`)
3. 🔍 Test the deployed web app on mobile and desktop
4. 📊 Set up analytics and monitoring
5. 🚀 Deploy iOS and Android apps using EAS

## Support

For issues or questions:
- Check the [Expo documentation](https://docs.expo.dev/)
- Review [GitHub Pages documentation](https://docs.github.com/en/pages)
- Check the Actions tab for deployment logs
