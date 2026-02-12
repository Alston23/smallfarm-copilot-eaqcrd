
/* eslint-env node */
const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying web build for GitHub Pages deployment...\n');

const distDir = path.resolve(__dirname, '..', 'dist');
let hasErrors = false;
let hasWarnings = false;

// Check if dist directory exists
if (!fs.existsSync(distDir)) {
  console.error('❌ CRITICAL: dist/ directory does not exist!');
  console.error('   Run "npm run build:web:github" first.');
  process.exit(1);
}

console.log('📁 Checking critical files...');

// Critical files that must exist
const criticalFiles = [
  { name: 'index.html', description: 'Main HTML file' },
  { name: '404.html', description: 'Client-side routing fallback' },
  { name: '.nojekyll', description: 'Prevents Jekyll processing' },
  { name: 'manifest.json', description: 'PWA manifest' }
];

criticalFiles.forEach(({ name, description }) => {
  const filePath = path.join(distDir, name);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    console.log(`   ✅ ${name} (${stats.size} bytes) - ${description}`);
  } else {
    console.error(`   ❌ ${name} - MISSING! ${description}`);
    hasErrors = true;
  }
});

// Check for service worker (optional but recommended)
console.log('\n📱 Checking PWA files...');
const pwaFiles = ['sw.js', 'service-worker.js'];
let swFound = false;
pwaFiles.forEach(name => {
  const filePath = path.join(distDir, name);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    console.log(`   ✅ ${name} (${stats.size} bytes) - Service worker`);
    swFound = true;
  }
});

if (!swFound) {
  console.warn('   ⚠️  No service worker found (sw.js or service-worker.js)');
  console.warn('      PWA offline functionality will not work');
  hasWarnings = true;
}

// Check for assets
console.log('\n🎨 Checking assets...');
const assetsDir = path.join(distDir, 'assets');
if (fs.existsSync(assetsDir)) {
  const assetFiles = fs.readdirSync(assetsDir);
  console.log(`   ✅ assets/ directory exists (${assetFiles.length} files)`);
  
  // Check for JS bundles
  const jsFiles = assetFiles.filter(f => f.endsWith('.js'));
  if (jsFiles.length > 0) {
    console.log(`   ✅ Found ${jsFiles.length} JavaScript bundle(s)`);
  } else {
    console.error('   ❌ No JavaScript bundles found!');
    hasErrors = true;
  }
} else {
  console.error('   ❌ assets/ directory missing!');
  hasErrors = true;
}

// Verify index.html content
console.log('\n📄 Verifying index.html content...');
const indexPath = path.join(distDir, 'index.html');
if (fs.existsSync(indexPath)) {
  const indexContent = fs.readFileSync(indexPath, 'utf8');
  
  // Check for redirect handler
  if (indexContent.includes('GitHub Pages SPA redirect handler') || 
      indexContent.includes('sessionStorage.redirect')) {
    console.log('   ✅ Client-side routing redirect handler present');
  } else {
    console.warn('   ⚠️  Redirect handler not found - routing may not work correctly');
    hasWarnings = true;
  }
  
  // Check for root div
  if (indexContent.includes('id="root"') || indexContent.includes('id=\'root\'')) {
    console.log('   ✅ Root div element present');
  } else {
    console.error('   ❌ Root div element not found!');
    hasErrors = true;
  }
  
  // Check for script tags
  if (indexContent.includes('<script')) {
    console.log('   ✅ Script tags present');
  } else {
    console.error('   ❌ No script tags found!');
    hasErrors = true;
  }
}

// Verify manifest.json content
console.log('\n📱 Verifying manifest.json content...');
const manifestPath = path.join(distDir, 'manifest.json');
if (fs.existsSync(manifestPath)) {
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    if (manifest.name) {
      console.log(`   ✅ App name: "${manifest.name}"`);
    } else {
      console.warn('   ⚠️  No app name in manifest');
      hasWarnings = true;
    }
    
    if (manifest.start_url) {
      console.log(`   ✅ Start URL: "${manifest.start_url}"`);
    } else {
      console.warn('   ⚠️  No start_url in manifest');
      hasWarnings = true;
    }
    
    if (manifest.icons && manifest.icons.length > 0) {
      console.log(`   ✅ ${manifest.icons.length} icon(s) defined`);
    } else {
      console.warn('   ⚠️  No icons defined in manifest');
      hasWarnings = true;
    }
  } catch (error) {
    console.error('   ❌ Invalid JSON in manifest.json!');
    hasErrors = true;
  }
}

// Calculate total build size
console.log('\n📊 Build statistics...');
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
} else if (totalSize > 50 * 1024 * 1024) {
  console.warn(`   ⚠️  Build size is large (${sizeMB} MB) - may affect load times`);
  hasWarnings = true;
}

// Final summary
console.log('\n' + '='.repeat(60));
if (hasErrors) {
  console.error('❌ VERIFICATION FAILED!');
  console.error('   Critical issues found. Please fix before deploying.');
  process.exit(1);
} else if (hasWarnings) {
  console.warn('⚠️  VERIFICATION PASSED WITH WARNINGS');
  console.warn('   Build is deployable but has some issues.');
  console.log('\n✅ You can proceed with deployment, but consider fixing warnings.');
  process.exit(0);
} else {
  console.log('✅ VERIFICATION PASSED!');
  console.log('   Build is ready for GitHub Pages deployment.');
  console.log('\n📤 Next steps:');
  console.log('   1. Run "npm run deploy:web" to deploy manually, OR');
  console.log('   2. Push to GitHub and let GitHub Actions deploy automatically');
  process.exit(0);
}
