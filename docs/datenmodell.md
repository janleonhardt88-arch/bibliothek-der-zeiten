# Datenmodell der Abenteuer

Jedes Abenteuer ist eine Datei in `data/abenteuer/`. Ein neues Abenteuer muss zusätzlich in `data/abenteuer/index.json` eingetragen werden, sonst sieht die App es nicht.

Die App zeigt die Felder einer Szene in der Reihenfolge, in der sie in der Datei stehen. So kann zum Beispiel `nachVorlesen` vor oder nach einem Rätsel kommen. Die Tabelle unten ist nur die übliche Reihenfolge.

Bilder: Steht in den Daten `bild.png`, sucht die App erst `bild.png`, dann `bild.svg`, dann `bild.html`.

## Abenteuer

| Feld | Typ | Bedeutung |
| --- | --- | --- |
| `id` | Text | Eindeutig, z. B. `a1-roemerlager` |
| `nummer` | Zahl | Reihenfolge |
| `titel`, `epoche`, `stempel` | Text | Anzeige und Stempelname |
| `dauerMin` | Text | z. B. `"35-45"` |
| `kurz` | Text | Ein Satz Zusammenfassung |
| `karte` | Pfad | Bild der Karte |
| `vorbereitung` | Liste Text | Was auf den Tisch muss |
| `szenen` | Liste Szene | Siehe unten |
| `abschluss` | Objekt | `musik`, `vorlesen` (Liste), `punkte` (Liste) |
| `planB` | Liste | `{ situation, loesung }` |
| `erklaerHinweis` | Text | Hinweis für den Spielleiter auf der Startkarte (nur Übungsszene) |

## Szene, in Anzeige-Reihenfolge

| Feld | Typ | Bedeutung |
| --- | --- | --- |
| `id`, `titel`, `ort`, `dauerMin` | | Kopf der Szene |
| `schauplatz` | Text | `bibliothek`, `roemerlager`, `aegypten` oder `burg`. Steuert, welche Geräusche oben im Soundboard stehen |
| `musik`, `kampfMusik`, `versoehnungsMusik` | `{ datei, stimmung }` | Dateiname in `assets/musik/` |
| `bild` | Pfad | Bild für „Bild zeigen“ |
| `nachUebung` | Text | Hinweis, wenn vorher die Übungsszene lief |
| `vorlesen` | Liste Text | Vorlesetexte am Szenenanfang |
| `figurHinweis` | Text | Hinweis zu einer Figur |
| `kruemel` | Text | Krümels Moment in dieser Szene |
| `lernFakten` | Liste `{ von, text, regie? }` | Wissen, das eine Figur erzählt |
| `nachVorlesen` | Liste Text | Vorlesetexte nach den ersten Aufgaben |
| `raetsel` | Liste Rätsel | Siehe unten |
| `proben` | Liste `{ was, eigenschaften[], schwierigkeit, hinweis? }` | Schwierigkeit 4, 5 oder 6 |
| `kampf` | Objekt | `gegner` (id aus `figuren.json`), `anzahl` (Zahl oder `"wie Helden"`), `schwachstelle`, `hinweis?`, `fallback?`, `lernFakt?`, `schloss?` |
| `schloss` | `{ was, eigenschaft, schwierigkeit, ohneSchlossknacker }` | Nur wo es zur Geschichte passt |
| `loesung` | Text | Wie die Szene endet |
| `schlussVorlesen` | Liste Text | Letzter Vorlesetext der Szene |
| `uebergang` | Text | Überleitung in die nächste Szene |

## Rätsel

| Feld | Bedeutung |
| --- | --- |
| `von` | Wer das Rätsel stellt |
| `thema` | Mathe, Tiere, Pflanzen, Geschichte, Hieroglyphen … |
| `einleitung?` | Satz vor dem Rätsel |
| `klasse1`, `klasse2` | `{ frage, antwort }` |
| `belohnung` | Meist „1 Glücksstern“ |
| `handout?` | Bild, das dazu gezeigt wird |
| `ohneLoesung?` | Probe, falls niemand die Lösung findet |
| `extra?`, `keinSchloss?` | Zusatzhinweise |

Neue Felder sind erlaubt. Dann diese Tabelle ergänzen und die App so bauen, dass unbekannte Felder als Hinweistext erscheinen.
