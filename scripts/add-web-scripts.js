
/* eslint-env node */
const fs = require('fs');
const path = require('path');

console.log('📝 Adding Web Export Scripts to package.json\n');

const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Scripts to add
const newScripts = {
  'build:web:github': 'expo export -p web --output-dir dist && npx workbox generateSW workbox-config.js && cp public/.nojekyll dist/ && cp public/404.html dist/ && cp public/manifest.json dist/',
  'preview:web': 'npx serve dist -p 3000',
  'deploy:github': 'npm run build:web:github && gh-pages -d dist',
  'verify:web': 'node scripts/verify-web-build.js'
};

// Check which scripts are missing
const missingScripts = [];
Object.keys(newScripts).forEach(script => {
  if (!packageJson.scripts[script]) {
    missingScripts.push(script);
  }
});

if (missingScripts.length === 0) {
  console.log('✅ All web export scripts are already present in package.json\n');
  process.exit(0);
}

console.log('📋 Scripts to add:');
missingScripts.forEach(script => {
  console.log(`   - ${script}`);
});

console.log('\n⚠️  Note: package.json is protected in this environment.');
console.log('Please manually add these scripts to your package.json:\n');

console.log('"scripts": {');
Object.keys(packageJson.scripts).forEach(script => {
  console.log(`  "${script}": "${packageJson.scripts[script]}",`);
});
Object.keys(newScripts).forEach((script, index, arr) => {
  const comma = index < arr.length - 1 ? ',' : '';
  console.log(`  "${script}": "${newScripts[script]}"${comma}`);
});
console.log('}');

console.log('\n💡 Or copy these lines to add to your scripts section:\n');
Object.keys(newScripts).forEach(script => {
  console.log(`"${script}": "${newScripts[script]}",`);
});

console.log('\n📚 See QUICKSTART.md for manual setup instructions');
