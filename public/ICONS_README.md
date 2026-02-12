
# PWA Icons

For your Progressive Web App to be installable, you need icon files in this folder:

## Required Icons

- `icon-192.png` - 192x192 pixels
- `icon-512.png` - 512x512 pixels

## How to Create Icons

### Option 1: Use Your Existing App Icon

If you have an app icon in `assets/images/`, you can:

1. Open it in an image editor (Photoshop, GIMP, Figma, etc.)
2. Resize to 192x192 and save as `public/icon-192.png`
3. Resize to 512x512 and save as `public/icon-512.png`

### Option 2: Use Online Tools

1. Go to https://realfavicongenerator.net/
2. Upload your logo/icon
3. Download the generated icons
4. Copy the 192x192 and 512x512 versions to this folder

### Option 3: Use Your Expo Icon

If you have an icon configured in `app.json`:

```bash
# Copy and resize your Expo icon
cp assets/images/final_quest_240x240.png public/icon-192.png
cp assets/images/final_quest_240x240.png public/icon-512.png
```

Then resize them to the correct dimensions using an image editor.

## Current Status

The build will work without these icons, but:
- ⚠️ PWA install prompt may not appear
- ⚠️ App icon won't show on home screen after install
- ⚠️ Browser may show warnings about missing icons

## Temporary Solution

The build script will use your existing app icon if these files are missing, but it's recommended to create proper PWA icons for the best user experience.
