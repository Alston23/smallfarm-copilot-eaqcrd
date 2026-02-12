
/* eslint-env node */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧪 Testing web build locally...\n');

const distDir = path.resolve(__dirname, '..', 'dist');

// Check if dist exists
if (!fs.existsSync(distDir)) {
  console.error('❌ dist/ directory not found!');
  console.error('   Run "node scripts/clean-web-build.js" first.');
  process.exit(1);
}

console.log('✅ dist/ directory exists\n');

// Check critical files
console.log('📋 Checking critical files...');
const criticalFiles = ['index.html', '404.html', '.nojekyll'];
let allExist = true;

criticalFiles.forEach(file => {
  const filePath = path.join(distDir, file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.error(`   ❌ ${file} missing!`);
    allExist = false;
  }
});

if (!allExist) {
  console.error('\n❌ Some critical files are missing!');
  console.error('   Run "node scripts/clean-web-build.js" to rebuild.');
  process.exit(1);
}

// Check for template placeholders
console.log('\n🔍 Checking for template placeholders...');
const indexPath = path.join(distDir, 'index.html');
const indexContent = fs.readFileSync(indexPath, 'utf8');

const placeholders = ['%WEB_TITLE%', '%PUBLIC_URL%', '%REACT_APP'];
let foundPlaceholders = false;

placeholders.forEach(placeholder => {
  if (indexContent.includes(placeholder)) {
    console.error(`   ❌ Found placeholder: ${placeholder}`);
    foundPlaceholders = true;
  }
});

if (foundPlaceholders) {
  console.error('\n❌ Template placeholders found in index.html!');
  console.error('   The build did not process the HTML correctly.');
  console.error('   Run "node scripts/clean-web-build.js" to rebuild.');
  process.exit(1);
} else {
  console.log('   ✅ No template placeholders found');
}

// Check for JavaScript bundles
console.log('\n📦 Checking for JavaScript bundles...');
const assetsDir = path.join(distDir, 'assets');
if (fs.existsSync(assetsDir)) {
  const files = fs.readdirSync(assetsDir);
  const jsFiles = files.filter(f => f.endsWith('.js'));
  
  if (jsFiles.length > 0) {
    console.log(`   ✅ Found ${jsFiles.length} JavaScript bundle(s)`);
  } else {
    console.error('   ❌ No JavaScript bundles found!');
    console.error('   The build may have failed.');
    process.exit(1);
  }
} else {
  console.error('   ❌ assets/ directory missing!');
  process.exit(1);
}

console.log('\n✅ Build verification passed!\n');

// Start local server
console.log('🚀 Starting local web server...');
console.log('   URL: http://localhost:3000');
console.log('   Press Ctrl+C to stop\n');

try {
  execSync('npx serve dist -p 3000', { stdio: 'inherit' });
} catch (error) {
  if (error.signal !== 'SIGINT') {
    console.error('\n❌ Failed to start server:', error.message);
    process.exit(1);
  }
}
