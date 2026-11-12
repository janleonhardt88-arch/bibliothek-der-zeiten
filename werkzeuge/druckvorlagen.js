// Baut alle Druckvorlagen in eine Datei: node werkzeuge/druckvorlagen.js
// Ergebnis: druck/druckvorlagen.html. Daraus macht Chrome das PDF (siehe druck/LIESMICH.md).
// Die Charakterbögen kommen aus data/helden.json und data/regeln.json, alles andere aus assets/quelle/.
const fs = require('fs');
const path = require('path');

const WURZEL = path.join(__dirname, '..');
const lies = p => fs.readFileSync(path.join(WURZEL, p), 'utf8');
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const helden = JSON.parse(lies('data/helden.json')).helden;
const regeln = JSON.parse(lies('data/regeln.json'));
const EIGENSCHAFTEN = ['Kraft', 'Geschick', 'Köpfchen', 'Herz'];

const HERZ = (leer, gestrichelt) => `<svg width="34" height="34" viewBox="0 0 40 40"><path d="M20 34 C8 25 4 18 7 12 C10 6 17 7 20 13 C23 7 30 6 33 12 C36 18 32 25 20 34 Z" fill="${leer ? 'none' : '#E58AA8'}" stroke="#A8322C" stroke-width="2.5" ${gestrichelt ? 'stroke-dasharray="4 3"' : ''} stroke-linejoin="round"/></svg>`;
const STERN = `<svg width="34" height="34" viewBox="0 0 40 40"><path d="M20 5 L24.5 15 L35 16 L27 23 L29.5 34 L20 28.5 L10.5 34 L13 23 L5 16 L15.5 15 Z" fill="none" stroke="#A86A1E" stroke-width="2.5" stroke-linejoin="round"/></svg>`;

function charakterbogen(held) {
  const name = held?.name || '';
  const spieler = held ? held.spieler.split(' ')[0] : '';
  const wer = held?.wer || '';
  const zeile = (wert, platz) => wert ? `<span class="wert">${esc(wert)}</span>` : `<span class="linie" style="min-width:${platz}px"></span>`;
  const reihen = EIGENSCHAFTEN.map(e => {
    const punkte = held?.eigenschaften?.[e] || 0;
    return `<tr><td><b>${e}</b><small>${esc(regeln.eigenschaften[e])}</small></td>
      <td class="punkte">${punkte || ''}</td>
      <td class="kaestchen">${Array.from({ length: 5 }, (_, i) => `<span class="${i < punkte ? 'an' : ''}"></span>`).join('')}</td></tr>`;
  }).join('');
  const stempel = Array.from({ length: 6 }, (_, i) => `<div class="stempelfeld${(i + 1) % 3 === 0 ? ' auf' : ''}"><span>${i + 1}</span><small>${(i + 1) % 3 === 0 ? 'Aufstieg!' : ''}</small></div>`).join('');
  return `<section class="seite"><div class="bogen">
  <div class="kopfzeile"><h1>Heldenbogen</h1><p>Bibliothek der Zeiten</p></div>

  <div class="ausweis">
    <div class="ausweis-kopf">Bibliotheksausweis</div>
    <div class="ausweis-innen">
      <div class="felder">
        <p><small>Name</small>${zeile(name, 300)}</p>
        <p><small>Gespielt von</small>${zeile(spieler, 300)}</p>
        <p><small>Wer bin ich?</small>${zeile(wer, 300)}</p>
        ${held ? '' : '<p><span class="linie" style="min-width:380px"></span></p>'}
      </div>
      <div class="bildfeld"><span>Mein Bild<br><small>hier malen</small></span></div>
    </div>
  </div>

  <table class="eigenschaften">
    <tr><th>Eigenschaft</th><th>Punkte</th><th>Würfel <small>(so viele ankreuzen, wie du Punkte hast)</small></th></tr>
    ${reihen}
  </table>

  <div class="zwei">
    <div class="kasten"><h2>Mein Talent <small>+1 Würfel, wenn es passt</small></h2>
      ${held ? `<p class="name">${esc(held.talent.name)}</p><p class="klein">${esc(held.talent.gilt)}</p>` : '<p class="leer"></p><p class="leer"></p>'}
    </div>
    <div class="kasten"><h2>Mein Zaubergegenstand <small>1× pro Abenteuer</small></h2>
      ${held ? `<p class="name">${esc(held.zaubergegenstand.name)}</p><p class="klein">${esc(held.zaubergegenstand.regel)}</p>` : '<p class="leer"></p><p class="leer"></p>'}
      <p class="benutzt"><span class="kreis"></span> benutzt</p>
    </div>
  </div>

  <div class="zwei">
    <div class="kasten reihe"><h2>Herzen <small>verloren? ausmalen</small></h2>
      <div>${[0, 1, 2, 3, 4].map(() => HERZ(true)).join('')}${HERZ(true, true)}${HERZ(true, true)}</div>
      <p class="klein">Start: 5 Herzen. Die gestrichelten gibt es beim Aufstieg.</p>
    </div>
    <div class="kasten reihe"><h2>Glückssterne <small>je +2 Würfel</small></h2>
      <div>${Array.from({ length: 5 }, () => STERN).join('')}</div>
      <p class="klein">Für jedes gelöste Rätsel. Darf verschenkt werden.</p>
    </div>
  </div>

  <div class="zwei unten">
    <div class="kasten"><h2>Rucksack</h2>${'<p class="leer"></p>'.repeat(3)}</div>
    <div class="kasten"><h2>Stempel <small>einer pro Abenteuer</small></h2><div class="stempelreihe">${stempel}</div></div>
  </div>

  <p class="fussnote">Würfeln: so viele W6 wie Punkte, der höchste zählt. Ab 4 klappt es, bei Schwerem ab 5, jede 6 ist ein Volltreffer.</p>
</div></section>`;
}

// Inhalt einer Canvas-Datei aus assets/quelle/ ohne die Hilfs-Tags.
function quelle(datei) {
  let html = lies(`assets/quelle/${datei}`).match(/<\/helmet>\s*([\s\S]*?)\s*<\/x-dc>/)[1];
  // Spielerkarte: die Vorlage enthält eine Karte, die zweimal pro Blatt erscheinen soll.
  html = html.replace(/<sc-for[^>]*>([\s\S]*?)<\/sc-for>/, (_, karte) => karte + karte);
  return html;
}
const seite = (html, quer) => `<section class="seite${quer ? ' quer' : ''}">${html}</section>`;

const seiten = [
  ...helden.map(charakterbogen),
  charakterbogen(null),
  seite(quelle('Spielerkarte.dc.html')),
  seite(quelle('Spielerkarte.dc.html')),
  seite(quelle('Main.dc.html')),
  seite(quelle('Figuren-2.dc.html')),
  seite(quelle('Handout-Roemische-Zahlen.dc.html')),
  seite(quelle('Handout-Hieroglyphen.dc.html')),
  seite(quelle('Karte-Roemerlager.dc.html'), true),
  seite(quelle('Karte-Aegypten.dc.html'), true),
  seite(quelle('Karte-Burg.dc.html'), true)
];

const html = `<!doctype html>
<html lang="de"><head><meta charset="utf-8"><title>Druckvorlagen – Bibliothek der Zeiten</title>
<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600&family=Nunito:wght@400;700&display=swap" rel="stylesheet">
<style>
@page { size: A4 portrait; margin: 0; }
@page quer { size: A4 landscape; margin: 0; }
html, body { margin: 0; padding: 0; }
body { background: #888; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.seite { width: 794px; height: 1123px; overflow: hidden; break-after: page; background: #fff; margin: 0 auto; }
.seite.quer { page: quer; width: 1123px; height: 794px; }
@media screen { .seite { margin: 16px auto; } }

.bogen { width: 794px; height: 1123px; box-sizing: border-box; padding: 30px 44px; background: #F8F2E4; color: #2A2733; font-family: Nunito, sans-serif; display: flex; flex-direction: column; gap: 11px; }
.bogen h1, .bogen h2, .ausweis-kopf { font-family: Fredoka, sans-serif; font-weight: 600; margin: 0; }
.kopfzeile { display: flex; justify-content: space-between; align-items: baseline; }
.kopfzeile h1 { font-size: 32px; }
.kopfzeile p { margin: 0; font-size: 13px; color: #5A5560; }
.ausweis { border: 3px solid #2E7472; border-radius: 18px; background: #FFFDF7; overflow: hidden; }
.ausweis-kopf { background: #2E7472; color: #fff; padding: 8px 18px; font-size: 20px; }
.ausweis-innen { display: flex; gap: 18px; padding: 12px 18px 16px; }
.felder { flex: 1; display: flex; flex-direction: column; gap: 6px; }
.felder p { margin: 0; display: flex; flex-direction: column; }
.felder small { font-size: 12px; color: #5A5560; }
.wert { font-family: Fredoka, sans-serif; font-size: 20px; border-bottom: 2px solid #2A2733; padding-bottom: 2px; min-height: 26px; }
.linie { display: block; border-bottom: 2px solid #2A2733; height: 26px; }
.bildfeld { width: 150px; height: 150px; border: 2px dashed #8A8290; border-radius: 14px; display: grid; place-items: center; text-align: center; color: #8A8290; font-family: Fredoka, sans-serif; font-size: 16px; line-height: 1.2; }
table.eigenschaften { width: 100%; border-collapse: separate; border-spacing: 0; background: #FFFDF7; border: 2px solid #2A2733; border-radius: 14px; overflow: hidden; }
.eigenschaften th { text-align: left; font-size: 12px; color: #5A5560; padding: 7px 12px; border-bottom: 2px solid #2A2733; }
.eigenschaften th small { font-weight: 400; }
.eigenschaften td { padding: 5px 12px; border-bottom: 1px solid #D9CFBA; vertical-align: middle; }
.eigenschaften tr:last-child td { border-bottom: 0; }
.eigenschaften td b { font-family: Fredoka, sans-serif; font-weight: 600; font-size: 19px; display: block; }
.eigenschaften td small { font-size: 12px; color: #5A5560; }
.eigenschaften .punkte { width: 70px; text-align: center; font-family: Fredoka, sans-serif; font-size: 24px; font-weight: 600; }
.kaestchen { white-space: nowrap; }
.kaestchen span { display: inline-block; width: 27px; height: 27px; border: 2px solid #2A2733; border-radius: 6px; margin-right: 6px; vertical-align: middle; position: relative; }
.kaestchen span.an::before, .kaestchen span.an::after { content: ""; position: absolute; left: 11.5px; top: 1.5px; width: 3px; height: 23px; background: #2E7472; border-radius: 2px; transform: rotate(45deg); }
.kaestchen span.an::after { transform: rotate(-45deg); }
.zwei { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.kasten { background: #FFFDF7; border: 2px solid #2A2733; border-radius: 14px; padding: 10px 14px; }
.kasten h2 { font-size: 17px; margin-bottom: 4px; }
.kasten h2 small { font-family: Nunito, sans-serif; font-weight: 400; font-size: 12px; color: #5A5560; margin-left: 4px; }
.kasten .name { font-family: Fredoka, sans-serif; font-size: 18px; margin: 2px 0; }
.kasten .klein, .reihe .klein { font-size: 11.5px; line-height: 1.35; color: #3A3640; margin: 2px 0; }
.kasten .leer { border-bottom: 1.5px solid #8A8290; height: 22px; margin: 0; }
.benutzt { margin: 6px 0 0; font-size: 13px; display: flex; align-items: center; gap: 6px; }
.kreis { width: 16px; height: 16px; border: 2px solid #2A2733; border-radius: 50%; display: inline-block; }
.reihe div { display: flex; gap: 2px; }
.bogen > * { flex-shrink: 0; }
.unten { flex: 1 1 auto; min-height: 0; }
.stempelreihe { display: flex; justify-content: space-between; margin-top: 6px; }
.stempelfeld { display: flex; flex-direction: column; align-items: center; gap: 3px; }
.stempelfeld span { width: 44px; height: 44px; border: 2px dashed #8A8290; border-radius: 50%; display: grid; place-items: center; color: #B9B2A6; font-family: Fredoka, sans-serif; font-size: 15px; }
.stempelfeld.auf span { border: 2.5px solid #E6B84A; }
.stempelfeld small { font-size: 10px; font-weight: 700; color: #A86A1E; height: 13px; }
.fussnote { margin: 0; font-size: 12px; color: #5A5560; text-align: center; }
</style></head>
<body>
${seiten.join('\n')}
</body></html>
`;

const ziel = path.join(WURZEL, 'druck');
fs.mkdirSync(ziel, { recursive: true });
fs.writeFileSync(path.join(ziel, 'druckvorlagen.html'), html, 'utf8');
console.log(`druck/druckvorlagen.html: ${seiten.length} Seiten`);
