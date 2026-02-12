
/* eslint-env node */
const fs = require('fs');
const path = require('path');

console.log('📱 PWA Icon Generation Guide');
console.log('================================\n');

console.log('To create PWA icons for your web app, you need:');
console.log('1. icon-192.png (192x192 pixels)');
console.log('2. icon-512.png (512x512 pixels)');
console.log('3. favicon.png (48x48 or 32x32 pixels)\n');

console.log('You can use the existing icon at:');
console.log('  assets/images/final_quest_240x240.png\n');

console.log('Options to generate icons:\n');

console.log('Option 1: Use an online tool');
console.log('  - Visit: https://realfavicongenerator.net/');
console.log('  - Upload: assets/images/final_quest_240x240.png');
console.log('  - Download the generated icons');
console.log('  - Place them in the public/ folder\n');

console.log('Option 2: Use ImageMagick (if installed)');
console.log('  Run these commands:');
console.log('  $ convert assets/images/final_quest_240x240.png -resize 192x192 public/icon-192.png');
console.log('  $ convert assets/images/final_quest_240x240.png -resize 512x512 public/icon-512.png');
console.log('  $ convert assets/images/final_quest_240x240.png -resize 48x48 public/favicon.png\n');

console.log('Option 3: Use an npm package');
console.log('  $ npx pwa-asset-generator assets/images/final_quest_240x240.png public/ --icon-only\n');

console.log('After generating icons, verify they exist:');
console.log('  $ ls -la public/icon-*.png public/favicon.png\n');

console.log('Then rebuild the web app:');
console.log('  $ npm run build:web:github\n');

// Check if icons already exist
const publicDir = path.join(__dirname, '..', 'public');
const requiredIcons = ['icon-192.png', 'icon-512.png', 'favicon.png'];

console.log('Current icon status:');
requiredIcons.forEach(icon => {
  const iconPath = path.join(publicDir, icon);
  const exists = fs.existsSync(iconPath);
  console.log(`  ${exists ? '✅' : '❌'} ${icon}`);
});

if (!fs.existsSync(publicDir)) {
  console.log('\n📁 Creating public/ directory...');
  fs.mkdirSync(publicDir, { recursive: true });
  console.log('✅ public/ directory created');
}

console.log('\n💡 Tip: For now, you can copy the existing icon as a placeholder:');
console.log('  $ cp assets/images/final_quest_240x240.png public/icon-192.png');
console.log('  $ cp assets/images/final_quest_240x240.png public/icon-512.png');
console.log('  $ cp assets/images/final_quest_240x240.png public/favicon.png');
