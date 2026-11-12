// Baut alle Druckvorlagen in eine Datei: node werkzeuge/druckvorlagen.js
// Ergebnis: druck/druckvorlagen.html (daraus macht Chrome das PDF, siehe druck/LIESMICH.md)
// und druck/heldenbogen-vorschau.html (nur die Heldenbögen, zum Anschauen auf dem Bildschirm).
// Die Heldenbögen kommen aus data/helden.json und data/regeln.json, alles andere aus assets/quelle/.
const fs = require('fs');
const path = require('path');

const WURZEL = path.join(__dirname, '..');
const lies = p => fs.readFileSync(path.join(WURZEL, p), 'utf8');
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const helden = JSON.parse(lies('data/helden.json')).helden;
const regeln = JSON.parse(lies('data/regeln.json'));
const EIGENSCHAFTEN = ['Kraft', 'Geschick', 'Köpfchen', 'Herz'];

const HERZ = gestrichelt => `<svg width="28" height="28" viewBox="0 0 40 40" aria-hidden="true"><path d="M20 34 C8 25 4 18 7 12 C10 6 17 7 20 13 C23 7 30 6 33 12 C36 18 32 25 20 34 Z" fill="none" stroke="#D23A3F" stroke-width="2.6" ${gestrichelt ? 'stroke-dasharray="4 3"' : ''} stroke-linejoin="round"/></svg>`;
const STERN = `<svg width="28" height="28" viewBox="0 0 40 40" aria-hidden="true"><path d="M20 5 L24.5 15 L35 16 L27 23 L29.5 34 L20 28.5 L10.5 34 L13 23 L5 16 L15.5 15 Z" fill="none" stroke="#C08A1A" stroke-width="2.6" stroke-linejoin="round"/></svg>`;

// Ein Heldenbogen. Vorausgefüllt sind nur „Gespielt von“, die Eigenschaften, Talent und Zaubergegenstand.
// Name, „Wer bin ich?“ und das Bild füllen die Spieler selbst aus.
function heldenbogen(held) {
  const reihen = EIGENSCHAFTEN.map(e => {
    const punkte = held?.eigenschaften?.[e] || 0;
    return `<tr><td><b>${e}</b><small>${esc(regeln.eigenschaften[e])}</small></td>
      <td class="punkte">${punkte || ''}</td>
      <td class="kaestchen">${Array.from({ length: 5 }, (_, i) => `<span class="${i < punkte ? 'an' : ''}"></span>`).join('')}</td></tr>`;
  }).join('');
  const stempel = Array.from({ length: 6 }, (_, i) => `<span class="${(i + 1) % 3 === 0 ? 'auf' : ''}">${i + 1}</span>`).join('');
  return `<div class="bogen">
  <div class="kopfzeile"><h1>Heldenbogen</h1><p>Bibliothek der Zeiten</p></div>

  <div class="oben">
    <div class="links">
      <div class="ausweis">
        <div class="ausweis-kopf">Bibliotheksausweis</div>
        <div class="felder">
          <p><small>Name</small><span class="linie"></span></p>
          <p><small>Gespielt von</small>${held ? `<span class="wert">${esc(held.spieler.split(' ')[0])}</span>` : '<span class="linie"></span>'}</p>
          <p><small>Wer bin ich?</small><span class="linie"></span></p>
        </div>
      </div>
      <div class="kasten zaehler">
        <div class="zeile"><h2>Herzen</h2><div class="symbole">${[0, 1, 2, 3, 4].map(() => HERZ(false)).join('')}${HERZ(true)}${HERZ(true)}</div></div>
        <small>verloren? ausmalen · die gestrichelten gibt es beim Aufstieg</small>
        <div class="zeile"><h2>Glückssterne</h2><div class="symbole">${Array.from({ length: 5 }, () => STERN).join('')}</div></div>
        <small>für jedes gelöste Rätsel · je +2 Würfel</small>
      </div>
    </div>
    <div class="bildfeld"><span>Mein Bild</span></div>
  </div>

  <table class="eigenschaften">
    <tr><th>Eigenschaft</th><th>Punkte</th><th>Würfel <small>(so viele ankreuzen, wie du Punkte hast)</small></th></tr>
    ${reihen}
  </table>

  <div class="zwei">
    <div class="kasten"><h2>Mein Talent <small>+1 Würfel, wenn es passt</small></h2>
      ${held ? `<p class="name">${esc(held.talent.name)}</p><p class="klein">${esc(held.talent.gilt)}</p>` : '<span class="linie"></span><span class="linie"></span>'}
    </div>
    <div class="kasten"><h2>Mein Zaubergegenstand <small>1× pro Abenteuer</small></h2>
      ${held ? `<p class="name">${esc(held.zaubergegenstand.name)}</p><p class="klein">${esc(held.zaubergegenstand.regel)}</p>` : '<span class="linie"></span><span class="linie"></span>'}
      <p class="benutzt"><span class="kreis"></span> benutzt</p>
    </div>
  </div>

  <div class="unten">
    <div class="kasten rucksack"><h2>Rucksack <small>was ich dabeihabe</small></h2><div class="linien"></div></div>
    <div class="kasten stempel"><h2>Stempel <small>gold = Aufstieg</small></h2><div class="stempelfelder">${stempel}</div></div>
  </div>

  <p class="fussnote">So viele W6 wie Punkte · der höchste zählt · ab 4 klappt es · schwer ab 5 · jede 6 ist ein Volltreffer</p>
</div>`;
}

const BOGEN_CSS = `
.bogen { width: 794px; height: 1123px; box-sizing: border-box; padding: 30px 40px; background: #FFFFFF; color: #1C1C1E; font-family: Nunito, "Segoe UI", Roboto, sans-serif; display: flex; flex-direction: column; gap: 12px; }
.bogen > * { flex-shrink: 0; }
.bogen h1, .bogen h2, .ausweis-kopf { font-family: Fredoka, "Segoe UI", Roboto, sans-serif; font-weight: 600; margin: 0; }
.bogen p { margin: 0; }
.kopfzeile { display: flex; justify-content: space-between; align-items: baseline; }
.kopfzeile h1 { font-size: 30px; }
.kopfzeile p { font-size: 13px; color: #6E6E73; }
.oben { display: grid; grid-template-columns: 1fr 340px; gap: 14px; }
.links { display: flex; flex-direction: column; gap: 12px; min-width: 0; }
.ausweis { border: 2px solid #1C1C1E; border-radius: 14px; overflow: hidden; }
.ausweis-kopf { background: #1C1C1E; color: #fff; padding: 7px 16px; font-size: 17px; }
.felder { display: flex; flex-direction: column; gap: 8px; padding: 10px 16px 14px; }
.felder p { display: flex; flex-direction: column; }
.bogen small { font-size: 12px; color: #6E6E73; font-family: Nunito, "Segoe UI", Roboto, sans-serif; font-weight: 400; }
.wert { font-family: Fredoka, sans-serif; font-size: 21px; border-bottom: 1.5px solid #1C1C1E; padding-bottom: 2px; }
.linie { display: block; border-bottom: 1.5px solid #9A9AA1; height: 26px; }
.bildfeld { border: 2px dashed #9A9AA1; border-radius: 14px; position: relative; }
.bildfeld span { position: absolute; top: 10px; left: 14px; font-family: Fredoka, sans-serif; font-size: 15px; color: #9A9AA1; }
.kasten { border: 2px solid #1C1C1E; border-radius: 14px; padding: 9px 14px; }
.kasten h2 { font-size: 16px; margin-bottom: 4px; }
.kasten h2 small { margin-left: 4px; }
.zaehler { display: flex; flex-direction: column; gap: 2px; }
.zaehler .zeile { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.zaehler .zeile h2 { margin: 0; }
.zaehler .symbole { display: flex; gap: 2px; }
.zaehler small + .zeile { margin-top: 8px; }
.klein { font-size: 12.5px; line-height: 1.35; color: #2C2C30; }
.kasten .name { font-family: Fredoka, sans-serif; font-size: 18px; margin: 1px 0 2px; }
table.eigenschaften { width: 100%; border-collapse: separate; border-spacing: 0; border: 2px solid #1C1C1E; border-radius: 14px; overflow: hidden; }
.eigenschaften th { text-align: left; font-size: 12px; color: #6E6E73; font-weight: 700; padding: 7px 12px; border-bottom: 1.5px solid #1C1C1E; }
.eigenschaften td { padding: 5px 12px; border-bottom: 1px solid #E2E2E5; vertical-align: middle; }
.eigenschaften tr:last-child td { border-bottom: 0; }
.eigenschaften td b { font-family: Fredoka, sans-serif; font-weight: 600; font-size: 19px; display: inline-block; min-width: 92px; }
.eigenschaften .punkte { width: 70px; text-align: center; font-family: Fredoka, sans-serif; font-size: 24px; font-weight: 600; }
.kaestchen { white-space: nowrap; }
.kaestchen span { display: inline-block; width: 27px; height: 27px; border: 2px solid #1C1C1E; border-radius: 6px; margin-right: 6px; vertical-align: middle; position: relative; }
.kaestchen span.an::before, .kaestchen span.an::after { content: ""; position: absolute; left: 11.5px; top: 1.5px; width: 3px; height: 23px; background: #1C1C1E; border-radius: 2px; transform: rotate(45deg); }
.kaestchen span.an::after { transform: rotate(-45deg); }
.zwei { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.zwei .linie { height: 24px; }
.benutzt { margin-top: 5px; font-size: 13px; display: flex; align-items: center; gap: 6px; }
.kreis { width: 15px; height: 15px; border: 2px solid #1C1C1E; border-radius: 50%; display: inline-block; }
.unten { flex: 1 1 auto; min-height: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.stempel { align-self: start; }
.rucksack { display: flex; flex-direction: column; }
.rucksack .linien { flex: 1; background-image: repeating-linear-gradient(to bottom, transparent 0 27px, #9A9AA1 27px 28.5px); }
.stempelfelder { display: flex; justify-content: space-between; margin: 6px 0 2px; }
.stempelfelder span { width: 40px; height: 40px; border: 1.5px dashed #9A9AA1; border-radius: 50%; display: grid; place-items: center; color: #B5B5BA; font-family: Fredoka, sans-serif; font-size: 14px; box-sizing: border-box; }
.stempelfelder span.auf { border: 2px solid #C08A1A; color: #C08A1A; }
.fig-bild svg { width: 72%; height: auto; max-height: 88%; overflow: visible; }
.sk-blatt { width: 794px; height: 1123px; box-sizing: border-box; padding: 24px; background: #FFFFFF; display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: repeat(2, minmax(0, 1fr)); font-family: Nunito, "Segoe UI", Roboto, sans-serif; color: #1C1C1E; }
.sk-karte { box-sizing: border-box; padding: 26px 24px; border: 1.5px dashed #B5B5BA; margin: -0.75px; display: flex; flex-direction: column; gap: 17px; overflow: hidden; }
.sk-kopf { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 2px solid #1C1C1E; padding-bottom: 8px; }
.sk-kopf h2 { margin: 0; font-family: Fredoka, sans-serif; font-weight: 600; font-size: 30px; }
.sk-kopf small { font-size: 10px; color: #6E6E73; }
.sk-punkt { display: flex; gap: 10px; align-items: flex-start; }
.sk-punkt svg { width: 30px; height: 30px; flex: none; margin-top: 2px; }
.sk-punkt p { margin: 0 !important; font-size: 15px !important; line-height: 1.4 !important; }
.fussnote { font-size: 13.5px; font-weight: 700; white-space: nowrap; color: #1C1C1E; text-align: center; background: #F2F2F4; border-radius: 10px; padding: 8px 12px; }
`;

// Inhalt einer Canvas-Datei aus assets/quelle/ ohne die Hilfs-Tags, auf weißem Grund.
// Die Zeichnungen im Canvas haben cremefarbene Flächen; gedruckt wird auf Weiß.
function quelle(datei) {
  const html = lies(`assets/quelle/${datei}`).match(/<\/helmet>\s*([\s\S]*?)\s*<\/x-dc>/)[1];
  return html.replace(/background: (#F8F2E4|#F3E6C8|#F6EBE4|#FFFDF7|#FFFAEE)/gi, 'background: #FFFFFF');
}

// Karten ohne Hinweise auf den Ablauf: keine Legende, keine Nummern, keine Wege,
// keine Beschriftungen, die ein Rätsel oder eine Begegnung verraten.
function karteOhneHinweise(datei) {
  let html = quelle(datei);
  const weg = [
    /<p style="margin: 0; font-size: 14px; color: #5A5560">Die Zahlen zeigen die Reihenfolge<\/p>/,
    /<p style="margin: 0; font-size: 15px; line-height: 1.4">[\s\S]*?<\/p>/,
    /<g font-family="Fredoka, sans-serif" font-size="22" font-weight="600" text-anchor="middle" fill="#FFFFFF">[\s\S]*?<\/g>/,
    /<path [^>]*stroke-dasharray="10 8"[^>]*\/>/g,
    /<path d="M757 470[^>]*\/>/,
    /<rect x="870" y="345"[^>]*\/>/,
    /<path d="M896 385[^>]*\/>/,
    /<text [^>]*>Geheimkammer<\/text>/,
    /<text [^>]*>Kamel Karl<\/text>/
  ];
  for (const muster of weg) html = html.replace(muster, '');
  return html
    .replace('>Tor mit Zahlencode<', '>Tor<')
    .replace('>Vorratslager (Walnüsse)<', '>Vorratslager<')
    .replace('>Wald mit Farn<', '>Wald<')
    .replace('>Nest der Gräfin<', '>Turmspitze<')
    .replace(/aria-label="Karte[^"]*"/, 'aria-label="Karte"');
}

// Dieselben Karten als SVG für die App (assets/bilder/karte-*.svg): Titel und Karte, ohne Hinweise.
function karteAlsSvg(datei) {
  const html = karteOhneHinweise(datei);
  const titel = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)[1].trim();
  const innen = html.match(/<svg width="1027"[\s\S]*?<\/svg>/)[0].replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1027 726" width="1027" height="726" role="img" aria-label="${titel}">
<rect width="1027" height="726" fill="#FFFFFF"/>
<text x="12" y="38" font-family="Fredoka, sans-serif" font-size="30" font-weight="600" fill="#2A2733">${titel}</text>
<g transform="translate(0,56)">
${innen.trim()}
</g>
</svg>
`;
}

// Figurenkarten ohne Tipps: Die Spieler sehen die Karten. Darum bleiben nur Bild, Name, Art,
// „Kann“ und „Macht gern“ und der typische Satz. Werte, Schwachstellen, Geheimnisse und
// Lern-Fakten fliegen raus, weil sie Rätsel oder Kämpfe verraten.
const figurenDaten = JSON.parse(lies('data/figuren.json')).figuren;
function figurenkarten(datei) {
  // Das Bild füllt den Platz, der durch die weggelassenen Texte frei wird.
  const teile = quelle(datei).replace(/<div style="height: 168px; /g, '<div class="fig-bild" style="flex: 1; min-height: 168px; ').split(/(?=<h2 )/);
  return teile.map((teil, i) => {
    if (i === 0) return teil;
    const name = teil.match(/^<h2[^>]*>([^<]*)<\/h2>/)[1];
    const figur = figurenDaten.find(f => f.name === name);
    let t = teil;
    if (figur) t = t.replace(/(<p style="margin: 2px 0 0; font-size: 14px">)[^<]*(<\/p>)/, `$1${esc(figur.art)}$2`);
    return t.replace(/(<div style="padding: 14px 18px; display: flex; flex-direction: column; gap: 8px; font-size: 15px; line-height: 1.45">)([\s\S]*?)(<\/div>)/, (_, auf, innen, zu) => {
      const zeilen = innen.split('\n').filter(z => /<b>(Kann|Macht gern):<\/b>|font-style: italic/.test(z));
      if (!zeilen.some(z => z.includes('font-style: italic')) && figur) {
        const satz = figur.satz ? `„${figur.satz}“` : (figur.stimme.match(/„[^“]+“/) || [])[0];
        if (satz) zeilen.push(`<p style="margin: 0; font-style: italic; color: #5A5560">${esc(satz)}</p>`);
      }
      return auf + '\n' + zeilen.join('\n') + '\n' + zu;
    });
  }).join('');
}

// Spielerkarte „So spielst du“: alle vier Karten auf einer Seite, zum Ausschneiden.
function spielerkarten() {
  const quellText = quelle('Spielerkarte.dc.html');
  const punkte = [...quellText.matchAll(/<div style="display: flex; gap: 16px; align-items: flex-start">\s*([\s\S]*?)\s*<\/div>/g)].map(m => m[1]);
  const karte = `<div class="sk-karte"><div class="sk-kopf"><h2>So spielst du</h2><small>Bibliothek der Zeiten</small></div>${punkte.map(p => `<div class="sk-punkt">${p}</div>`).join('')}</div>`;
  return `<div class="sk-blatt">${karte.repeat(4)}</div>`;
}
const seite = (html, quer) => `<section class="seite${quer ? ' quer' : ''}">${html}</section>`;
const SCHRIFTEN = '<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600&family=Nunito:wght@400;700&display=swap" rel="stylesheet">';

// ---------- Das Druckpaket: Reihenfolge = Seiten im PDF ----------
// wann: 'erster' = am ersten Abend nötig, 'optional', 'spaeter' = erst für ein späteres Abenteuer.
const PAKET = [
  ...helden.map(h => ({ html: heldenbogen(h), titel: `Heldenbogen ${h.name || h.spieler.split(' ')[0]}`, wofuer: `für ${h.spieler.split(' ')[0]}`, wann: 'erster' })),
  { html: heldenbogen(null), titel: 'Heldenbogen leer', wofuer: 'Reserve für neue Helden', wann: 'optional' },
  { html: spielerkarten(), titel: 'Spielerkarten „So spielst du“', wofuer: '4 Karten auf einer Seite, eine vor jeden Spieler, ausschneiden', wann: 'erster' },
  { html: figurenkarten('Main.dc.html'), titel: 'Figurenkarten Blatt 1', wofuer: 'Eulalia, Krümel, Gräfin Glitzer, Krähenbande', wann: 'erster' },
  { html: figurenkarten('Figuren-2.dc.html'), titel: 'Figurenkarten Blatt 2', wofuer: 'Gaius und Trixi für Abenteuer 1, Kamel Karl und Ritter Rostig für später', wann: 'erster' },
  { html: quelle('Handout-Roemische-Zahlen.dc.html'), titel: 'Gaius’ Zahlen-Tafel', wofuer: 'Tor-Rätsel, Abenteuer 1, Szene 2', wann: 'erster' },
  { html: quelle('Handout-Hieroglyphen.dc.html'), titel: 'Neferets Hieroglyphen-Tafel', wofuer: 'Tür-Rätsel, Abenteuer 2', wann: 'spaeter' },
  { html: karteOhneHinweise('Karte-Roemerlager.dc.html'), quer: true, titel: 'Karte Römerlager', wofuer: 'Abenteuer 1, die App zeigt sie auch', wann: 'optional' },
  { html: karteOhneHinweise('Karte-Aegypten.dc.html'), quer: true, titel: 'Karte Ägypten', wofuer: 'Abenteuer 2', wann: 'spaeter' },
  { html: karteOhneHinweise('Karte-Burg.dc.html'), quer: true, titel: 'Karte Burg', wofuer: 'Abenteuer 3', wann: 'spaeter' }
];
const seiten = PAKET.map(p => seite(p.html, p.quer));

const druck = `<!doctype html>
<html lang="de"><head><meta charset="utf-8"><title>Druckvorlagen – Bibliothek der Zeiten</title>
${SCHRIFTEN}
<style>
@page { size: A4 portrait; margin: 0; }
@page quer { size: A4 landscape; margin: 0; }
html, body { margin: 0; padding: 0; }
body { background: #888; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.seite { width: 794px; height: 1123px; overflow: hidden; break-after: page; background: #fff; margin: 0 auto; }
.seite.quer { page: quer; width: 1123px; height: 794px; }
@media screen { .seite { margin: 16px auto; } }
${BOGEN_CSS}
</style></head>
<body>
${seiten.join('\n')}
</body></html>
`;

// ---------- Vorschau der Heldenbögen (Artefakt zum Anschauen) ----------
const beispiel = helden.find(h => h.id === 'filipa') || helden[0];
const vorschau = `<title>Heldenbogen Vorschau</title>
<meta name="claude:viewport-fit-sides" content="cover">
${SCHRIFTEN}
<style>
:root { --grund: #EDEDEF; --tinte: #1C1C1E; --leise: #6E6E73; --blatt-schatten: 0 1px 3px rgba(0,0,0,.12), 0 8px 24px rgba(0,0,0,.08); }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --grund: #111113; --tinte: #F2F2F4; --leise: #9A9AA1; --blatt-schatten: none; color-scheme: dark; } }
:root[data-theme="dark"] { --grund: #111113; --tinte: #F2F2F4; --leise: #9A9AA1; --blatt-schatten: none; color-scheme: dark; }
body { background: var(--grund); color: var(--tinte); font-family: Nunito, "Segoe UI", Roboto, sans-serif; }
.huelle { max-width: 860px; margin: 0 auto; padding-block: 24px 48px; padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); display: flex; flex-direction: column; gap: 28px; }
.huelle header h1 { font-family: Fredoka, sans-serif; font-weight: 600; font-size: 1.6rem; margin: 0 0 4px; text-wrap: balance; }
.huelle header p { margin: 0; color: var(--leise); max-width: 62ch; line-height: 1.5; }
figure { margin: 0; display: flex; flex-direction: column; gap: 10px; }
figcaption { font-weight: 700; font-size: .95rem; }
figcaption span { color: var(--leise); font-weight: 400; }
.rahmen { width: 100%; overflow: hidden; border-radius: 4px; box-shadow: var(--blatt-schatten); background: #fff; }
.rahmen .bogen { transform-origin: 0 0; }
${BOGEN_CSS}
</style>
<div class="huelle">
  <header>
    <h1>Heldenbogen, Entwurf 2</h1>
    <p>Weißer Hintergrund, großes Bildfeld zum Malen, „Gespielt von“ und „Wer bin ich?“ bleiben leer. Mehr Platz im Rucksack, kleinere Stempel. Gedruckt wird später in A4.</p>
  </header>
  <figure><figcaption>Ausgefüllt <span>Beispiel: ${esc(beispiel.spieler.split(" ")[0])}</span></figcaption><div class="rahmen">${heldenbogen(beispiel)}</div></figure>
  <figure><figcaption>Leer <span>für neue Helden</span></figcaption><div class="rahmen">${heldenbogen(null)}</div></figure>
</div>
<script>
  // Das A4-Blatt (794 × 1123 px) auf die Bildschirmbreite verkleinern.
  function passe() {
    document.querySelectorAll('.rahmen').forEach(r => {
      const s = Math.min(1, r.clientWidth / 794);
      const b = r.querySelector('.bogen');
      b.style.transform = 'scale(' + s + ')';
      r.style.height = (1123 * s) + 'px';
    });
  }
  passe();
  window.addEventListener('resize', passe);
  if (document.fonts) document.fonts.ready.then(passe);
</script>
`;

// ---------- Vorschau des ganzen Druckpakets (Artefakt zum Anschauen) ----------
const WANN = { erster: 'Erster Abend', optional: 'Optional', spaeter: 'Später' };
const blattFigur = (p, i) => `<figure class="blatt-fig">
    <figcaption><span class="nr">Seite ${i + 1}</span><b>${esc(p.titel)}</b><span class="marke ${p.wann}">${WANN[p.wann]}</span><small>${esc(p.wofuer)}</small></figcaption>
    <div class="rahmen" data-breite="${p.quer ? 1123 : 794}" data-hoehe="${p.quer ? 794 : 1123}"><div class="inhalt-blatt">${p.html}</div></div>
  </figure>`;
const gruppe = (titel, text, filter) => {
  const eintraege = PAKET.map((p, i) => [p, i]).filter(([p]) => filter(p));
  return `<section class="gruppe"><h2>${titel}</h2><p class="hinweis">${text}</p>${eintraege.map(([p, i]) => blattFigur(p, i)).join('\n')}</section>`;
};
const ersteSeiten = PAKET.map((p, i) => [p, i]).filter(([p]) => p.wann !== 'spaeter').map(([, i]) => i + 1);
const paket = `<title>Druckpaket Bibliothek der Zeiten</title>
<meta name="claude:viewport-fit-sides" content="cover">
${SCHRIFTEN}
<style>
/* Ruhige graue Arbeitsfläche, darauf die weißen A4-Blätter wie auf einem Tisch. */
:root { --grund: #ECECEE; --flaeche: #FFFFFF; --tinte: #1C1C1E; --leise: #6E6E73; --linie: #D9D9DD; --erster: #1C1C1E; --erster-text: #FFFFFF; --optional: #E2E2E6; --spaeter: transparent; --schatten: 0 1px 3px rgba(0,0,0,.12), 0 10px 28px rgba(0,0,0,.08); }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --grund: #111113; --flaeche: #1C1C1F; --tinte: #F2F2F4; --leise: #9A9AA1; --linie: #2E2E33; --erster: #F2F2F4; --erster-text: #111113; --optional: #2E2E33; --schatten: none; color-scheme: dark; } }
:root[data-theme="dark"] { --grund: #111113; --flaeche: #1C1C1F; --tinte: #F2F2F4; --leise: #9A9AA1; --linie: #2E2E33; --erster: #F2F2F4; --erster-text: #111113; --optional: #2E2E33; --schatten: none; color-scheme: dark; }
body { background: var(--grund); color: var(--tinte); font-family: Nunito, "Segoe UI", Roboto, sans-serif; line-height: 1.5; }
.huelle { max-width: 900px; margin: 0 auto; padding-block: 28px 56px; padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); display: flex; flex-direction: column; gap: 36px; }
.huelle > header h1 { font-family: Fredoka, sans-serif; font-weight: 600; font-size: clamp(1.6rem, 4vw, 2.2rem); margin: 0 0 6px; text-wrap: balance; }
.huelle > header p { margin: 0; color: var(--leise); max-width: 62ch; }
.uebersicht { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin-top: 18px; }
.uebersicht div { background: var(--flaeche); border-radius: 14px; padding: 14px 16px; border: 1px solid var(--linie); }
.uebersicht b { display: block; font-family: Fredoka, sans-serif; font-weight: 600; font-size: 1.35rem; font-variant-numeric: tabular-nums; }
.uebersicht span { color: var(--leise); font-size: .9rem; }
.gruppe { display: flex; flex-direction: column; gap: 26px; }
.gruppe h2 { font-family: Fredoka, sans-serif; font-weight: 600; font-size: 1.3rem; margin: 0; }
.gruppe .hinweis { margin: -18px 0 0; color: var(--leise); max-width: 62ch; }
.blatt-fig { margin: 0; display: flex; flex-direction: column; gap: 10px; }
figcaption { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 10px; }
figcaption .nr { font-size: .8rem; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; color: var(--leise); font-variant-numeric: tabular-nums; }
figcaption b { font-size: 1.05rem; }
figcaption small { flex-basis: 100%; color: var(--leise); font-size: .9rem; }
.marke { font-size: .72rem; font-weight: 700; border-radius: 999px; padding: 2px 9px; }
.marke.erster { background: var(--erster); color: var(--erster-text); }
.marke.optional { background: var(--optional); color: var(--tinte); }
.marke.spaeter { border: 1px solid var(--linie); color: var(--leise); }
.rahmen { width: 100%; overflow: hidden; border-radius: 4px; box-shadow: var(--schatten); background: #fff; }
.inhalt-blatt { transform-origin: 0 0; }
${BOGEN_CSS}
</style>
<div class="huelle">
  <header>
    <h1>Druckpaket für die Bibliothek der Zeiten</h1>
    <p>Alle ${PAKET.length} Seiten aus Druckvorlagen.pdf in der Reihenfolge des PDFs. Für den ersten Abend reichen die Seiten ${ersteSeiten.join(', ')}. Beim Drucken „Tatsächliche Größe“ wählen.</p>
    <div class="uebersicht">
      <div><b>${PAKET.filter(p => p.wann === 'erster').length} Seiten</b><span>für den ersten Abend</span></div>
      <div><b>${PAKET.filter(p => p.wann === 'optional').length} Seiten</b><span>optional</span></div>
      <div><b>${PAKET.filter(p => p.wann === 'spaeter').length} Seiten</b><span>erst für Abenteuer 2 und 3</span></div>
    </div>
  </header>
  ${gruppe('Für den ersten Abend', 'Übungsszene und Abenteuer 1 „Der Dino im Römerlager“.', p => p.wann !== 'spaeter')}
  ${gruppe('Für später', 'Diese Seiten brauchst du erst in Abenteuer 2 und 3.', p => p.wann === 'spaeter')}
</div>
<script>
  // Jedes A4-Blatt auf die Bildschirmbreite verkleinern.
  function passe() {
    document.querySelectorAll('.rahmen').forEach(r => {
      const b = Number(r.dataset.breite), h = Number(r.dataset.hoehe);
      const s = Math.min(1, r.clientWidth / b);
      const inhalt = r.firstElementChild;
      inhalt.style.width = b + 'px'; inhalt.style.height = h + 'px';
      inhalt.style.transform = 'scale(' + s + ')';
      r.style.height = (h * s) + 'px';
    });
  }
  passe();
  window.addEventListener('resize', passe);
  if (document.fonts) document.fonts.ready.then(passe);
</script>
`;

const ziel = path.join(WURZEL, 'druck');
fs.mkdirSync(ziel, { recursive: true });
fs.writeFileSync(path.join(ziel, 'druckvorlagen.html'), druck, 'utf8');
fs.writeFileSync(path.join(ziel, 'heldenbogen-vorschau.html'), vorschau, 'utf8');
fs.writeFileSync(path.join(ziel, 'druckpaket-vorschau.html'), paket, 'utf8');
for (const [datei, name] of [['Karte-Roemerlager.dc.html', 'karte-roemerlager'], ['Karte-Aegypten.dc.html', 'karte-aegypten'], ['Karte-Burg.dc.html', 'karte-burg']]) {
  fs.writeFileSync(path.join(WURZEL, 'assets', 'bilder', `${name}.svg`), karteAlsSvg(datei), 'utf8');
}
console.log(`druck/druckvorlagen.html: ${seiten.length} Seiten, Vorschauen: heldenbogen-vorschau.html, druckpaket-vorschau.html`);
