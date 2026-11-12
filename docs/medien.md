# Musik und Bilder

Stand 2026-11-12: Alle 12 Musikstücke und 20 Geräusche liegen in `assets/`. Herkunft und Lizenz jeder Datei stehen in `data/quellen.json`, die App zeigt sie unter Hilfe → Quellen. Wer eine Datei austauscht, trägt die neue Quelle dort ein.

## Musik

Lege die Dateien in `assets/musik/` mit genau diesen Namen ab. Die App findet sie dann von selbst.

| Datei | Wofür | Stimmung |
| --- | --- | --- |
| `bibliothek.mp3` | Bibliothek, jedes Abenteuer | geheimnisvoll, gemütlich, leise Spieluhr |
| `roemerlager.mp3` | Abenteuer 1, Szene 2 | Marschtrommeln, Lagerfeuer, Vögel |
| `dino.mp3` | Abenteuer 1, Szene 3 | tapsig, Tuba, fröhlich |
| `nil.mp3` | Abenteuer 2, Szene 1 | warm, Wasserplätschern, Flöte |
| `wueste.mp3` | Abenteuer 2, Szene 2 | Wind, Trommel, leicht komisch |
| `pyramide.mp3` | Abenteuer 2, Szene 3 | dunkel, hallend, spannend, nicht gruselig |
| `burg.mp3` | Abenteuer 3, Szene 1 | Laute, Fanfare, heiter |
| `turm.mp3` | Abenteuer 3, Szene 2 | aufsteigend, Spannung, Fackelknistern |
| `boss.mp3` | Abenteuer 3, Szene 3 | dramatisch-komisch, Cembalo |
| `versoehnung.mp3` | Abenteuer 3, Versöhnung | sanft, Klavier, rührend |
| `kampf-lustig.mp3` | Alle Kämpfe | schnell, verspielt, Pizzicato |
| `sieg.mp3` | Jeder Abschluss | feierlich, Glockenspiel |

Mögliche Quellen für lizenzfreie Musik sind Tabletop Audio, Pixabay Music und Incompetech. Deren aktuelle Lizenzbedingungen sind nicht geprüft. Bitte vor dem Herunterladen selbst lesen, auch wenn ihr nur zu Hause spielt.

## Geräusche

Die Liste steht in `data/sounds.json`: 20 kurze Geräusche, von „Tür knarzt“ bis „Huhn gackert“. Lege die Dateien mit genau diesen Namen in `assets/sounds/`. Kurze Geräusche unter 3 Sekunden funktionieren am besten.

Freesound und Pixabay Sound Effects sind mögliche Quellen. Auch hier sind die Lizenzbedingungen nicht geprüft.

## Bilder

Alle Zeichnungen sind Originale aus dem Canvas „Spielmaterial – Bibliothek der Zeiten“ auf claude.ai. Der Quelltext liegt in `assets/quelle/`.

| Datei in `assets/bilder/` | Herkunft |
| --- | --- |
| `karte-roemerlager.png` | Artboard „Karte Römerlager“ |
| `karte-aegypten.png` | Artboard „Karte Ägypten“ |
| `karte-burg.png` | Artboard „Karte Burg“ |
| `handout-hieroglyphen.png` | Artboard „Handout Hieroglyphen“ |
| `handout-roemische-zahlen.png` | Artboard „Handout Römische Zahlen“ |
| `eulalia.png`, `kruemel.png`, `graefin-glitzer.png`, `kraehenbande.png` | Figurenkarten Blatt 1, je eine Zeichnung |
| `gaius.png`, `trixi.png`, `kamel-karl.png`, `ritter-rostig.png` | Figurenkarten Blatt 2, je eine Zeichnung |

Erledigt: Figuren und Karten liegen als `.svg` in `assets/bilder/`, die beiden Handouts als `.html`. Die App findet sie automatisch. Ein späteres PNG mit gleichem Namen hat Vorrang.

Für Neferet und das Nilpferd gibt es noch keine Zeichnung.
