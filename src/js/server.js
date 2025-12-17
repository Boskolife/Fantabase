/* eslint-env node */
import http from 'http';
import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';

const PUBLIC_DIR = __dirname;

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml'
};

function send(res, statusCode, body, headers = {}) {
  res.writeHead(statusCode, {
    'Cache-Control': 'no-store',
    ...headers
  });
  res.end(body);
}

function safeResolve(requestPath) {
  const decodedPath = decodeURIComponent(requestPath.split('?')[0]);
  const normalized = path.posix.normalize(decodedPath).replace(/^\/+/, '');
  const fullPath = path.join(PUBLIC_DIR, normalized);

  // Prevent path traversal outside PUBLIC_DIR
  if (!fullPath.startsWith(PUBLIC_DIR)) {
    return null;
  }

  return fullPath;
}

const server = http.createServer((req, res) => {
  const urlPath = req.url || '/';

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return send(res, 405, 'Method Not Allowed', { 'Content-Type': 'text/plain; charset=utf-8' });
  }

  let filePath;
  if (urlPath === '/' || urlPath.startsWith('/?')) {
    filePath = path.join(PUBLIC_DIR, 'index.html');
  } else {
    filePath = safeResolve(urlPath);
    if (!filePath) {
      return send(res, 400, 'Bad Request', { 'Content-Type': 'text/plain; charset=utf-8' });
    }
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      return send(res, 404, 'Not Found', { 'Content-Type': 'text/plain; charset=utf-8' });
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = CONTENT_TYPES[ext] || 'application/octet-stream';

    if (req.method === 'HEAD') {
      return send(res, 200, '', { 'Content-Type': contentType });
    }

    fs.readFile(filePath, (readErr, data) => {
      if (readErr) {
        return send(res, 500, 'Internal Server Error', { 'Content-Type': 'text/plain; charset=utf-8' });
      }
      return send(res, 200, data, { 'Content-Type': contentType });
    });
  });
});

server.listen(PORT, HOST, () => {
  // eslint-disable-next-line no-console
  console.log(`Demo widget server listening on http://localhost:${PORT}`);
});

