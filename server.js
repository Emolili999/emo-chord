const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT) || 3030;
const ROOT = path.resolve(__dirname);
const ALLOWED_DIRS = new Set(['renderer', 'lib', 'assets']);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.vital': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.mid': 'audio/midi',
  '.midi': 'audio/midi'
};

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff'
};

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { ...SECURITY_HEADERS, Allow: 'GET, HEAD' });
    res.end('Method Not Allowed');
    return;
  }

  let urlPath;
  try {
    urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  } catch {
    res.writeHead(400, SECURITY_HEADERS);
    res.end('Bad Request');
    return;
  }

  if (urlPath.includes('\0')) {
    res.writeHead(400, SECURITY_HEADERS);
    res.end('Bad Request');
    return;
  }

  const relPath = urlPath === '/' ? '/renderer/index.html' : urlPath;
  const normalizedRel = relPath.replace(/\\/g, '/').replace(/^\/+/, '');
  const safePath = path.resolve(ROOT, normalizedRel);
  const relative = path.relative(ROOT, safePath);

  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    res.writeHead(403, SECURITY_HEADERS);
    res.end('Forbidden');
    return;
  }

  const segments = relative.split(path.sep);
  if (!ALLOWED_DIRS.has(segments[0]) || segments.some((s) => s.startsWith('.'))) {
    res.writeHead(403, SECURITY_HEADERS);
    res.end('Forbidden');
    return;
  }

  fs.stat(safePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, SECURITY_HEADERS);
      res.end('Not found');
      return;
    }
    const ext = path.extname(safePath).toLowerCase();
    res.writeHead(200, {
      ...SECURITY_HEADERS,
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
      'Content-Length': stat.size
    });
    if (req.method === 'HEAD') {
      res.end();
      return;
    }
    const stream = fs.createReadStream(safePath);
    stream.on('error', () => {
      if (!res.headersSent) {
        res.writeHead(500, SECURITY_HEADERS);
        res.end('Internal Server Error');
      } else {
        res.destroy();
      }
    });
    res.on('close', () => {
      if (!stream.destroyed) {
        stream.destroy();
      }
    });
    stream.pipe(res);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`🎹 Emochord Web Sunucusu hazır: http://127.0.0.1:${PORT}`);
});
