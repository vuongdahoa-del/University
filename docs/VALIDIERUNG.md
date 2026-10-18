# Ausgeführte Validierung

Stand: 18. Oktober 2026. Maschine: Debian 13 / Linux x64, Node.js 24.19.0. Anwendung: Electron 36.9.5, React 19.3.1, TipTap 3.32.0. Die Tests verwenden Chromium und eine echte Electron-App auf einem virtuellen Xorg-Display. Es handelt sich nicht um einen Windows-11-Test.

## Erfolgreich ausgeführt

| Prüfung | Ergebnis und Aussage |
| --- | --- |
| `bash scripts/cloud-install.sh` | Beide gesperrten npm-Installationen mit `npm ci` und anschließender TypeScript-/Vite-Build erfolgreich; beschreibbare Caches und vorhandener Proxy verwendet |
| `npm run build` | Typprüfung und Produktionsbuild erfolgreich; kein Null-Test-Ersatz |
| `npm test` | **4 bestanden, 0 fehlgeschlagen, 0 übersprungen** im abschließenden vollständigen Lauf; Zusammenfassung in `validation/tests.json`, Terminalprotokoll in `validation/tests.log` |
| `npm run analyze` | REA-Version, fokussierte Quill-Analyse und Feature-Trace erfolgreich; exakte Befehle/Exitcodes in `analysis/reproduced/run-log.json` |
| Desktop-Start gemäß `scripts/CLOUD_START.md` | Electron-Start mit dem gebauten Frontend und beschreibbarer Konfiguration auf Display :99 ausgeführt. Funktionale Belege liefern zusätzlich die Electron-Tests |

## Was die vier Tests tatsächlich prüfen

1. **Browser-Editor:** Text eingeben, Fett über Strg+B, Undo/Redo, Kursiv, Unterstrichen, Zentrierung, Aufzählungen und Nummerierung; Tabelle einfügen, Zelle beschreiben, Zeile ergänzen, Tabelle entfernen; Textsuche und Wortzahl. Browserfehler werden gesammelt und als Testfehler behandelt.
2. **Echte Electron-Live-Demo:** Splash sichtbar und anschließend beendet; Demo-Satz eingeben, Überschrift, Schriftgröße 24 und Textfarbe setzen; lokales Bild einbetten; tatsächliche `.bdword`-Datei schreiben; PDF schreiben; einseitiges A4-Format und extrahierten Satz prüfen; neues Dokument; gespeichertes Dokument öffnen und Text, Bild und Farbe prüfen. Zusätzlich echte DOCX-Datei exportieren und über Mammoth erneut importieren; Text und Bild prüfen.
3. **Fehler und Datenverlustschutz:** Speicherdialog abbrechen; ungespeichertes Dokument bei Neu/Schließen nicht verwerfen; beschädigte Editorstruktur öffnen und prüfen, dass eine Fehlermeldung erscheint und der bisherige Text erhalten bleibt.
4. **HTML und Mehrseiten-PDF:** `<b>`-Text und Link importieren, Skripte/Ereignisattribute/externes Bild entfernen; Seitenumbruch und Folgetext einfügen; tatsächliches PDF mit **zwei** Seiten erzeugen und Text extrahieren.

Die OS-Dateidialoge werden in den Tests durch vorgegebene Dateiauswahlen gesteuert. **Nicht simuliert** sind Editor, Preload, IPC-Handler, Dateioperationen, DOCX-Konverter, Chromium-PDF-Erzeugung und die anschließende Dateiprüfung. PDF-Inhalte werden mit `pdftotext`, Seitenanzahl und A4 mit `pdfinfo` kontrolliert. Beispielausgaben des erfolgreichen Demo-Tests liegen in `demo/`.

## Testfehler, aus denen wir gelernt haben

Frühere Durchläufe schlugen tatsächlich fehl. JSX-/Typfehler, ein überschreibbarer Seitenumbruch und ungeeignete externe Bildverweise wurden korrigiert. Andere Fehler betrafen Testannahmen: PDF-Text darf umbrechen, A4-Maße sind gerundet, Editorfokus wird teils im nächsten Bildschirmframe gesetzt. Eine zu unbestimmte Cursorbewegung vor Enter wurde durch Strg+Ende ersetzt, damit der Test nicht versehentlich mitten im Text einen neuen Absatz erzeugt. Die Anforderungen wurden dadurch nicht abgeschaltet.

Der ursprüngliche Testlauf mit mehreren Editoraktionen wurde zur Untersuchung der intermittierenden Auswahlfrage fünfmal wiederholt; diese fünf Durchläufe bestanden. Der abschließende vollständige Lauf ist separat mit vier Tests dokumentiert. Es wird daraus keine umfassende Stabilitäts- oder Langzeitaussage abgeleitet.

## Windows-Paket und offene Abnahme

Die Windows-Pakete werden mit `npm run dist:win` aus dem geprüften Stand gebaut. Das eigene NSIS-Skript verwendet ausschließlich lokal eingebettete Programmdateien und erzeugt den Deinstaller erst beim Installieren. Es sind keine Downloads zur Laufzeit vorgesehen. Das Windows-Programm erhält ein eigenes Icon und Produktinformationen. Die Paketprüfung und SHA-256-Werte werden nach dem Build in `validation/windows-package.json` und `release/SHA256SUMS.txt` festgehalten.

**Noch nicht ausgeführt:** Start der Windows-EXE auf Windows 11; Installerinstallation und Deinstallation unter Windows; Desktop-Verknüpfung bedienen; physisch drucken; komplexe fremde DOCX-Dateien oder lange Dokumente umfassend vergleichen; Tastatur und Zwischenablage in allen Windows-Konfigurationen; vollständige Barrierefreiheitsprüfung. Die Windows-Checkliste in `LIVE_DEMO.md` bleibt deshalb offen.

DOCX-Export und -Import sind anhand des Beispiels geprüft, nicht als verlustfreie Microsoft-Word-Kompatibilität zertifiziert. Die Bildschirm-Seitenanzeige bleibt eine Schätzung. Ein Build-Erfolg oder ein lesbares ZIP ersetzt keinen Plattform-Starttest.

## Wiederholung

Im Checkout mit vorhandenen Abhängigkeiten und erreichbarem Display :99:

```sh
npm run build
npm test
npm run analyze
```

Installation und Xorg-Start sind in `../scripts/CLOUD_START.md` beschrieben. Aktuelle maschinenlesbare Testergebnisse schreibt Playwright unter `test-results/results.json`; die kompakte abgelegte Zusammenfassung dokumentiert den hier beschriebenen Lauf. Neue Testläufe überschreiben ihre temporären Ausgaben.
