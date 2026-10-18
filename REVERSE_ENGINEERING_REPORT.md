# Reverse-Engineering-Bericht: B&D Word

Stand: 18. Oktober 2026. Dieses Projekt ist eine eigenständige Implementierung eines Word-inspirierten Texteditors. **Microsoft Word wurde nicht dekompiliert oder mit REA untersucht.** Als tatsächlich untersuchte offene Referenz dient **Quill 2.0.3 (BSD-3-Clause)**. Die Textengine von B&D Word ist **TipTap 3.32.0 / ProseMirror**, nicht Quill.

## 1. Umfang, Werkzeuge und Grenzen

Die Cloud läuft unter Debian/Linux. Vorhanden waren Node.js 24.19.0, npm 11.9.0, Java, GNU objdump, Chromium und Xorg mit Dummy-Treiber. `rea`, Wine und die üblichen Ghidra-/Hopper-/IDA-Startprogramme wurden anfangs nicht auf dem PATH gefunden. REA wurde über das offizielle npm-Paket `rea-agents@6.5.0` installiert. Das angegebene Repository `morluto/rea` wurde zusätzlich zur Dokumentationsprüfung gelesen; für Analysen lief das veröffentlichte CLI-Paket.

`rea doctor` meldete fehlende native Analyse-Engines und keinen geeigneten generischen nativen Einstiegspunkt für das Quill-Verzeichnis. Das bedeutet **nicht**, dass die anschließende spezialisierte JavaScript-Analyse fehlschlug: Diese benötigt keinen nativen Decompiler und wurde erfolgreich ausgeführt. Es wurden keine kommerziellen Tools nachinstalliert, Lizenzen umgangen oder Microsoft-Binärdateien beschafft. Eine vollständige Suche aller Systemverzeichnisse nach beliebigen Word-Installationen fand nicht statt; ein ausführbares Word für eine Live-Untersuchung stand nicht zur Verfügung.

Untersucht wurden die **ausgelieferten JavaScript-Module, TypeScript-Deklarationen und Source Maps** des npm-Pakets Quill sowie ein gezielter Ausschnitt zur Fettformatierung. Diese statische Analyse führt Quill nicht aus. Sie ist keine native Dekompilierung und liefert keinen Word-Quellcode. Vorhandene Source Maps können ursprünglichen TypeScript-Text enthalten; dessen Lesen ist ebenfalls keine Rückübersetzung von Maschinencode.

## 2. Tatsächliche REA-Aufrufe

Bei den ursprünglichen Aufrufen bezeichnet `REA` den vollständigen Pfad `/workspace/bd-tools/node_modules/.bin/rea`. Alle folgenden CLI-Aufrufe wurden wirklich ausgeführt. Umleitungen benennen die gespeicherten Ergebnisse unter `docs/analysis/`.

| Aufruf | Beobachtetes Ergebnis / Datei |
| --- | --- |
| `REA --version` | `6.5.0`, `rea-version.txt` |
| `REA --help` | Verfügbare CLI-Befehle, `rea-help.txt` |
| `REA analyze-javascript-application /workspace/bd-tools/node_modules/quill --json` | Erfolgreich; 199 ausgewählte Quelldateien verarbeitet. Vollständige Ausgabe unverändert gzip-komprimiert in `quill-rea.json.gz`; Fortschritt in `quill-rea.stderr` |
| `REA trace-application-feature --help` | Eingabe ist ein JSON-Workflow bzw. JSON-Dateipfad; Terminalausgabe |
| `REA doctor --help` | Optionen für Ziel, Client und Provider; Terminalausgabe |
| `REA doctor --target /workspace/bd-tools/node_modules/quill --json` | `healthy:false`; fehlende native Provider und ungeeignete generische Zielroute, `rea-doctor.json` |
| `REA trace-application-feature --schema` | Schemaausgabe im damaligen Standardformat TOON, keine JSON-Datei. Ein nachgeschalteter eigener JSON-Leseversuch schlug deshalb fehl. Kein Analyseergebnis |
| `REA trace-application-feature /tmp/rea-bold-input.json --json` | Fehlgeschlagen: REA meldete `ESTALE` beim Lesen der großen Workflowdatei; `quill-bold-trace.json`. Ursache nicht abschließend geklärt; kein erfolgreicher Trace daraus behauptet |
| `REA analyze-javascript-application /workspace/bd-reference/quill-bold --json` | Erfolgreiche Analyse einer flach kopierten Teilmenge, `quill-bold-rea.json` |
| `REA trace-application-feature /workspace/rea-bold-input-small.json --json` | Erfolgreich, aber erwartbar unvollständige Importauflösung wegen flacher Ablage; `quill-bold-focused-trace.json` |
| `REA analyze-javascript-application /workspace/bd-reference/quill-focus --json` | Korrektur: unveränderte Dateien mit ursprünglichen `formats/`- und `blots/`-Pfaden sowie Source Maps; `quill-focus-rea.json` |
| `REA trace-application-feature /workspace/rea-focus-input.json --json` | Erfolgreicher Trace ab Modul `formats/bold.js`, Richtung `outgoing`; `quill-focus-trace.json` |

Anschließend wurde der fokussierte Ablauf mit den separat gesperrten Paketen unter `analysis-tools/` reproduziert: `npm run analyze`. Das Skript ruft REA für Version, JavaScript-Analyse und Feature-Trace auf. **Die exakten aufgelösten Befehle, Exitcodes und Ausgabepfade stehen in `docs/analysis/reproduced/run-log.json`.** Die originale große Evidence wurde vor dem Entfernen der unkomprimierten Kopie byteweise per SHA-256 gegen die entpackte gzip-Datei geprüft: `57284799d70101492eff5ebff370239d045a38aa7dfc339b95ddc674d88293f4`.

Die fokussierten Dateien sind unverändert einschließlich Quill-Lizenz unter `docs/analysis/reference/` erhalten. Zusätzliche Lizenztexte der separat installierten Analysewerkzeuge und Referenzabhängigkeiten liegen in `docs/analysis/THIRD_PARTY_NOTICES.txt`. Die Workflow-Eingaben enthalten die jeweilige vollständige Evidence, den Modulnamen und die Richtung. Für die ursprünglichen temporären Eingabepfade sind diese Parameter im Skript und in den Ergebnisparametern nachvollziehbar; die großen temporären Dateien sind keine Voraussetzung für die Wiederholung.

## 3. Echtes Analyseergebnis: Fettformatierung

**Direkt aus REA:** Die erfolgreiche fokussierte Analyse hat die Evidence-ID `ev_d3f8cb6ed0bb8369e2e45bdeedeb4b0a9f6e7574e437b2f68b3cf7ad7cad6d2f`. Der anschließende Trace `ev_1f51a92f84e32430cf89f445afcee9ea821998850974b9e5c6fcf501044d259c` findet zwei Ausgangsknoten zum Modul und verfolgt **16 Knoten und 18 Kanten**. Er enthält unter anderem Modul-, Export-, Import- und Source-Map-Beziehungen. Im semantischen Graphen sind Lesezugriffe auf `domNode.tagName` und `statics.tagName[0]` in `formats/bold.js`, Zeile 13, mit Quellenposition belegt.

REA kennzeichnet die Abdeckung als **partial**. Beispielsweise fehlen in der kleinen Teilmenge weitere Blots; `parchment` bleibt ein externes Paket. Die Aufrufbeziehungen sind statische Kandidaten. Es wurde dadurch weder das Laufzeitverhalten aller Quill-Funktionen noch das Verhalten von Microsoft Word bewiesen.

**Zusätzliche direkte Prüfung der ausgelieferten Datei:** In `docs/analysis/reference/formats/bold.js` stehen:

```js
static blotName = 'bold';
static tagName = ['STRONG', 'B'];
```

In `optimize` wird bei einem abweichenden Elementnamen `replaceWith(this.statics.blotName)` aufgerufen. Zusammen mit der geordneten Tagliste lässt sich aus dem lesbaren Referenzcode ableiten: `<b>` und `<strong>` bezeichnen dieselbe Fettformatierung; Quill normalisiert in Richtung des ersten Tags `<strong>`. Diese Verhaltensdeutung stammt aus der **Codelektüre und Interpretation**, nicht aus einem separat ausgeführten Quill-Laufzeittest. Die Datei hat den SHA-256-Wert `634e58c16d9bea08058c1738420165724af8223318fd747a5a0fcdab436ec0e5`.

**Eigene Umsetzung:** Das Menüband ruft `editor.chain().focus().toggleBold().run()` auf. TipTap/ProseMirror verwaltet dazu eine Textmarkierung im Dokumentmodell. Weder Quills `Bold`-Klasse noch proprietärer Word-Code wurden in die Editorimplementierung kopiert. Der Begriff „eigene Umsetzung“ umfasst hier die Integration einer vorhandenen Open-Source-Textengine, nicht die Neuerfindung dieser Engine.

## 4. Herkunft der Erkenntnisse

| Kategorie | Konkretes Beispiel | Aussagegrenze |
| --- | --- | --- |
| Durch REA belegt | Module, Import-/Export-Beziehungen, Source Maps und Quellenpositionen der Tagzugriffe | Statisch, teilweise Abdeckung; kein Laufzeitbeweis |
| Ergänzende Referenz-Codelektüre | `['STRONG','B']` und Normalisierung in Quill | Aussage über diese Quill-Version, nicht über Word |
| UI-Entwurfsentscheidung | Blaue Titelleiste, Ribbon-Gruppen, weißes Blatt, Statusleiste | An vertrauten Word-Konventionen orientiert; kein protokolliertes Live-Beobachten von Microsoft Word |
| KI-Annahme / Entwurf | `.bdword`-JSON sei ein geeigneter verlustfreier Speicherweg für den unterstützten Umfang | Musste durch reales Speichern und Wiederöffnen überprüft werden |
| Eigenständig entwickelt | Oberfläche, IPC-Brücke, Speicherformat, PDF-Verarbeitung, Installer, Tests | Nutzt dokumentierte APIs und Bibliotheken; keine Word-Interna rekonstruiert |

## 5. Entwicklung und überprüfbare Gegenüberstellung

Chronologie: Umgebung prüfen → REA installieren und Quill statisch untersuchen → Analyse eingrenzen und Pfadproblem korrigieren → Electron/React/TipTap-Architektur festlegen → Menüband und Editor integrieren → Datei-/Bild-/PDF-/DOCX-Funktionen ergänzen → eigenes Logo und Splash ergänzen → echte Electron-Demo testen → Windows-Paket erstellen und Bericht abschließen.

| Referenz → Analyse | Erkenntnis | Eigene Implementierung | Testergebnis |
| --- | --- | --- | --- |
| Quill `formats/bold.js` → REA-Graph plus Codelektüre | Fett ist eine Textauszeichnung; mehrere HTML-Schreibweisen können dieselbe Bedeutung tragen | TipTap-Bold-Mark, Ribbon-Schaltfläche, Strg+B | Browser-Test prüft `<strong>`, Undo und Redo; HTML-Importtest prüft `<b>` → `<strong>` in **unserer** Engine |
| Word-inspirierte Bedienkonvention, ohne Word-Binäranalyse | Bekannte Gruppen erleichtern die Bedienung | Eigenes Ribbon mit funktionierenden Kernaktionen | Editor-Test prüft Formatierungen, Listen, Tabellen und Suche |
| Eigene Speicheranforderung, keine REA-Erkenntnis | Bilder müssen im Dokument enthalten bleiben | Versioniertes JSON mit eingebetteten Bilddaten | Reale Datei geschrieben und erneut geöffnet; Bild und Farbe geprüft |
| Eigene Druckanforderung, keine REA-Erkenntnis | Bildschirmfluss und Drucklayout sind getrennte Aufgaben | Separates Druckfenster, CSS-A4 und Electron-PDF | PDF-Dateikopf, extrahierter Text, A4 und Zwei-Seiten-Umbruch geprüft |

Die aktuellen Testdetails und verbliebenen Windows-Prüfungen stehen in `docs/VALIDIERUNG.md`. Es wird kein ursprüngliches Word-Verhalten als „identisch“ zertifiziert.

## 6. Probleme und wichtige Korrekturen

- npm konnte zunächst nicht in den vorgegebenen Home-Cache schreiben. Beschreibbare Workspace-Caches lösten das Problem.
- Electron versuchte zunächst einen direkten Download ohne passenden Proxyweg. Mit dem vorhandenen Proxy und dem korrekten Cacheparameter wurde das Originalartefakt mit Prüfsummenprüfung installiert.
- Der erste große REA-Trace scheiterte am Dateilesen. Ein kleinerer, gezielter Analyseumfang war handhabbar. Die erste flache Kopie verlor relative Importpfade; die nächste Kopie erhielt die Originalstruktur.
- TypeScript fand einen JSX-Klammerfehler und ungenaue DOCX-Typen; diese wurden vor dem Build korrigiert.
- Ein echter Editorfehler erlaubte, einen gerade eingefügten Seitenumbruch durch die folgende Eingabe zu ersetzen. Die Aktion fügt jetzt auch den Folgeabsatz ein; der PDF-Test bestätigt zwei Seiten.
- Ein zu großzügiger HTML-Import hätte externe Bilder behalten, die offline und beim Wiederöffnen ungeeignet wären. Er übernimmt nun nur eingebettete, unterstützte Rasterbilder.
- Die Tests mussten auf normale PDF-Zeilenumbrüche, gerundete A4-Maße und den asynchronen Editorfokus reagieren. Diese Korrekturen sind Testpräzisierungen, keine nachträglich behaupteten Programmerfolge.
- Der Standard-NSIS-Build benötigte Wine. Das nachgeladene Wine-Bundle scheiterte beim Laden von `ntdll.dll`. Ein eigenes NSIS-Skript erzeugt den Deinstaller erst bei der Installation und vermeidet diesen Laufzeitbedarf beim Cross-Build. Die Sprachkonfiguration wurde auf Deutsch eingegrenzt, nachdem NSIS fehlende zusätzliche Sprachtexte beanstandet hatte.

- Beim späteren nativen Windows-Build über GitHub Actions scheiterte NSIS an gemischten Linux-/Windows-Pfadtrennern. Das Installer-Skript wählt nun mit dem dokumentierten Makro `NSIS_WIN32_MAKENSIS` die zum Buildsystem passenden Pfade.

## 7. Beitrag der KI und verbleibende Grenzen

Die KI übernahm Werkzeugprüfung, Eingrenzung, REA-Aufrufe, Codelektüre, Architekturentwurf, Implementierung, Testautomatisierung, Fehlerdiagnose und Dokumentation. Manuell wären dafür Paket- und API-Recherche, UI-Programmierung, Editorintegration, Dateikonverter, Buildskripte und einzelne Testläufe erforderlich gewesen. Die Zeitersparnis wurde nicht gemessen; eine Prozentangabe wäre erfunden.

KI-Ausgaben waren keine Belege. Erst gespeicherte Toolausgaben, Compilerprüfung und funktionale Tests stützten die Aussagen. Eine KI kann unbekannte Word-Interna weder durch ein ähnliches Fenster beweisen noch zuverlässig aus Namen erraten. Native Dekompilierung liefert außerdem gewöhnlich nur Pseudocode, nicht ursprüngliche Kommentare, Bezeichner und Projektstruktur.

B&D Word bietet den demonstrierten Editorumfang. Es fehlen unter anderem eine Word-kompatible Layoutengine, `.doc`, Makros, Änderungsverfolgung, Kommentare, Serienbriefe, Felder, Inhaltsverzeichnisse, Kopf-/Fußzeilen, Cloud-Zusammenarbeit und vollständige DOCX-Kompatibilität. Eine ähnliche Oberfläche ist ein vergleichsweise kleiner Teil dieser technischen Komplexität. Eine erfolgreiche Linux-Demo ersetzt keinen Windows-11-Abnahmetest.
