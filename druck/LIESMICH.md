# Druckvorlagen

`Druckvorlagen.pdf` enthält alles zum Ausdrucken, 13 Seiten A4, weißer Hintergrund.

| Seite | Was | Wann |
| --- | --- | --- |
| 1–4 | Heldenbögen Marvin, Melanie, Filipa, Emilia. Vorausgefüllt sind nur „Gespielt von“, Eigenschaften, Talent und Zaubergegenstand. | erster Abend |
| 5 | Leerer Heldenbogen | Reserve |
| 6 | Spielerkarten „So spielst du“, 4 Stück auf einer Seite | erster Abend, ausschneiden |
| 7–8 | Figurenkarten Blatt 1 und 2, ohne Werte, Schwachstellen und Geheimnisse | erster Abend, ausschneiden |
| 9 | Handout „Gaius' Zahlen-Tafel“ (Abenteuer 1) | erster Abend |
| 10 | Handout „Neferets Hieroglyphen-Tafel“ (Abenteuer 2) | später |
| 11 | Karte Römerlager (quer) | optional, die App zeigt sie auch |
| 12–13 | Karten Ägypten und Burg (quer) | später |

Die Karten und Figurenkarten verraten nichts über den Ablauf: keine Legende, keine Reihenfolge, keine Schwachstellen.

Beim Drucken „Tatsächliche Größe“ bzw. „100 %“ wählen, nicht „An Seite anpassen“.

## Neu erzeugen

Ändern sich Helden in `data/helden.json`, Figuren in `data/figuren.json` oder Zeichnungen in `assets/quelle/`, Claude Code bitten: „Erzeuge die Druckvorlagen neu.“ Technisch:

1. `node werkzeuge/druckvorlagen.js` schreibt `druck/druckvorlagen.html`, die beiden Vorschauen und die Karten der App (`assets/bilder/karte-*.svg`).
2. Den Testserver starten (`node werkzeuge/server.js`) und Chrome im Hintergrund drucken lassen: `chrome --headless=new --no-pdf-header-footer --virtual-time-budget=15000 --print-to-pdf=druck/Druckvorlagen.pdf http://localhost:8080/druck/druckvorlagen.html`
