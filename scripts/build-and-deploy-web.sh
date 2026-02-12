
#!/usr/bin/env bash

# Clean Web Build and Deploy Script for GitHub Pages
# This script performs a complete clean rebuild and optionally deploys

set -e  # Exit on error

echo "🚀 SmallFarm Copilot - Web Build & Deploy"
echo "=========================================="
echo ""

# Check if we're in the project root
if [ ! -f "package.json" ]; then
  echo "❌ Error: package.json not found!"
  echo "   Please run this script from the project root directory."
  exit 1
fi

# Step 1: Clean build
echo "🧹 Running clean web build..."
node scripts/clean-web-build.js

if [ $? -ne 0 ]; then
  echo ""
  echo "❌ Build failed! Please check the errors above."
  exit 1
fi

echo ""
echo "✅ Build successful!"
echo ""

# Step 2: Ask if user wants to deploy
read -p "📤 Deploy to GitHub Pages now? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "📤 Deploying to GitHub Pages..."
  npx gh-pages -d dist
  
  if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment complete!"
    echo "🌐 Your app should be live in a few minutes at:"
    echo "   https://[your-username].github.io/[repo-name]/"
  else
    echo ""
    echo "❌ Deployment failed!"
    echo "   You may need to configure GitHub Pages in your repository settings."
  fi
else
  echo ""
  echo "ℹ️  Skipping deployment."
  echo "   To deploy later, run: npx gh-pages -d dist"
fi

echo ""
echo "✅ Done!"
