# App-Spezifikation: Spielleiter-Walkthrough

## Ziel

Jan leitet mit dem Handy durch den Spielabend. Die App führt Schritt für Schritt durch das Abenteuer: Sie zeigt, was er vorliest, welches Rätsel kommt und welche Probe ansteht. Dazu spielt sie die Musik und die Geräusche des Schauplatzes. Jan muss nichts nachschlagen und nichts vorbereiten außer dem Material auf dem Tisch.

## Technik

- **Web-App, die sich wie eine App installieren lässt** (PWA). Läuft auf iPhone und Android, Symbol auf dem Startbildschirm.
- **Offline-fähig.** Nach dem ersten Laden braucht der Spielabend kein Internet.
- **Kein Server, keine Konten.** Spielstand bleibt auf dem Gerät gespeichert.
- **Inhalte aus `data/`.** Neue Abenteuer = neue JSON-Datei, kein Code.
- **Bedienung mit einer Hand.** Große Knöpfe unten, Daumen-Reichweite. Bildschirm bleibt während des Spiels an (Wake Lock).
- Vorschlag: Vite + React + TypeScript. Claude Code darf Einfacheres vorschlagen.

## Herzstück: der Walkthrough

Ein Abenteuer ist eine Folge von **Schritten**. Jeder Schritt ist eine Karte auf dem ganzen Bildschirm. Unten sind immer drei Knöpfe: **Zurück**, **Weiter** und **Soundboard**.

Die App baut die Schritte aus den Feldern jeder Szene, in der Reihenfolge aus `docs/datenmodell.md`. Ein Vorlesetext ist ein Schritt, ein Rätsel ist ein Schritt, eine Probe ist ein Schritt.

| Schritt-Art | Was die Karte zeigt | Was dabei passiert |
| --- | --- | --- |
| **Szenenbeginn** | Titel, Ort, Dauer, Bild als Hintergrund | Musik des Schauplatzes blendet ein |
| **Vorlesen** | Text in großer Schrift, mit Regie-Hinweisen in kleiner Schrift | Optional: Geräusch passend zum Text |
| **Lern-Fakt** | Wer es sagt, der Fakt, Stimmen-Tipp | Hinweis: „Emilia darf zuerst raten“, wenn es um Natur geht |
| **Rätsel** | Umschalter Klasse 1 / Klasse 2, Antwort verdeckt, Tipp-Knopf | Knopf „Gelöst“ vergibt einen Glücksstern an einen Helden |
| **Probe** | Was, welche Eigenschaft, ab welcher Zahl | Würfelanzahl pro Held wird angezeigt, inklusive Talent |
| **Kampf** | Gegner mit Herzen zum Antippen, Schwachstelle, Rundenzähler | Kampfmusik startet, Erinnerung an Spezialattacke |
| **Krümels Moment** | Großer Knopf „Krümel würfelt!“ | Fanfare bei 4–6, lustiges Geräusch bei 1–3 |
| **Szenenende** | Übergang zum Vorlesen | Musik blendet aus |
| **Abschluss** | Stempel, Glückssterne, Aufstieg | Siegesmusik, Stempel werden gespeichert |

Weitere Regeln:

- **Weiter wischt zur nächsten Karte.** Zurück geht immer, nichts geht verloren.
- **Szenen-Übersicht:** Ein Tipp auf den Titel zeigt alle Schritte. Jan kann springen, wenn die Spieler etwas überspringen.
- **Plan B:** Jede Karte hat oben rechts einen Knopf „Hilfe“. Er zeigt die passenden Plan-B-Einträge, den Spickzettel und die Spielerkarte.
- **Hinweise wie `nachUebung`** erscheinen als gelbe Notiz oben auf der Karte.
- **Krümel-Erinnerung:** Hat Krümel in einer Szene noch nicht gewürfelt, erscheint vor dem Szenenende eine Erinnerung.
- **Fortsetzen:** Die App merkt sich den letzten Schritt. Nach einer Pause geht es genau dort weiter.

## Ton

### Musik pro Schauplatz

- Jede Szene hat `musik`, Kampfszenen zusätzlich `kampfMusik`.
- Weiches Überblenden beim Szenenwechsel, etwa 2 Sekunden.
- Musik läuft in Schleife und leise genug, dass Jan darüber sprechen kann. Standard: 30 % Lautstärke.

### Soundboard

- Ein Knopf öffnet ein Raster mit Geräuschen aus `data/sounds.json`.
- Oben stehen die Geräusche des aktuellen Schauplatzes, darunter alle anderen.
- Ein Tipp spielt das Geräusch einmal über der Musik ab.

### Vorlesen lassen (optional)

- Ein Lautsprecher-Knopf auf Vorlese-Karten lässt das Handy den Text sprechen. Dafür nutzt die App die eingebaute Sprachausgabe des Handys.
- Die Qualität hängt von den deutschen Stimmen auf dem Handy ab. Standard ist aus, Jan liest selbst.

### Allgemein

- Lautstärke-Regler und Stumm-Knopf sind immer sichtbar.
- Fehlt eine Datei, läuft die App ohne Ton weiter und zeigt einen kleinen Hinweis.

## Weitere Bildschirme

1. **Start:** Abenteuer wählen (die Übungsszene a0 steht als „Erster Abend“ ganz oben), Fortsetzen, neuer Spielabend, anwesende Helden ankreuzen.
2. **Helden-Tracker:** Herzen, Glückssterne, Zaubergegenstand „benutzt“ (setzt sich pro Abenteuer zurück), Stempel. Ein Wisch nach oben aus dem Walkthrough öffnet ihn.
3. **Bild-Vollbild:** Karte, Figur oder Handout, zum Herumzeigen oder Spiegeln auf den Fernseher.
4. **Würfel-Helfer (optional):** für Abende ohne echte Würfel.

## Ausbaustufen

1. **Erste Version:** Walkthrough mit Vorlesen, Rätseln, Proben, Weiter/Zurück, Fortsetzen, Helden-Tracker, Bild-Vollbild.
2. **Zweite Version:** Musik pro Schauplatz, Soundboard, Kampf-Karte, Krümel-Knopf mit Geräuschen.
3. **Dritte Version:** Vorlesen lassen, Würfel-Helfer, Szenen-Übersicht zum Springen.
4. **Später:** Zweites Gerät als Tisch-Bildschirm für Bilder. Braucht eine Verbindung zwischen zwei Geräten; erst entscheiden, wenn Version 2 läuft.

## Offene Entscheidungen für Jan

- Bilder auf den Fernseher spiegeln oder das Handy herumzeigen? Davon hängt ab, ob die letzte Ausbaustufe nötig ist.
- Echte Würfel oder Würfel-Helfer? Für Emilia sind echte Würfel schöner.
