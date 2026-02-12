
#!/usr/bin/env node
/* eslint-env node */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const DIST_DIR = path.resolve(__dirname, '..', 'dist');

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
};

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  let filePath = path.join(DIST_DIR, req.url === '/' ? 'index.html' : req.url);

  // Handle client-side routing - serve index.html for non-file requests
  if (!path.extname(filePath) && !fs.existsSync(filePath)) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  const extname = path.extname(filePath);
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        // File not found - serve index.html for client-side routing
        fs.readFile(path.join(DIST_DIR, 'index.html'), (err, indexContent) => {
          if (err) {
            res.writeHead(500);
            res.end('Error loading index.html');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(indexContent, 'utf-8');
          }
        });
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${error.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

if (!fs.existsSync(DIST_DIR)) {
  console.error('❌ Error: dist/ folder not found!');
  console.log('📦 Please run: npm run build:web');
  process.exit(1);
}

server.listen(PORT, () => {
  console.log('🚀 Web app server running!');
  console.log(`📱 Open: http://localhost:${PORT}`);
  console.log('');
  console.log('✅ Testing the production build locally');
  console.log('🔄 Client-side routing enabled');
  console.log('📦 Serving from: dist/');
  console.log('');
  console.log('Press Ctrl+C to stop');
});
