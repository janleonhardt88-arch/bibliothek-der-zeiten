'use strict';
// Spielleiter-Walkthrough "Die Bibliothek der Zeiten".
// Alle Inhalte kommen aus data/ und docs/. Hier steht nur, WIE sie angezeigt werden.

const app = document.getElementById('app');
const ebene = document.getElementById('ebene');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const SPEICHER = 'bdz-stand-v1';
const SCHWIERIGKEIT = { 4: 'leicht', 5: 'schwer', 6: 'episch' };

// Felder einer Szene, die keinen eigenen Schritt bekommen (sie stehen auf der Szenen-Karte).
const SZENE_KOPF = new Set(['id', 'titel', 'ort', 'dauerMin', 'schauplatz', 'musik', 'kampfMusik', 'versoehnungsMusik', 'bild', 'nachUebung']);
// Felder eines Abenteuers, die die App kennt. Alles andere erscheint als Hinweis.
const ABENTEUER_BEKANNT = new Set(['id', 'nummer', 'titel', 'epoche', 'stempel', 'dauerMin', 'kurz', 'karte', 'vorbereitung', 'szenen', 'abschluss', 'planB', 'erklaerHinweis']);

let D = null;          // Daten aus data/
let ST = null;         // Spielstand, liegt im Handy-Speicher
let ABENTEUER = null;  // aktuelles Abenteuer
let SCHRITTE = [];     // Schritte des aktuellen Abenteuers
let ansicht = 'start';

// ---------- Laden und Speichern ----------

async function ladeJson(pfad) {
  const r = await fetch(pfad);
  if (!r.ok) throw new Error(`${pfad} (${r.status})`);
  return r.json();
}

async function ladeText(pfad) {
  const r = await fetch(pfad);
  if (!r.ok) throw new Error(`${pfad} (${r.status})`);
  return r.text();
}

function ladeStand() {
  try { return JSON.parse(localStorage.getItem(SPEICHER)); } catch { return null; }
}

function speichere() {
  try { localStorage.setItem(SPEICHER, JSON.stringify(ST)); } catch { /* Speicher voll oder gesperrt: App läuft trotzdem */ }
}

function neuerStand() {
  return {
    abenteuerId: null, schritt: 0,
    anwesend: D.helden.map(h => h.id),
    klasse: 2, lautstaerke: 0.3, stumm: false,
    helden: {}, kruemel: { stempel: [], wurf: {} },
    kampf: {}, geloest: {}, fertig: []
  };
}

function heldStand(held) {
  if (!ST.helden[held.id]) {
    ST.helden[held.id] = {
      name: null,
      herzen: held.herzen ?? D.regeln.start.herzen,
      gluecksstern: held.gluecksstern ?? D.regeln.start.gluecksstern,
      zauberBenutzt: false,
      stempel: [...(held.stempel || [])]
    };
  }
  return ST.helden[held.id];
}

const kruemel = () => D.begleiter.find(b => b.id === 'kruemel') || { name: 'Krümel' };
const anwesendeHelden = () => D.helden.filter(h => ST.anwesend.includes(h.id));
const kind = () => anwesendeHelden().find(h => h.erwachsen === false);
const heldName = h => heldStand(h).name || h.name || h.spieler.split(' ')[0];
const herzenMax = h => h.herzenMax ?? D.regeln.start.herzen;

// ---------- Schritte aus einem Abenteuer bauen ----------
// Reihenfolge = Reihenfolge der Felder in der JSON-Datei.

function baueSchritte(ab) {
  const s = [{ art: 'start' }];
  ab.szenen.forEach((sz, si) => {
    s.push({ art: 'szene', sz, si });
    for (const [feld, wert] of Object.entries(sz)) {
      if (SZENE_KOPF.has(feld) || wert == null) continue;
      switch (feld) {
        case 'vorlesen': case 'nachVorlesen': case 'schlussVorlesen':
          wert.forEach((text, i) => s.push({ art: 'vorlesen', sz, feld, text, nr: i + 1, von: wert.length }));
          break;
        case 'uebergang':
          s.push({ art: 'vorlesen', sz, feld, text: wert, nr: 1, von: 1 });
          break;
        case 'lernFakten':
          wert.forEach(fakt => s.push({ art: 'fakt', sz, fakt }));
          break;
        case 'raetsel':
          wert.forEach((r, i) => s.push({ art: 'raetsel', sz, r, schluessel: `${sz.id}-r${i}` }));
          break;
        case 'proben':
          wert.forEach(p => s.push({ art: 'probe', sz, p }));
          break;
        case 'kampf':
          s.push({ art: 'kampf', sz, k: wert, schluessel: `${sz.id}-kampf` });
          break;
        case 'schloss':
          s.push({ art: 'schloss', sz, schloss: wert });
          break;
        case 'kruemel':
          s.push({ art: 'kruemel', sz, text: wert });
          break;
        case 'figurHinweis':
          s.push({ art: 'hinweis', sz, titel: 'Zur Figur', text: wert });
          break;
        case 'loesung':
          s.push({ art: 'hinweis', sz, titel: 'So endet die Szene', text: wert });
          break;
        default:
          s.push({ art: 'hinweis', sz, titel: feld, text: alsText(wert) });
      }
    }
    s.push({ art: 'ende', sz, si, letzte: si === ab.szenen.length - 1 });
  });
  s.push({ art: 'abschluss' });
  return s;
}

function alsText(wert) {
  if (Array.isArray(wert)) return wert.map(alsText).join(' · ');
  if (wert && typeof wert === 'object') return Object.entries(wert).map(([k, v]) => `${k}: ${alsText(v)}`).join(' · ');
  return String(wert);
}

function kurzname(s) {
  switch (s.art) {
    case 'start': return 'Überblick';
    case 'szene': return `Szenenbeginn: ${s.sz.titel}`;
    case 'vorlesen': return `Vorlesen: ${s.text.slice(0, 48)}…`;
    case 'fakt': return `Lern-Fakt (${s.fakt.von})`;
    case 'raetsel': return `Rätsel: ${s.r.thema}`;
    case 'probe': return `Probe: ${s.p.was}`;
    case 'kampf': return `Kampf: ${D.figuren[s.k.gegner]?.name || s.k.gegner}`;
    case 'schloss': return `Schloss: ${s.schloss.was}`;
    case 'kruemel': return 'Krümels Moment';
    case 'hinweis': return s.titel;
    case 'ende': return 'Szenenende';
    case 'abschluss': return 'Abschluss';
  }
  return s.art;
}

// ---------- Bilder ----------
// Gesucht wird erst der Pfad aus den Daten (.png), dann dieselbe Datei als .svg und als .html.

const bildFund = new Map();
async function findeBild(pfad) {
  if (bildFund.has(pfad)) return bildFund.get(pfad);
  const basis = pfad.replace(/\.[a-z0-9]+$/i, '');
  for (const v of [pfad, `${basis}.svg`, `${basis}.html`]) {
    try {
      const r = await fetch(v);
      if (r.ok) { bildFund.set(pfad, v); return v; }
    } catch { /* weiter probieren */ }
  }
  bildFund.set(pfad, null);
  return null;
}

const bildPlatz = pfad => pfad ? `<div class="bild" data-bild="${esc(pfad)}"></div>` : '';
const bildKnopf = (pfad, text) => pfad ? `<button class="knopf breit" data-aktion="bild" data-pfad="${esc(pfad)}">${esc(text)}</button>` : '';

function fuelleBilder(wurzel) {
  wurzel.querySelectorAll('.bild[data-bild]').forEach(async el => {
    const pfad = el.dataset.bild;
    const datei = await findeBild(pfad);
    if (!datei) { el.innerHTML = `<p class="fehlt">Bild fehlt noch: ${esc(pfad)}</p>`; return; }
    if (datei.endsWith('.html')) { el.outerHTML = bildKnopf(pfad, 'Bild zeigen'); return; }
    el.innerHTML = `<img src="${esc(datei)}" alt="" data-aktion="bild" data-pfad="${esc(pfad)}">`;
  });
}

async function zeigeBild(pfad) {
  const datei = await findeBild(pfad);
  const v = document.createElement('div');
  v.className = 'vollbild';
  const flaeche = !datei
    ? `<p style="color:#fff;padding:20px">Bild fehlt noch: ${esc(pfad)}</p>`
    : datei.endsWith('.html')
      ? `<div class="rahmen"><iframe src="${esc(datei)}" title="Bild"></iframe></div>`
      : `<img src="${esc(datei)}" alt="">`;
  v.innerHTML = `<div class="flaeche">${flaeche}</div>
    <div class="leiste">${datei && !datei.endsWith('.html') ? '<button class="knopf" data-v="zoom">Vergrößern</button>' : ''}<button class="knopf voll" data-v="zu">Schließen</button></div>`;
  document.body.appendChild(v);
  const iframe = v.querySelector('iframe');
  if (iframe) {
    iframe.addEventListener('load', () => {
      const doc = iframe.contentDocument;
      const b = doc.documentElement.scrollWidth, h = doc.documentElement.scrollHeight;
      const passt = () => {
        const skala = v.querySelector('.rahmen').clientWidth / b;
        iframe.style.width = b + 'px'; iframe.style.height = h + 'px';
        iframe.style.transform = `scale(${skala})`;
        v.querySelector('.rahmen').style.height = (h * skala) + 'px';
      };
      passt();
      window.addEventListener('resize', passt);
    });
  }
  v.addEventListener('click', e => {
    const was = e.target.closest('[data-v]')?.dataset.v;
    if (was === 'zu') v.remove();
    if (was === 'zoom') { v.classList.toggle('zoom'); e.target.textContent = v.classList.contains('zoom') ? 'Verkleinern' : 'Vergrößern'; }
  });
}

// ---------- Ton ----------
// Musik läuft in Schleife und blendet beim Wechsel weich über. Geräusche spielen einmal darüber.
// Fehlt eine Datei, läuft die App ohne Ton weiter und zeigt einmal einen kleinen Hinweis.

const TON = { musik: null, datei: null, urls: new Map(), fehlt: new Set(), wartet: false };
const musikLautstaerke = () => (ST.stumm ? 0 : ST.lautstaerke);
const geraeuschLautstaerke = () => (ST.stumm ? 0 : Math.min(1, ST.lautstaerke + 0.5));

// Lädt die Datei ganz in den Speicher. So spielt sie auch offline zuverlässig.
async function tonUrl(pfad) {
  if (TON.urls.has(pfad)) return TON.urls.get(pfad);
  let url = null;
  try { const r = await fetch(pfad); if (r.ok) url = URL.createObjectURL(await r.blob()); } catch { /* offline und nicht gespeichert */ }
  TON.urls.set(pfad, url);
  if (!url && !TON.fehlt.has(pfad)) { TON.fehlt.add(pfad); hinweis(`Ton fehlt: ${pfad}`); }
  return url;
}

function blende(audio, ziel, ms, fertig) {
  clearInterval(audio._blende);
  const start = audio.volume, t0 = performance.now();
  audio._blende = setInterval(() => {
    const p = Math.min(1, (performance.now() - t0) / ms);
    audio.volume = Math.max(0, Math.min(1, start + (ziel - start) * p));
    if (p >= 1) { clearInterval(audio._blende); if (fertig) fertig(); }
  }, 50);
}

async function spieleMusik(datei) {
  if ((datei || null) === TON.datei) return;
  TON.datei = datei || null;
  const alt = TON.musik;
  TON.musik = null;
  if (alt) blende(alt, 0, 2000, () => alt.pause());
  if (!datei) return;
  const url = await tonUrl(`assets/musik/${datei}`);
  if (!url || TON.datei !== datei) return;
  const a = new Audio(url);
  a.loop = true; a.volume = 0;
  TON.musik = a;
  try { await a.play(); TON.wartet = false; blende(a, musikLautstaerke(), 2000); }
  catch { TON.wartet = true; } // Das Handy will erst eine Berührung sehen.
}

// Welche Musik passt zu Schritt i?
function musikFuer(i) {
  const s = SCHRITTE[i];
  if (!s || s.art === 'start' || s.art === 'ende') return null;
  if (s.art === 'abschluss') return ABENTEUER.abschluss?.musik?.datei || null;
  const sz = s.sz;
  const kampf = SCHRITTE.findIndex(x => x.sz === sz && x.art === 'kampf');
  if (kampf >= 0 && i >= kampf) {
    // Nach dem Kampf-Schritt läuft die Kampfmusik weiter (z. B. für Krümels Wurf), bis wieder vorgelesen wird.
    const danachVorlesen = SCHRITTE.findIndex((x, j) => j > kampf && x.sz === sz && x.art === 'vorlesen');
    if (danachVorlesen < 0 || i < danachVorlesen) return (sz.kampfMusik || sz.musik)?.datei || null;
    return (sz.versoehnungsMusik || sz.musik)?.datei || null;
  }
  return sz.musik?.datei || null;
}

async function spieleGeraeusch(id) {
  const g = D.sounds.find(x => x.id === id);
  if (!g || ST.stumm) return;
  const url = await tonUrl(`assets/sounds/${g.datei}`);
  if (!url) return;
  const a = new Audio(url);
  a.volume = geraeuschLautstaerke();
  a.play().catch(() => {});
  if (g.maxSek) setTimeout(() => blende(a, 0, 400, () => a.pause()), g.maxSek * 1000);
}

const ereignis = name => { const id = D.soundEreignisse[name]; if (id) spieleGeraeusch(id); };

function setzeLautstaerke() {
  if (TON.musik) { clearInterval(TON.musik._blende); TON.musik.volume = musikLautstaerke(); }
}

// Erste Berührung gibt den Ton frei, falls das Handy ihn vorher blockiert hat.
document.addEventListener('pointerdown', () => {
  if (TON.wartet && TON.musik) {
    TON.musik.play().then(() => { TON.wartet = false; blende(TON.musik, musikLautstaerke(), 2000); }).catch(() => {});
  }
});

let hinweisZeit = null;
function hinweis(text) {
  let t = document.getElementById('hinweis');
  if (!t) { t = document.createElement('div'); t.id = 'hinweis'; document.body.appendChild(t); }
  t.textContent = text;
  t.classList.add('da');
  clearTimeout(hinweisZeit);
  hinweisZeit = setTimeout(() => t.classList.remove('da'), 3500);
}

// ---------- Bausteine ----------

const notiz = text => text ? `<div class="notiz">${esc(text)}</div>` : '';
const liste = arr => arr?.length ? `<ul class="liste">${arr.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '';

function unbekannt(obj, bekannt) {
  return Object.entries(obj).filter(([k]) => !bekannt.has(k))
    .map(([k, v]) => `<div class="notiz"><b>${esc(k)}:</b> ${esc(alsText(v))}</div>`).join('');
}

function eigenschaftsTabelle(eigenschaften) {
  const helden = anwesendeHelden();
  if (!helden.length) return '<p class="meta">Keine Helden ausgewählt.</p>';
  return `<table class="werte"><tr><th>Held</th>${eigenschaften.map(e => `<th class="zahl">${esc(e)}</th>`).join('')}</tr>
    ${helden.map(h => {
      const st = heldStand(h);
      const extra = [`Talent +${h.talent.bonus}: ${h.talent.name}`];
      if (st.gluecksstern) extra.push(`${st.gluecksstern} Glücksstern${st.gluecksstern > 1 ? 'e' : ''} (je +${D.regeln.boni.gluecksstern})`);
      if (st.herzen === 0) extra.push('erschöpft');
      return `<tr><td><b>${esc(heldName(h))}</b><br><small>${esc(extra.join(' · '))}</small></td>
        ${eigenschaften.map(e => `<td class="zahl">${h.eigenschaften[e] ?? '–'}</td>`).join('')}</tr>`;
    }).join('')}</table>
    <p class="meta">Zahl = so viele Würfel. Talent passt? +${D.regeln.boni.talent}. Jemand hilft? +${D.regeln.boni.helfen}.</p>`;
}

// ---------- Karten ----------

const KARTE = {
  start() {
    const ab = ABENTEUER;
    return `<p class="art">${ab.nummer === 0 ? 'Erster Abend' : `Abenteuer ${ab.nummer}`}</p>
      <h1>${esc(ab.titel)}</h1>
      <p class="meta">${esc(ab.epoche)} · ${esc(ab.dauerMin)} Minuten</p>
      ${notiz(ab.erklaerHinweis)}
      <p>${esc(ab.kurz)}</p>
      ${ab.vorbereitung?.length ? `<div class="kasten"><h2>Auf den Tisch</h2>${liste(ab.vorbereitung)}</div>` : ''}
      ${bildKnopf(ab.karte, 'Karte zeigen')}
      ${unbekannt(ab, ABENTEUER_BEKANNT)}`;
  },

  szene(s) {
    const sz = s.sz;
    return `<p class="art">Szene ${s.si + 1} von ${ABENTEUER.szenen.length}</p>
      <h1>${esc(sz.titel)}</h1>
      <p class="meta">${esc(sz.ort)} · ${esc(sz.dauerMin)} Minuten</p>
      ${notiz(sz.nachUebung)}
      ${bildPlatz(sz.bild)}`;
  },

  vorlesen(s) {
    const art = { vorlesen: 'Vorlesen', nachVorlesen: 'Vorlesen', schlussVorlesen: 'Zum Schluss vorlesen', uebergang: 'Übergang vorlesen' }[s.feld];
    return `<p class="art">${art}${s.von > 1 ? ` · ${s.nr} von ${s.von}` : ''}</p>
      ${s.feld === 'vorlesen' && s.sz.nachUebung ? notiz(s.sz.nachUebung) : ''}
      <p class="vorlese">${esc(s.text)}</p>`;
  },

  fakt(s) {
    const k = kind();
    return `<p class="art">Lern-Fakt</p>
      <p class="von"><b>${esc(s.fakt.von)}</b> erzählt:</p>
      <p class="vorlese">${esc(s.fakt.text)}</p>
      ${s.fakt.regie ? `<p class="regie">${esc(s.fakt.regie)}</p>` : ''}
      ${k ? notiz(`Geht es um Tiere oder Pflanzen? ${heldName(k)} darf zuerst raten (${k.talent.name}).`) : ''}`;
  },

  raetsel(s) {
    const r = s.r;
    const stufe = ST.klasse === 1 ? r.klasse1 : r.klasse2;
    const geloest = ST.geloest[s.schluessel];
    const gewinner = geloest ? D.helden.find(h => h.id === geloest) : null;
    return `<p class="art">Rätsel · ${esc(r.thema)}</p>
      <p class="von"><b>${esc(r.von)}</b> fragt:</p>
      ${r.einleitung ? `<p class="vorlese">${esc(r.einleitung)}</p>` : ''}
      <div class="umschalter">
        <button data-aktion="klasse" data-k="1" class="${ST.klasse === 1 ? 'an' : ''}">Klasse 1</button>
        <button data-aktion="klasse" data-k="2" class="${ST.klasse === 2 ? 'an' : ''}">Klasse 2</button>
      </div>
      <p class="frage">${esc(stufe.frage)}</p>
      <details class="antwort"><summary>Antwort zeigen</summary><p>${esc(stufe.antwort)}</p></details>
      ${bildKnopf(r.handout, 'Handout zeigen')}
      ${notiz(D.regeln.spotlight[0])}
      ${r.extra ? notiz(r.extra) : ''}
      ${r.keinSchloss ? notiz('Hier gibt es kein Schloss. Schlösser knacken oder Flunkern helfen nicht.') : ''}
      ${r.ohneLoesung ? `<details class="antwort"><summary>Tipp: Falls niemand es löst</summary><p>${esc(r.ohneLoesung)}</p></details>` : ''}
      <div class="kasten">
        <h2>Gelöst? Belohnung: ${esc(r.belohnung)}</h2>
        ${gewinner
          ? `<p>Glücksstern ging an <b>${esc(heldName(gewinner))}</b>.</p><button class="knopf" data-aktion="geloest-weg" data-s="${s.schluessel}">Rückgängig</button>`
          : `<div class="knopfreihe">${anwesendeHelden().map(h => `<button class="knopf voll" data-aktion="geloest" data-s="${s.schluessel}" data-held="${h.id}">${esc(heldName(h))}</button>`).join('')}</div>`}
      </div>`;
  },

  probe(s) {
    const p = s.p;
    return `<p class="art">Probe</p>
      <h1>${esc(p.was)}</h1>
      <div class="chips">${p.eigenschaften.map(e => `<span class="chip">${esc(e)}</span>`).join('')}
        <span class="chip ziel">ab ${p.schwierigkeit} · ${SCHWIERIGKEIT[p.schwierigkeit] || ''}</span></div>
      ${p.hinweis ? notiz(p.hinweis) : ''}
      ${eigenschaftsTabelle(p.eigenschaften)}
      <p class="meta">${esc(D.regeln.volltreffer)}</p>`;
  },

  kampf(s) {
    const k = s.k;
    const g = D.figuren[k.gegner] || { name: k.gegner, herzen: 1 };
    const anzahl = k.anzahl === 'wie Helden' ? Math.max(1, anwesendeHelden().length) : (Number(k.anzahl) || 1);
    const kst = kampfStand(s.schluessel, anzahl, g.herzen || 1);
    const boss = g.stufe === 'Boss';
    return `<p class="art">Kampf · ${esc(g.stufe || '')}</p>
      <h1>${esc(g.name)}${anzahl > 1 ? ` × ${anzahl}` : ''}</h1>
      <div class="chips"><span class="chip">${g.herzen} Herz${g.herzen > 1 ? 'en' : ''}</span><span class="chip ziel">Ausweichen ab ${g.ausweichenAb}</span></div>
      <div class="runde"><span>Runde</span><button class="knopf" data-aktion="runde" data-s="${s.schluessel}" data-d="-1">−</button>
        <span style="font-size:1.4rem">${kst.runde}</span><button class="knopf" data-aktion="runde" data-s="${s.schluessel}" data-d="1">+</button></div>
      ${boss && kst.runde % 2 === 0 ? notiz(`Runde ${kst.runde}: Spezialattacke! ${g.spezial}`) : ''}
      ${kst.herzen.map((h, i) => `<div class="gegner ${h === 0 ? 'weg' : ''}">
        <b>${esc(g.name)}${anzahl > 1 ? ` ${i + 1}` : ''}</b>${h === 0 ? ' – besiegt!' : ''}
        <div class="herzen">${Array.from({ length: g.herzen }, (_, j) =>
          `<button class="herz ${j < h ? 'voll' : ''}" data-aktion="herz" data-s="${s.schluessel}" data-g="${i}" data-j="${j}">♥</button>`).join('')}</div></div>`).join('')}
      <p class="meta">Tippe ein Herz an, um es wegzunehmen oder zurückzugeben.</p>
      <div class="kasten">
        <p><b>Schwachstelle:</b> ${esc(k.schwachstelle || g.schwachstelle)} (+${D.regeln.boni.schwachstelle} Würfel)</p>
        ${g.angriff ? `<p><b>Angriff:</b> ${esc(g.angriff)}</p>` : ''}
        ${g.spezial ? `<p><b>Spezial:</b> ${esc(g.spezial)}</p>` : ''}
        ${g.geheimnis ? `<p><b>Geheimnis:</b> ${esc(g.geheimnis)}</p>` : ''}
      </div>
      ${k.hinweis ? notiz(k.hinweis) : ''}
      ${k.fallback ? notiz(`Falls niemand drauf kommt: ${k.fallback}`) : ''}
      ${k.schloss ? `<div class="kasten"><h2>Schloss: ${esc(k.schloss.was)}</h2><p>${esc(k.schloss.eigenschaft)} ab ${k.schloss.schwierigkeit}. Ohne Schlossknacker: ${esc(k.schloss.ohneSchlossknacker)}</p></div>` : ''}
      ${k.lernFakt ? `<div class="kasten"><h2>Lern-Fakt</h2><p>${esc(k.lernFakt)}</p></div>` : ''}
      <div class="kasten"><h2>So läuft der Kampf</h2>
        <p>${esc(D.regeln.kampf.reihenfolge)}</p><p>${esc(D.regeln.kampf.angriff)}</p>
        <p>${esc(D.regeln.kampf.ausweichen)}</p><p>${esc(D.regeln.kampf.zaehmen)}</p>
        <p>${esc(D.regeln.kampf.gegnerVerlieren)}</p></div>
      ${eigenschaftsTabelle(['Kraft', 'Geschick', 'Köpfchen', 'Herz'])}`;
  },

  schloss(s) {
    const sch = s.schloss;
    return `<p class="art">Schloss</p>
      <h1>${esc(sch.was)}</h1>
      <div class="chips"><span class="chip">${esc(sch.eigenschaft)}</span><span class="chip ziel">ab ${sch.schwierigkeit} · ${SCHWIERIGKEIT[sch.schwierigkeit] || ''}</span></div>
      <div class="kasten"><p><b>Ohne Schlossknacker:</b> ${esc(sch.ohneSchlossknacker)}</p></div>
      ${eigenschaftsTabelle([sch.eigenschaft])}`;
  },

  kruemel(s) {
    const k = kruemel();
    const wurf = ST.kruemel.wurf[s.sz.id];
    return `<p class="art">${esc(k.name)}s Moment</p>
      <p class="vorlese">${esc(s.text)}</p>
      ${wurf
        ? `<div class="kasten"><h2>${esc(k.name)} hat gewürfelt: ${wurf}</h2><p>${wurf === '4–6' ? 'Alle Helden +1 Würfel auf die nächste Probe.' : 'Etwas Lustiges passiert, nie ein Nachteil.'}</p>
           <button class="knopf" data-aktion="kruemel" data-sz="${s.sz.id}" data-w="">Zurücksetzen</button></div>`
        : `<h2>${esc(k.name)} würfelt!</h2><div class="knopfreihe">
           <button class="knopf voll gross" data-aktion="kruemel" data-sz="${s.sz.id}" data-w="4–6">4 bis 6</button>
           <button class="knopf gross" data-aktion="kruemel" data-sz="${s.sz.id}" data-w="1–3">1 bis 3</button></div>`}
      <p class="meta">${esc(D.regeln.kruemel.gluckswurf || '')}</p>`;
  },

  hinweis(s) {
    return `<p class="art">${esc(s.titel)}</p><p class="vorlese">${esc(s.text)}</p>`;
  },

  ende(s) {
    const k = kruemel();
    const naechste = ABENTEUER.szenen[s.si + 1];
    return `<p class="art">Szenenende</p>
      <h1>${esc(s.sz.titel)} geschafft!</h1>
      ${!s.letzte || kruemelHatGewuerfelt() ? '' : `<div class="notiz"><b>${esc(k.name)} hat in diesem Abenteuer noch nicht gewürfelt!</b>
        <div class="knopfreihe"><button class="knopf voll" data-aktion="kruemel" data-sz="${s.sz.id}" data-w="4–6">4 bis 6</button>
        <button class="knopf" data-aktion="kruemel" data-sz="${s.sz.id}" data-w="1–3">1 bis 3</button></div></div>`}
      <p>${naechste ? `Weiter mit Szene ${s.si + 2}: <b>${esc(naechste.titel)}</b>` : 'Weiter zum Abschluss.'}</p>`;
  },

  abschluss() {
    const a = ABENTEUER.abschluss || {};
    const vergeben = ST.fertig.includes(ABENTEUER.id);
    const aufsteiger = anwesendeHelden().filter(h => {
      const n = heldStand(h).stempel.length;
      return n > 0 && n % D.regeln.aufstieg.nachStempeln === 0;
    });
    return `<p class="art">Abschluss</p>
      <h1>${esc(ABENTEUER.titel)}</h1>
      ${(a.vorlesen || []).map(t => `<p class="vorlese">${esc(t)}</p>`).join('')}
      ${a.punkte?.length ? `<div class="kasten"><h2>Jetzt</h2>${liste(a.punkte)}</div>` : ''}
      ${vergeben
        ? `<div class="kasten"><h2>${ABENTEUER.stempel ? `Stempel „${esc(ABENTEUER.stempel)}“ vergeben` : 'Abenteuer abgeschlossen'}</h2>
           ${aufsteiger.length && ABENTEUER.stempel ? `<p><b>Aufstieg für:</b> ${aufsteiger.map(h => esc(heldName(h))).join(', ')}</p>${liste(D.regeln.aufstieg.wahl)}` : ''}
           <button class="knopf" data-aktion="stempel-weg">Rückgängig</button></div>`
        : `<button class="knopf voll breit gross" data-aktion="stempel">${ABENTEUER.stempel ? `Stempel „${esc(ABENTEUER.stempel)}“ vergeben` : 'Abenteuer abschließen'}</button>`}
      <button class="knopf breit" data-aktion="heim">Zurück zum Start</button>`;
  }
};

// Krümel würfelt einmal pro Abenteuer. Gezählt wird jeder Wurf in irgendeiner Szene.
const kruemelHatGewuerfelt = () => ABENTEUER.szenen.some(sz => ST.kruemel.wurf[sz.id]);

function kampfStand(schluessel, anzahl, herzen) {
  let k = ST.kampf[schluessel];
  if (!k || k.herzen.length !== anzahl) {
    k = ST.kampf[schluessel] = { runde: 1, herzen: Array(anzahl).fill(herzen) };
  }
  return k;
}

// ---------- Bildschirme ----------

const stummKnopf = () => `<button class="rund" data-aktion="stumm" aria-label="Ton an oder aus">${ST.stumm ? '🔇' : '🔊'}</button>`;

function zeigeStart() {
  ansicht = 'start';
  spieleMusik(null);
  const lauf = ST.abenteuerId && D.abenteuer.find(a => a.id === ST.abenteuerId);
  app.innerHTML = `
    <header class="kopf"><div class="titel"><b>Die Bibliothek der Zeiten</b><small>Spielleiter-Walkthrough</small></div>
      ${stummKnopf()}<button class="rund" data-aktion="hilfe">Hilfe</button></header>
    <main class="inhalt">
      ${lauf ? `<button class="knopf voll breit gross" data-aktion="fortsetzen">Fortsetzen: ${esc(lauf.titel)}</button>` : ''}
      <h2>Wer spielt heute mit?</h2>
      ${D.helden.map(h => `<label class="held-wahl"><input type="checkbox" data-aktion="anwesend" data-held="${h.id}" ${ST.anwesend.includes(h.id) ? 'checked' : ''}>
        <span><b>${esc(heldName(h))}</b><br><small>${esc(h.spieler)} · ${esc(h.wer)}</small></span></label>`).join('')}
      <p class="meta">${esc(kruemel().name)} ist immer dabei.</p>
      <h2>Neuer Spielabend</h2>
      ${D.abenteuer.map(a => `<button class="abenteuer-knopf ${a.nummer === 0 ? 'erster' : ''}" data-aktion="neu" data-id="${a.id}">
        <b>${a.nummer === 0 ? 'Erster Abend: ' : `${a.nummer}. `}${esc(a.titel)}${ST.fertig.includes(a.id) ? ' ✓' : ''}</b>
        <small>${esc(a.epoche)} · ${esc(a.dauerMin)} Minuten</small></button>`).join('')}
      <button class="knopf breit" data-aktion="tracker">Helden-Tracker</button>
      <button class="knopf breit" data-aktion="soundboard">Soundboard</button>
    </main>`;
}

function zeigeSchritt(neu = true) {
  ansicht = 'walk';
  const s = SCHRITTE[ST.schritt];
  const sz = s.sz;
  const kopfTitel = sz ? sz.titel : ABENTEUER.titel;
  app.innerHTML = `
    <header class="kopf">
      <button class="rund" data-aktion="heim" aria-label="Start">⌂</button>
      <button class="titel" data-aktion="uebersicht"><b>${esc(kopfTitel)}</b><small>Schritt ${ST.schritt + 1} von ${SCHRITTE.length} · Übersicht</small></button>
      ${stummKnopf()}
      <button class="rund" data-aktion="hilfe">Hilfe</button>
    </header>
    <main class="inhalt ${neu ? 'neu' : ''}">${KARTE[s.art](s)}</main>
    <nav class="fuss">
      <button data-aktion="zurueck" ${ST.schritt === 0 ? 'disabled' : ''}>‹ Zurück</button>
      <button data-aktion="tracker">Helden</button>
      <button data-aktion="soundboard">Sounds</button>
      <button class="weiter" data-aktion="weiter" ${ST.schritt >= SCHRITTE.length - 1 ? 'disabled' : ''}>Weiter ›</button>
    </nav>`;
  fuelleBilder(app);
  wachHalten();
  spieleMusik(musikFuer(ST.schritt));
}

function neuZeichnen() {
  if (ansicht === 'walk') {
    const oben = app.querySelector('.inhalt')?.scrollTop || 0;
    zeigeSchritt(false);
    app.querySelector('.inhalt').scrollTop = oben;
  } else zeigeStart();
}

function gehe(zu) {
  ST.schritt = Math.max(0, Math.min(SCHRITTE.length - 1, zu));
  speichere();
  zeigeSchritt();
  app.querySelector('.inhalt').scrollTop = 0;
}

function starteAbenteuer(id) {
  ST.abenteuerId = id;
  ST.schritt = 0;
  ST.kruemel.wurf = {};
  ST.kampf = {};
  ST.geloest = {};
  D.helden.forEach(h => { const st = heldStand(h); st.herzen = herzenMax(h); st.zauberBenutzt = false; });
  speichere();
  oeffneAbenteuer();
}

function oeffneAbenteuer() {
  ABENTEUER = D.abenteuer.find(a => a.id === ST.abenteuerId);
  if (!ABENTEUER) { ST.abenteuerId = null; speichere(); return zeigeStart(); }
  SCHRITTE = baueSchritte(ABENTEUER);
  if (ST.schritt >= SCHRITTE.length) ST.schritt = 0;
  zeigeSchritt();
}

// ---------- Ebenen: Helden-Tracker, Übersicht, Hilfe ----------

function oeffneEbene(titel, inhalt) {
  ebene.innerHTML = `<div class="blatt"><div class="blatt-kopf"><h1>${esc(titel)}</h1>
    <button class="knopf voll" data-aktion="ebene-zu">Fertig</button></div><div class="ebene-inhalt">${inhalt}</div></div>`;
  ebene.hidden = false;
}
function schliesseEbene() { ebene.hidden = true; ebene.innerHTML = ''; }

function trackerInhalt() {
  const k = kruemel();
  const wurf = ABENTEUER && ansicht === 'walk' ? ABENTEUER.szenen.map(sz => ST.kruemel.wurf[sz.id]).find(Boolean) : null;
  return anwesendeHelden().map(h => {
    const st = heldStand(h);
    return `<div class="held">
      <div class="held-name"><button data-aktion="umbenennen" data-held="${h.id}">${esc(heldName(h))} ✎</button><small>${esc(h.spieler)}</small></div>
      <div class="zaehler"><span class="label">Herzen</span>
        <button class="knopf" data-aktion="wert" data-held="${h.id}" data-feld="herzen" data-d="-1">−</button>
        <span class="wert" style="color:var(--rot)">${'♥'.repeat(st.herzen)}${'♡'.repeat(Math.max(0, herzenMax(h) - st.herzen))}</span>
        <button class="knopf" data-aktion="wert" data-held="${h.id}" data-feld="herzen" data-d="1">+</button></div>
      <div class="zaehler"><span class="label">Glückssterne</span>
        <button class="knopf" data-aktion="wert" data-held="${h.id}" data-feld="gluecksstern" data-d="-1">−</button>
        <span class="wert">★ ${st.gluecksstern}</span>
        <button class="knopf" data-aktion="wert" data-held="${h.id}" data-feld="gluecksstern" data-d="1">+</button></div>
      <label class="zauber"><input type="checkbox" data-aktion="zauber" data-held="${h.id}" ${st.zauberBenutzt ? 'checked' : ''}>
        <span><b>${esc(h.zaubergegenstand.name)}</b> benutzt</span></label>
      <details><summary class="meta">Talent und Zaubergegenstand</summary>
        <p><b>${esc(h.talent.name)}</b> (+${h.talent.bonus}): ${esc(h.talent.gilt)}</p>
        <p>${esc(h.zaubergegenstand.regel)}</p></details>
      <p class="meta">Stempel: ${st.stempel.length ? esc(st.stempel.join(', ')) : 'noch keine'}</p>
    </div>`;
  }).join('') + `<div class="held"><div class="held-name"><b>${esc(k.name)}</b><small>${esc(k.spieler || '')}</small></div>
      ${ABENTEUER && ansicht === 'walk' ? `<p>In diesem Abenteuer: ${wurf ? `gewürfelt (${wurf})` : '<b>noch nicht gewürfelt</b>'}</p>` : ''}
      <p class="meta">Stempel: ${ST.kruemel.stempel.length ? esc(ST.kruemel.stempel.join(', ')) : 'noch keine'}</p></div>`;
}

function zeigeTracker() { oeffneEbene('Helden', trackerInhalt()); ebene.dataset.art = 'tracker'; }

function zeigeSoundboard() {
  const sz = ansicht === 'walk' ? SCHRITTE[ST.schritt]?.sz : null;
  const ort = sz?.schauplatz;
  const hier = D.sounds.filter(g => g.schauplatz.includes('alle') || (ort && g.schauplatz.includes(ort)));
  const rest = D.sounds.filter(g => !hier.includes(g));
  const raster = liste => `<div class="sound-raster">${liste.map(g =>
    `<button class="sound" data-aktion="geraeusch" data-id="${esc(g.id)}"><b>${esc(g.name)}</b><small>${esc(g.wann)}</small></button>`).join('')}</div>`;
  oeffneEbene('Soundboard', `
    <div class="lautstaerke">
      <button class="knopf" data-aktion="stumm">${ST.stumm ? '🔇 Ton aus' : '🔊 Ton an'}</button>
      <label>Musik ${Math.round(ST.lautstaerke * 100)} %<input type="range" min="0" max="100" step="5" value="${Math.round(ST.lautstaerke * 100)}" data-aktion="lautstaerke"></label>
    </div>
    ${ort ? `<h2>Hier: ${esc(sz.ort)}</h2>${raster(hier)}<h2>Alle anderen</h2>${raster(rest)}` : raster(D.sounds)}`);
  ebene.dataset.art = 'soundboard';
}

function zeigeUebersicht() {
  let html = '<ul class="schritt-liste">';
  let letzteSzene = null;
  SCHRITTE.forEach((s, i) => {
    if (s.sz && s.sz !== letzteSzene) { letzteSzene = s.sz; html += `<li class="szene-kopf">${esc(s.sz.titel)}</li>`; }
    if (!s.sz && s.art === 'abschluss') html += '<li class="szene-kopf">Ende</li>';
    html += `<li><button data-aktion="springe" data-i="${i}" class="${i === ST.schritt ? 'aktuell' : ''}">${i + 1}. ${esc(kurzname(s))}</button></li>`;
  });
  oeffneEbene('Alle Schritte', html + '</ul>');
  ebene.dataset.art = 'uebersicht';
  ebene.querySelector('.aktuell')?.scrollIntoView({ block: 'center' });
}

let hilfeReiter = 'planb';
async function zeigeHilfe(reiter = hilfeReiter) {
  hilfeReiter = reiter;
  const reiterListe = [
    ...(ABENTEUER && ansicht === 'walk' ? [['planb', 'Plan B']] : []),
    ['spick', 'Spickzettel'], ['spieler', 'Spielerkarte'], ['regeln', 'Wahrscheinlichkeit'], ['quellen', 'Quellen']
  ];
  if (!reiterListe.some(r => r[0] === reiter)) reiter = hilfeReiter = reiterListe[0][0];
  let inhalt = '';
  try {
    if (reiter === 'planb') inhalt = (ABENTEUER.planB || []).map(p => `<div class="kasten"><h2>${esc(p.situation)}</h2><p>${esc(p.loesung)}</p></div>`).join('') || '<p>Kein Plan B in diesem Abenteuer.</p>';
    if (reiter === 'spick') inhalt = `<div class="md">${markdown(await ladeText('docs/spickzettel.md'))}</div>`;
    if (reiter === 'spieler') inhalt = `<div class="md">${markdown(await ladeText('docs/spielerkarte.md'))}</div>`;
    if (reiter === 'regeln') {
      const w = D.regeln.wahrscheinlichkeiten;
      inhalt = `<p>Chance, dass es klappt:</p><table class="werte"><tr><th>Würfel</th><th>ab 4</th><th>ab 5</th><th>ab 6</th></tr>
        ${w.tabelle.map(z => `<tr><td class="zahl">${z.wuerfel}</td><td>${z.leicht}</td><td>${z.schwer}</td><td>${z.episch}</td></tr>`).join('')}</table>
        <p class="meta">${esc(w.quelle)}</p>`;
    }
    if (reiter === 'quellen') {
      const q = await ladeJson('data/quellen.json');
      inhalt = `<p>Musik und Geräusche in dieser App:</p>${q.quellen.map(x => `<div class="kasten">
        <p><b>„${esc(x.titel)}“</b> · ${esc(x.von)}</p>
        <p class="meta">${esc(x.datei)}</p>
        <p><a href="${esc(q.lizenzen[x.lizenz] || x.url)}" target="_blank" rel="noopener">${esc(x.lizenz)}</a> · <a href="${esc(x.url)}" target="_blank" rel="noopener">Quelle</a></p>
      </div>`).join('')}`;
    }
  } catch (e) { inhalt = `<p>Konnte nicht laden: ${esc(e.message)}</p>`; }
  oeffneEbene('Hilfe', `<div class="reiter">${reiterListe.map(([id, name]) => `<button data-aktion="hilfe-reiter" data-r="${id}" class="${id === reiter ? 'an' : ''}">${name}</button>`).join('')}</div>${inhalt}`);
  ebene.dataset.art = 'hilfe';
}

// Kleiner Markdown-Leser für die Dateien in docs/: Überschriften, Listen, Tabellen, fett, kursiv, Code.
function markdown(md) {
  const inline = t => esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\*(.+?)\*/g, '<i>$1</i>').replace(/`(.+?)`/g, '<code>$1</code>');
  const zeilen = md.replace(/\r/g, '').split('\n');
  let html = '', listeTyp = null, tabelle = null;
  const schliesse = () => {
    if (listeTyp) { html += `</${listeTyp}>`; listeTyp = null; }
    if (tabelle) { html += `<table>${tabelle.map((z, i) => `<tr>${z.map(c => i === 0 ? `<th>${inline(c)}</th>` : `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</table>`; tabelle = null; }
  };
  for (const z of zeilen) {
    let m;
    if (/^\s*\|/.test(z)) {
      if (listeTyp) { html += `</${listeTyp}>`; listeTyp = null; }
      if (/^\s*\|[\s:|-]+\|\s*$/.test(z)) continue;
      (tabelle ||= []).push(z.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim()));
    } else if ((m = z.match(/^(#{1,3})\s+(.*)/))) {
      schliesse(); const n = Math.min(3, m[1].length + 1); html += `<h${n}>${inline(m[2])}</h${n}>`;
    } else if ((m = z.match(/^\s*([-*]|\d+\.)\s+(.*)/))) {
      if (tabelle) schliesse();
      const typ = /\d/.test(m[1]) ? 'ol' : 'ul';
      if (listeTyp !== typ) { if (listeTyp) html += `</${listeTyp}>`; html += `<${typ}>`; listeTyp = typ; }
      html += `<li>${inline(m[2])}</li>`;
    } else if (z.trim() === '') {
      schliesse();
    } else {
      schliesse(); html += `<p>${inline(z)}</p>`;
    }
  }
  schliesse();
  return html;
}

// ---------- Bedienung ----------

async function aktion(el) {
  const a = el.dataset.aktion;
  const held = el.dataset.held && D.helden.find(h => h.id === el.dataset.held);
  switch (a) {
    case 'weiter': return gehe(ST.schritt + 1);
    case 'zurueck': return gehe(ST.schritt - 1);
    case 'heim': schliesseEbene(); return zeigeStart();
    case 'fortsetzen': return oeffneAbenteuer();
    case 'neu': {
      const ab = D.abenteuer.find(x => x.id === el.dataset.id);
      if (ST.abenteuerId && !confirm(`„${ab.titel}“ neu starten?\nHerzen werden aufgefüllt, Zaubergegenstände wieder frei. Sterne und Stempel bleiben.`)) return;
      return starteAbenteuer(ab.id);
    }
    case 'anwesend': {
      const id = el.dataset.held;
      ST.anwesend = el.checked ? [...new Set([...ST.anwesend, id])] : ST.anwesend.filter(x => x !== id);
      return speichere();
    }
    case 'klasse': ST.klasse = Number(el.dataset.k); speichere(); return neuZeichnen();
    case 'geloest':
      ST.geloest[el.dataset.s] = held.id; heldStand(held).gluecksstern++; speichere();
      ereignis('raetselGeloest'); return neuZeichnen();
    case 'geloest-weg': {
      const h = D.helden.find(x => x.id === ST.geloest[el.dataset.s]);
      if (h) heldStand(h).gluecksstern = Math.max(0, heldStand(h).gluecksstern - 1);
      delete ST.geloest[el.dataset.s]; speichere(); return neuZeichnen();
    }
    case 'herz': {
      const k = ST.kampf[el.dataset.s]; const g = Number(el.dataset.g); const j = Number(el.dataset.j);
      k.herzen[g] = j < k.herzen[g] ? j : j + 1; speichere(); return neuZeichnen();
    }
    case 'runde': {
      const k = ST.kampf[el.dataset.s]; k.runde = Math.max(1, k.runde + Number(el.dataset.d)); speichere(); return neuZeichnen();
    }
    case 'kruemel':
      if (el.dataset.w) ST.kruemel.wurf[el.dataset.sz] = el.dataset.w; else delete ST.kruemel.wurf[el.dataset.sz];
      if (el.dataset.w) ereignis(el.dataset.w === '4–6' ? 'kruemelGut' : 'kruemelLustig');
      speichere(); return neuZeichnen();
    case 'stempel': {
      if (ABENTEUER.stempel) {
        anwesendeHelden().forEach(h => { const st = heldStand(h); if (!st.stempel.includes(ABENTEUER.stempel)) st.stempel.push(ABENTEUER.stempel); });
        if (!ST.kruemel.stempel.includes(ABENTEUER.stempel)) ST.kruemel.stempel.push(ABENTEUER.stempel);
      }
      if (!ST.fertig.includes(ABENTEUER.id)) ST.fertig.push(ABENTEUER.id);
      ereignis('stempel');
      speichere(); return neuZeichnen();
    }
    case 'stempel-weg': {
      if (ABENTEUER.stempel) {
        D.helden.forEach(h => { const st = heldStand(h); st.stempel = st.stempel.filter(x => x !== ABENTEUER.stempel); });
        ST.kruemel.stempel = ST.kruemel.stempel.filter(x => x !== ABENTEUER.stempel);
      }
      ST.fertig = ST.fertig.filter(x => x !== ABENTEUER.id);
      speichere(); return neuZeichnen();
    }
    case 'bild': return zeigeBild(el.dataset.pfad);
    case 'tracker': return zeigeTracker();
    case 'soundboard': return zeigeSoundboard();
    case 'geraeusch': return spieleGeraeusch(el.dataset.id);
    case 'stumm':
      ST.stumm = !ST.stumm; speichere(); setzeLautstaerke();
      if (ebene.dataset.art === 'soundboard' && !ebene.hidden) zeigeSoundboard();
      return ansicht === 'walk' ? zeigeSchritt(false) : zeigeStart();
    case 'lautstaerke':
      ST.lautstaerke = Number(el.value) / 100; speichere(); setzeLautstaerke();
      el.parentElement.firstChild.textContent = `Musik ${el.value} % `;
      return;
    case 'uebersicht': return zeigeUebersicht();
    case 'hilfe': return zeigeHilfe();
    case 'hilfe-reiter': return zeigeHilfe(el.dataset.r);
    case 'ebene-zu': schliesseEbene(); return neuZeichnen();
    case 'springe': schliesseEbene(); return gehe(Number(el.dataset.i));
    case 'wert': {
      const st = heldStand(held); const feld = el.dataset.feld;
      const max = feld === 'herzen' ? herzenMax(held) : Infinity;
      st[feld] = Math.max(0, Math.min(max, st[feld] + Number(el.dataset.d)));
      speichere(); return zeigeTracker();
    }
    case 'zauber': heldStand(held).zauberBenutzt = el.checked; return speichere();
    case 'umbenennen': {
      const neuName = prompt('Wie heißt der Held?', heldName(held));
      if (neuName && neuName.trim()) { heldStand(held).name = neuName.trim(); speichere(); }
      return zeigeTracker();
    }
  }
}

document.addEventListener('click', e => {
  const el = e.target.closest('[data-aktion]');
  if (!el || el.type === 'checkbox' || el.type === 'range') return;
  aktion(el);
});
document.addEventListener('change', e => {
  if (e.target.matches('input[type=checkbox][data-aktion]')) aktion(e.target);
});
document.addEventListener('input', e => {
  if (e.target.matches('input[type=range][data-aktion]')) aktion(e.target);
});
ebene.addEventListener('click', e => { if (e.target === ebene) { schliesseEbene(); neuZeichnen(); } });

// Wischen nach links/rechts blättert.
let wischStart = null;
app.addEventListener('touchstart', e => {
  if (ansicht !== 'walk' || e.touches.length !== 1) return;
  wischStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
}, { passive: true });
app.addEventListener('touchend', e => {
  if (!wischStart) return;
  const dx = e.changedTouches[0].clientX - wischStart.x;
  const dy = e.changedTouches[0].clientY - wischStart.y;
  wischStart = null;
  if (Math.abs(dx) > 70 && Math.abs(dy) < 50) gehe(ST.schritt + (dx < 0 ? 1 : -1));
}, { passive: true });

// Bildschirm bleibt im Walkthrough an.
let wachSperre = null;
async function wachHalten() {
  try {
    if ('wakeLock' in navigator && !wachSperre) {
      wachSperre = await navigator.wakeLock.request('screen');
      wachSperre.addEventListener('release', () => { wachSperre = null; });
    }
  } catch { /* Handy erlaubt es gerade nicht */ }
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && ansicht === 'walk') wachHalten();
});

// ---------- Start ----------

async function starte() {
  try {
    const [regeln, helden, figuren, index, sounds] = await Promise.all([
      ladeJson('data/regeln.json'), ladeJson('data/helden.json'), ladeJson('data/figuren.json'), ladeJson('data/abenteuer/index.json'),
      ladeJson('data/sounds.json')
    ]);
    const abenteuer = await Promise.all(index.abenteuer.map(d => ladeJson(`data/abenteuer/${d}`)));
    abenteuer.sort((a, b) => a.nummer - b.nummer);
    D = {
      regeln, helden: helden.helden, begleiter: helden.begleiter || [],
      figuren: Object.fromEntries(figuren.figuren.map(f => [f.id, f])), abenteuer,
      sounds: sounds.sounds || [], soundEreignisse: sounds.ereignisse || {}
    };
  } catch (e) {
    app.innerHTML = `<main class="inhalt"><h1>Die Bibliothek klemmt</h1><p>Eine Datei konnte nicht geladen werden:</p><p><code>${esc(e.message)}</code></p>
      <p class="meta">Meist ist eine JSON-Datei kaputt, zum Beispiel ein fehlendes Komma.</p></main>`;
    return;
  }
  ST = ladeStand() || neuerStand();
  ST.lautstaerke ??= 0.3;
  ST.stumm ??= false;
  ST.anwesend = ST.anwesend.filter(id => D.helden.some(h => h.id === id));
  D.helden.forEach(heldStand);
  speichere();
  if (ST.abenteuerId) oeffneAbenteuer(); else zeigeStart();
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
    navigator.serviceWorker.ready.then(r => r.active && r.active.postMessage('vorladen')).catch(() => {});
  });
}

starte();
