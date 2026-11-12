// Offline-Speicher der App. Mit Internet holt die App immer die neuesten Dateien,
// ohne Internet nimmt sie die zuletzt gespeicherten.
const CACHE = 'bdz-v5';
const KERN = [
  './', 'index.html', 'manifest.webmanifest', 'app/app.js', 'app/style.css',
  'app/icons/icon-192.png', 'app/icons/icon-512.png',
  'data/regeln.json', 'data/helden.json', 'data/figuren.json', 'data/sounds.json', 'data/quellen.json', 'data/abenteuer/index.json',
  'docs/spickzettel.md', 'docs/spielerkarte.md'
];

self.addEventListener('install', e => {
  e.waitUntil(vorladen());
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

// Die App schickt bei jedem Start "vorladen". Dann holt der Speicher neue Bilder, Musik und Geräusche nach.
self.addEventListener('message', e => {
  if (e.data === 'vorladen') e.waitUntil(vorladen());
});

// Lädt alles, was ein Spielabend braucht: Kern-Dateien, alle Abenteuer, Bilder, Musik und Geräusche.
// Bilder und Töne, die schon gespeichert sind, werden nicht noch einmal geladen.
async function vorladen() {
  const c = await caches.open(CACHE);
  await Promise.all(KERN.map(u => c.add(u).catch(() => {})));
  try {
    const pfade = new Set();
    sammle(await (await fetch('data/figuren.json')).json(), pfade);
    const sounds = await (await fetch('data/sounds.json')).json();
    (sounds.sounds || []).forEach(g => pfade.add(`assets/sounds/${g.datei}`));
    const index = await (await fetch('data/abenteuer/index.json')).json();
    for (const datei of index.abenteuer) {
      const url = `data/abenteuer/${datei}`;
      const r = await fetch(url);
      if (!r.ok) continue;
      await c.put(url, r.clone());
      sammle(await r.json(), pfade);
    }
    for (const p of pfade) {
      const varianten = /\.(png|jpe?g)$/i.test(p) ? [p, p.replace(/\.[a-z]+$/i, '.svg'), p.replace(/\.[a-z]+$/i, '.html')] : [p];
      for (const v of varianten) {
        if (await c.match(v)) break;
        try { const r = await fetch(v); if (r.ok) { await c.put(v, r); break; } } catch { /* nächste Variante */ }
      }
    }
  } catch { /* offline: der Rest kommt beim nächsten Mal */ }
}

// Sucht Bildpfade (beginnen mit assets/) und Musik ({ datei } unter einem Feld, das auf "musik" endet).
function sammle(wert, pfade, feld = '') {
  if (typeof wert === 'string') { if (wert.startsWith('assets/')) pfade.add(wert); return; }
  if (!wert || typeof wert !== 'object') return;
  if (/musik$/i.test(feld) && typeof wert.datei === 'string') pfade.add(`assets/musik/${wert.datei}`);
  for (const [k, v] of Object.entries(wert)) sammle(v, pfade, k);
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    try {
      const r = await mitZeitlimit(fetch(req, { cache: 'no-cache' }), 4000); // immer beim Server nachfragen, ob es Neues gibt
      if (r.ok && r.status === 200) c.put(req, r.clone());
      return r;
    } catch {
      return (await c.match(req, { ignoreSearch: true })) || new Response('offline', { status: 503 });
    }
  })());
});

function mitZeitlimit(versprechen, ms) {
  return new Promise((ok, fehler) => {
    const t = setTimeout(() => fehler(new Error('zu langsam')), ms);
    versprechen.then(r => { clearTimeout(t); ok(r); }, f => { clearTimeout(t); fehler(f); });
  });
}
