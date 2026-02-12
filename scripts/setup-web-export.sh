
#!/bin/bash

echo "🚀 Setting up Web Export for GitHub Pages"
echo "=========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo "❌ Error: package.json not found. Please run this script from the project root."
  exit 1
fi

echo "📦 Step 1: Installing dependencies..."
npm install gh-pages workbox-cli workbox-precaching workbox-webpack-plugin --save

echo ""
echo "📁 Step 2: Creating public directory..."
mkdir -p public

echo ""
echo "🎨 Step 3: Generating placeholder PWA icons..."
if [ -f "assets/images/final_quest_240x240.png" ]; then
  cp assets/images/final_quest_240x240.png public/icon-192.png
  cp assets/images/final_quest_240x240.png public/icon-512.png
  cp assets/images/final_quest_240x240.png public/favicon.png
  echo "✅ Placeholder icons created (replace with proper sized icons later)"
else
  echo "⚠️  Warning: assets/images/final_quest_240x240.png not found"
  echo "   You'll need to manually create PWA icons"
fi

echo ""
echo "🔍 Step 4: Verifying configuration..."
node scripts/verify-web-build.js

echo ""
echo "=========================================="
echo "✅ Web export setup complete!"
echo ""
echo "📚 Next steps:"
echo "   1. Review QUICKSTART.md for deployment instructions"
echo "   2. Enable GitHub Pages (Settings → Pages → GitHub Actions)"
echo "   3. Build: npm run build:web:github"
echo "   4. Preview: npm run preview:web"
echo "   5. Deploy: git push origin main"
echo ""
echo "📖 Full documentation: WEB_DEPLOYMENT_GUIDE.md"
echo "=========================================="
