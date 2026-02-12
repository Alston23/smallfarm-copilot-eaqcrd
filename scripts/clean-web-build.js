
/* eslint-env node */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧹 Starting clean web rebuild for GitHub Pages...\n');

const distDir = path.resolve(__dirname, '..', 'dist');
const publicDir = path.resolve(__dirname, '..', 'public');

// Step 1: Clean previous build artifacts
console.log('📁 Step 1: Cleaning previous build artifacts...');
if (fs.existsSync(distDir)) {
  console.log('   Removing existing dist/ directory...');
  fs.rmSync(distDir, { recursive: true, force: true });
  console.log('   ✅ dist/ directory removed');
} else {
  console.log('   ℹ️  No previous dist/ directory found');
}

// Also clean .expo cache
const expoDir = path.resolve(__dirname, '..', '.expo');
if (fs.existsSync(expoDir)) {
  console.log('   Removing .expo cache...');
  fs.rmSync(expoDir, { recursive: true, force: true });
  console.log('   ✅ .expo cache removed');
}

console.log('   ✅ Clean complete\n');

// Step 2: Run Expo web export
console.log('📦 Step 2: Building web app with Expo...');
console.log('   Running: expo export -p web --output-dir dist\n');

try {
  execSync('npx expo export -p web --output-dir dist', {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production',
      EXPO_NO_TELEMETRY: '1'
    }
  });
  console.log('\n   ✅ Expo export complete\n');
} catch (error) {
  console.error('\n   ❌ Expo export failed!');
  console.error('   Error:', error.message);
  process.exit(1);
}

// Step 3: Verify dist directory was created
console.log('🔍 Step 3: Verifying build output...');
if (!fs.existsSync(distDir)) {
  console.error('   ❌ dist/ directory was not created!');
  console.error('   The Expo export may have failed silently.');
  process.exit(1);
}

const distFiles = fs.readdirSync(distDir);
console.log(`   ✅ dist/ directory created with ${distFiles.length} items`);

// Check for index.html
const indexPath = path.join(distDir, 'index.html');
if (!fs.existsSync(indexPath)) {
  console.error('   ❌ index.html not found in dist/!');
  console.error('   The build may have failed.');
  process.exit(1);
}

// Check if index.html contains template placeholders
const indexContent = fs.readFileSync(indexPath, 'utf8');
if (indexContent.includes('%WEB_TITLE%') || indexContent.includes('%PUBLIC_URL%')) {
  console.error('   ❌ index.html contains template placeholders!');
  console.error('   The build step did not process the HTML correctly.');
  console.error('   Found placeholders: %WEB_TITLE%, %PUBLIC_URL%');
  process.exit(1);
}

console.log('   ✅ index.html is properly built (no template placeholders)\n');

// Step 4: Generate service worker with Workbox
console.log('🔧 Step 4: Generating service worker...');
try {
  execSync('npx workbox generateSW workbox-config.js', {
    stdio: 'inherit'
  });
  console.log('   ✅ Service worker generated\n');
} catch (error) {
  console.warn('   ⚠️  Service worker generation failed (non-critical)');
  console.warn('   PWA offline functionality will not work');
  console.warn('   Error:', error.message);
  console.log('');
}

// Step 5: Copy PWA files from public/ to dist/
console.log('📋 Step 5: Copying PWA files...');

// Copy .nojekyll
const nojekyllSource = path.join(publicDir, '.nojekyll');
const nojekyllDest = path.join(distDir, '.nojekyll');
if (fs.existsSync(nojekyllSource)) {
  fs.copyFileSync(nojekyllSource, nojekyllDest);
  console.log('   ✅ .nojekyll copied');
} else {
  // Create it if it doesn't exist
  fs.writeFileSync(nojekyllDest, '');
  console.log('   ✅ .nojekyll created');
}

// Copy 404.html
const notFoundSource = path.join(publicDir, '404.html');
const notFoundDest = path.join(distDir, '404.html');
if (fs.existsSync(notFoundSource)) {
  fs.copyFileSync(notFoundSource, notFoundDest);
  console.log('   ✅ 404.html copied');
} else {
  console.warn('   ⚠️  404.html not found in public/');
  // Create a basic one
  const basic404 = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>SmallFarm Copilot</title>
    <script>
      sessionStorage.redirect = location.href;
    </script>
    <meta http-equiv="refresh" content="0;URL='/'">
  </head>
  <body></body>
</html>`;
  fs.writeFileSync(notFoundDest, basic404);
  console.log('   ✅ 404.html created');
}

// Copy manifest.json
const manifestSource = path.join(publicDir, 'manifest.json');
const manifestDest = path.join(distDir, 'manifest.json');
if (fs.existsSync(manifestSource)) {
  fs.copyFileSync(manifestSource, manifestDest);
  console.log('   ✅ manifest.json copied');
} else {
  console.warn('   ⚠️  manifest.json not found in public/');
}

// Copy PWA icons
const iconSizes = ['192', '512'];
iconSizes.forEach(size => {
  const iconName = `icon-${size}.png`;
  const iconSource = path.join(publicDir, iconName);
  const iconDest = path.join(distDir, iconName);
  
  if (fs.existsSync(iconSource)) {
    fs.copyFileSync(iconSource, iconDest);
    console.log(`   ✅ ${iconName} copied`);
  } else {
    console.warn(`   ⚠️  ${iconName} not found`);
  }
});

console.log('');

// Step 6: Update index.html with redirect handler and service worker registration
console.log('🔧 Step 6: Updating index.html...');
let indexHtml = fs.readFileSync(indexPath, 'utf8');

// Add redirect handler
const redirectScript = `
  <script>
    // GitHub Pages SPA redirect handler
    (function() {
      var redirect = sessionStorage.redirect;
      delete sessionStorage.redirect;
      if (redirect && redirect !== location.href) {
        history.replaceState(null, null, redirect);
      }
    })();
  </script>`;

if (!indexHtml.includes('GitHub Pages SPA redirect handler')) {
  indexHtml = indexHtml.replace('</head>', redirectScript + '\n  </head>');
  console.log('   ✅ Redirect handler added');
} else {
  console.log('   ℹ️  Redirect handler already present');
}

// Add service worker registration
const swScript = `
  <script>
    // Service Worker Registration for PWA
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function() {
        navigator.serviceWorker.register('./sw.js')
          .then(function(reg) { console.log('SW registered:', reg.scope); })
          .catch(function(err) { console.warn('SW registration failed:', err); });
      });
    }
  </script>`;

if (!indexHtml.includes('Service Worker Registration for PWA')) {
  indexHtml = indexHtml.replace('</body>', swScript + '\n  </body>');
  console.log('   ✅ Service worker registration added');
} else {
  console.log('   ℹ️  Service worker registration already present');
}

fs.writeFileSync(indexPath, indexHtml);
console.log('   ✅ index.html updated\n');

// Step 7: Final verification
console.log('✅ Step 7: Final verification...');

const criticalFiles = [
  { name: 'index.html', required: true },
  { name: '404.html', required: true },
  { name: '.nojekyll', required: true },
  { name: 'manifest.json', required: false },
  { name: 'sw.js', required: false }
];

let hasErrors = false;
criticalFiles.forEach(({ name, required }) => {
  const filePath = path.join(distDir, name);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    console.log(`   ✅ ${name} (${stats.size} bytes)`);
  } else if (required) {
    console.error(`   ❌ ${name} MISSING (required)`);
    hasErrors = true;
  } else {
    console.warn(`   ⚠️  ${name} missing (optional)`);
  }
});

// Check for assets directory
const assetsDir = path.join(distDir, 'assets');
if (fs.existsSync(assetsDir)) {
  const assetFiles = fs.readdirSync(assetsDir);
  const jsFiles = assetFiles.filter(f => f.endsWith('.js'));
  console.log(`   ✅ assets/ directory (${assetFiles.length} files, ${jsFiles.length} JS bundles)`);
  
  if (jsFiles.length === 0) {
    console.error('   ❌ No JavaScript bundles found in assets/!');
    hasErrors = true;
  }
} else {
  console.error('   ❌ assets/ directory missing!');
  hasErrors = true;
}

// Calculate total size
function getDirectorySize(dirPath) {
  let totalSize = 0;
  const files = fs.readdirSync(dirPath);
  
  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory()) {
      totalSize += getDirectorySize(filePath);
    } else {
      totalSize += stats.size;
    }
  });
  
  return totalSize;
}

const totalSize = getDirectorySize(distDir);
const sizeMB = (totalSize / (1024 * 1024)).toFixed(2);
console.log(`   📦 Total build size: ${sizeMB} MB`);

if (totalSize < 1024) {
  console.error('   ❌ Build size suspiciously small (< 1 KB)!');
  hasErrors = true;
}

console.log('');

// Final summary
console.log('═'.repeat(60));
if (hasErrors) {
  console.error('❌ BUILD FAILED!');
  console.error('   Critical issues found. Please review the errors above.');
  process.exit(1);
} else {
  console.log('✅ CLEAN WEB BUILD COMPLETE!');
  console.log('');
  console.log('📦 Build output is ready in dist/ folder');
  console.log(`📊 Total size: ${sizeMB} MB`);
  console.log('');
  console.log('📋 Next steps:');
  console.log('   1. Test locally: npm run preview:web');
  console.log('   2. Deploy manually: npm run deploy:web');
  console.log('   3. Or push to GitHub for automatic deployment');
  console.log('');
  console.log('🌐 After deployment, your app will be available at:');
  console.log('   https://[your-username].github.io/[repo-name]/');
}
