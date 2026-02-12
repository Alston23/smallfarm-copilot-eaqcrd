
#!/bin/bash

# PWA Icon Generation Script
# This script helps you create the required PWA icons from your existing icon

echo "📱 PWA Icon Generator"
echo "===================="
echo ""

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick is not installed."
    echo ""
    echo "To install ImageMagick:"
    echo "  macOS:   brew install imagemagick"
    echo "  Ubuntu:  sudo apt-get install imagemagick"
    echo "  Windows: Download from https://imagemagick.org/script/download.php"
    echo ""
    echo "Or use online tools:"
    echo "  - https://realfavicongenerator.net/"
    echo "  - https://www.pwabuilder.com/imageGenerator"
    exit 1
fi

# Check if source icon exists
if [ ! -f "assets/icon.png" ]; then
    echo "❌ Source icon not found: assets/icon.png"
    echo ""
    echo "Please ensure you have an icon at assets/icon.png"
    exit 1
fi

# Create public directory if it doesn't exist
mkdir -p public

echo "🎨 Generating PWA icons from assets/icon.png..."
echo ""

# Generate 192x192 icon
echo "Creating icon-192.png (192x192)..."
convert assets/icon.png -resize 192x192 public/icon-192.png

# Generate 512x512 icon
echo "Creating icon-512.png (512x512)..."
convert assets/icon.png -resize 512x512 public/icon-512.png

# Generate favicon
echo "Creating favicon.png (32x32)..."
convert assets/icon.png -resize 32x32 public/favicon.png

echo ""
echo "✅ PWA icons generated successfully!"
echo ""
echo "Created files:"
echo "  ✓ public/icon-192.png"
echo "  ✓ public/icon-512.png"
echo "  ✓ public/favicon.png"
echo ""
echo "🚀 You're ready to deploy!"
echo ""
echo "Next steps:"
echo "  1. npm run build:web"
echo "  2. git add ."
echo "  3. git commit -m 'Add PWA icons'"
echo "  4. git push origin main"
