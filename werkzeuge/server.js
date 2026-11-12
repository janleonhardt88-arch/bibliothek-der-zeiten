// Startet die App auf diesem Rechner: node werkzeuge/server.js
// Danach im Browser http://localhost:8080 öffnen.
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const WURZEL = path.join(__dirname, '..');
const PORT = Number(process.env.PORT) || 8080;
const TYPEN = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json', '.md': 'text/markdown; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.flac': 'audio/flac', '.wav': 'audio/wav', '.pdf': 'application/pdf'
};

http.createServer((req, res) => {
  let pfad = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (pfad.endsWith('/')) pfad += 'index.html';
  const datei = path.join(WURZEL, pfad);
  if (!datei.startsWith(WURZEL)) { res.writeHead(403); return res.end(); }
  fs.readFile(datei, (fehler, inhalt) => {
    if (fehler) { res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }); return res.end('Nicht gefunden'); }
    res.writeHead(200, { 'content-type': TYPEN[path.extname(datei).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-cache' });
    res.end(inhalt);
  });
}).listen(PORT, () => {
  console.log(`Bibliothek der Zeiten läuft: http://localhost:${PORT}`);
  for (const netz of Object.values(os.networkInterfaces()).flat()) {
    if (netz && netz.family === 'IPv4' && !netz.internal) console.log(`Im WLAN: http://${netz.address}:${PORT}`);
  }
});
