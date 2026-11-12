# Druckvorlagen

`Druckvorlagen.pdf` enthält alles zum Ausdrucken, 14 Seiten A4.

| Seite | Was | Wie oft drucken |
| --- | --- | --- |
| 1–4 | Heldenbögen für Marvin, Melanie, Filipa, Emilia, schon ausgefüllt | je 1× |
| 5 | Leerer Heldenbogen für neue Helden | nach Bedarf |
| 6–7 | Spielerkarte „So spielst du“, 2 pro Seite | je 1×, dann ausschneiden |
| 8–9 | Figurenkarten Blatt 1 und 2 | je 1×, dann ausschneiden |
| 10 | Handout „Gaius' Zahlen-Tafel“ (Abenteuer 1) | 1× |
| 11 | Handout „Neferets Hieroglyphen-Tafel“ (Abenteuer 2) | 1× |
| 12–14 | Karten Römerlager, Ägypten, Burg (Querformat) | optional, die App zeigt sie auch |

Beim Drucken „Tatsächliche Größe“ bzw. „100 %“ wählen, nicht „An Seite anpassen“. Farbe lohnt sich bei Bögen und Karten.

## Neu erzeugen

Ändern sich Helden in `data/helden.json` oder Zeichnungen in `assets/quelle/`, Claude Code bitten: „Erzeuge die Druckvorlagen neu.“ Technisch:

1. `node werkzeuge/druckvorlagen.js` schreibt `druck/druckvorlagen.html`.
2. Den Testserver starten (`node werkzeuge/server.js`) und Chrome im Hintergrund drucken lassen: `chrome --headless=new --no-pdf-header-footer --virtual-time-budget=15000 --print-to-pdf=druck/Druckvorlagen.pdf http://localhost:8080/druck/druckvorlagen.html`
