# B&D Word: Live-Demo in zwei Minuten

## Vorher auf dem Präsentationsrechner

Windows 11 x64: Installer ausführen oder das gesamte Windows-ZIP entpacken. Im ZIP startet `B&D Word.exe`; die übrigen Dateien müssen daneben bleiben. Für das ZIP kann über das Windows-Kontextmenü eine Desktop-Verknüpfung erstellt werden. Der Installer erstellt die Verknüpfung selbst.

Die Pakete sind nicht digital signiert. Einen abschließenden Start-, Installations- und Drucktest auf deinem Windows-Rechner durchführen: Diese Cloud stellt Linux bereit. Die unten aufgeführten Anwendungsschritte wurden hier mit der echten Linux-Electron-App automatisiert getestet; die Betriebssystem-Dateidialoge wurden dabei durch vorgegebene Dateiauswahlen gesteuert.

Das lokale Demonstrationsbild liegt nach Entpacken/Installation unter `Demo/demo-bild.png`. Lege Bild und Speicherordner vor der Präsentation bereit. Kein Internet, Microsoft Word oder API-Schlüssel nötig.

## Ablauf

1. **0:00 – 0:10:** Über Desktop-Icon starten. Splash-Screen „B&D Word“, dann leeres Dokument.
2. **0:10 – 0:25:** „Dieses Programm wurde mithilfe von KI entwickelt.“ eingeben.
3. **0:25 – 0:45:** Mit Strg+A markieren. Unter **Start** „Überschrift 1“ wählen. Schriftgröße 24 und eine Textfarbe wählen.
4. **0:45 – 1:05:** Mit Pfeil rechts / Ende und Enter einen Absatz darunter erzeugen. Unter **Einfügen → Bild** das lokale Demonstrationsbild auswählen.
5. **1:05 – 1:20:** Strg+S drücken und als `Live-Demo.bdword` speichern.
6. **1:20 – 1:40:** **Datei → Als PDF**; `Live-Demo.pdf` speichern. PDF bei Bedarf außerhalb der App öffnen.
7. **1:40 – 2:00:** **Datei → Neu**, dann **Datei → Öffnen**, `Live-Demo.bdword` auswählen. Text, Farbe und Bild sind wieder da.

Bei Farb- und Größenänderungen muss der gewünschte Text markiert sein. Das B&D-Format ist das eigene, verlustfreie Projektformat; DOCX ist ein zusätzlicher vereinfachter Austauschweg.

## Vor der Vorführung manuell abhaken

- [ ] Windows-Installation oder ZIP-Start klappt; Desktop-Verknüpfung startet dieselbe App.
- [ ] Der vollständige obige Ablauf klappt auf diesem Rechner ohne Netzwerk.
- [ ] PDF öffnet sich im örtlichen PDF-Viewer und enthält Bild und Text.
- [ ] Druckdialog erreicht einen vorhandenen Drucker oder den Windows-PDF-Drucker.
- [ ] Schriftarten sehen auf dem Präsentationsrechner wie erwartet aus.

Diese Liste ist absichtlich nicht als bestanden markiert: Windows, Desktop-Verknüpfung und physischer Drucker wurden in der Linux-Cloud nicht bedient.
