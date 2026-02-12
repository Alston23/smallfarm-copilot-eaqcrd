
/* eslint-env node */
const fs = require('fs');
const path = require('path');

console.log('📦 Post-build processing for GitHub Pages...');

const distDir = path.resolve(__dirname, '..', 'dist');

// 1. Copy 404.html for client-side routing
console.log('✅ Copying 404.html for client-side routing...');
const notFoundSource = path.resolve(__dirname, '..', 'public', '404.html');
const notFoundDest = path.join(distDir, '404.html');
if (fs.existsSync(notFoundSource)) {
  fs.copyFileSync(notFoundSource, notFoundDest);
  console.log('   ✓ 404.html copied');
} else {
  console.warn('   ⚠️  404.html not found in public folder');
}

// 2. Create .nojekyll to prevent Jekyll processing
console.log('✅ Creating .nojekyll file...');
const nojekyllPath = path.join(distDir, '.nojekyll');
fs.writeFileSync(nojekyllPath, '');
console.log('   ✓ .nojekyll created');

// 3. Update manifest.json with correct paths
console.log('✅ Updating manifest.json...');
const manifestPath = path.join(distDir, 'manifest.json');
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  
  // Update start_url to work with GitHub Pages
  manifest.start_url = './';
  manifest.scope = './';
  
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('   ✓ manifest.json updated');
} else {
  console.warn('   ⚠️  manifest.json not found');
}

// 4. Update index.html to handle client-side routing and register service worker
console.log('✅ Updating index.html for client-side routing...');
const indexPath = path.join(distDir, 'index.html');
if (fs.existsSync(indexPath)) {
  let indexHtml = fs.readFileSync(indexPath, 'utf8');
  
  // Add redirect handler script before closing head tag
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
  </script>
  `;
  
  if (!indexHtml.includes('GitHub Pages SPA redirect handler')) {
    indexHtml = indexHtml.replace('</head>', redirectScript + '</head>');
    console.log('   ✓ index.html updated with redirect handler');
  } else {
    console.log('   ✓ index.html already has redirect handler');
  }
  
  // Add service worker registration before closing body tag
  const swRegistrationScript = `
  <script>
    // Service Worker Registration for PWA
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function() {
        navigator.serviceWorker.register('./sw.js')
          .then(function(registration) {
            console.log('Service Worker registered:', registration.scope);
          })
          .catch(function(error) {
            console.warn('Service Worker registration failed:', error);
          });
      });
    }
  </script>
  `;
  
  if (!indexHtml.includes('Service Worker Registration for PWA')) {
    indexHtml = indexHtml.replace('</body>', swRegistrationScript + '</body>');
    console.log('   ✓ Service worker registration added');
  } else {
    console.log('   ✓ Service worker registration already present');
  }
  
  fs.writeFileSync(indexPath, indexHtml);
} else {
  console.error('   ❌ index.html not found!');
  process.exit(1);
}

// 5. Create CNAME file if custom domain is configured
const customDomain = process.env.CUSTOM_DOMAIN;
if (customDomain) {
  console.log(`✅ Creating CNAME file for custom domain: ${customDomain}`);
  const cnamePath = path.join(distDir, 'CNAME');
  fs.writeFileSync(cnamePath, customDomain);
  console.log('   ✓ CNAME created');
}

// 6. Copy PWA icons if they exist
console.log('✅ Checking for PWA icons...');
const iconSizes = ['192', '512'];
iconSizes.forEach(size => {
  const iconName = `icon-${size}.png`;
  const iconSource = path.resolve(__dirname, '..', 'public', iconName);
  const iconDest = path.join(distDir, iconName);
  
  if (fs.existsSync(iconSource)) {
    fs.copyFileSync(iconSource, iconDest);
    console.log(`   ✓ ${iconName} copied`);
  } else {
    console.warn(`   ⚠️  ${iconName} not found - PWA install may not work`);
  }
});

// 7. Verify critical files exist
console.log('\n🔍 Verifying build output...');
const criticalFiles = ['index.html', '404.html', '.nojekyll', 'manifest.json'];
let allFilesExist = true;

criticalFiles.forEach(file => {
  const filePath = path.join(distDir, file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✓ ${file} exists`);
  } else {
    console.error(`   ❌ ${file} missing!`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.error('\n❌ Build verification failed! Some critical files are missing.');
  process.exit(1);
}

console.log('\n✅ Post-build processing complete!');
console.log('📦 Build output ready in dist/ folder');
console.log('\n📋 Next steps:');
console.log('   1. Run "npm run verify:web" to verify the build');
console.log('   2. Run "npm run deploy:web" to deploy to GitHub Pages');
console.log('   3. Or push to GitHub for automatic deployment');
