# B&D Word auf dem Mac

Die macOS-Ausgabe wird als Universal-App gebaut: Ein Paket enthält die Programmteile für Intel (x86_64) und Apple Silicon (arm64, beispielsweise M1/M2/M3/M4). Vorausgesetzt wird macOS 11 oder neuer.

## Herunterladen und öffnen

1. Auf der GitHub-Release-Seite unter **Assets** die Datei `BD-Word-1.0.0-mac-universal.zip` herunterladen.
2. Die ZIP-Datei im Finder per Doppelklick entpacken.
3. `B&D Word.app` in den Ordner **Programme** ziehen und von dort öffnen.

Das Paket ist lokal **ad hoc signiert**, aber nicht mit einem Apple-Entwicklerzertifikat signiert oder von Apple notarisiert. Die lokale Signatur prüft die Unverändertheit der Programmteile; sie bestätigt keinen durch Apple verifizierten Herausgeber.

Falls macOS die heruntergeladene App blockiert: Nach dem ersten Öffnungsversuch unter **Systemeinstellungen → Datenschutz & Sicherheit** prüfen, ob für B&D Word **„Dennoch öffnen“** angeboten wird. Nutze dies nur für die bewusst heruntergeladene Datei aus unserem GitHub-Release. Auf älteren macOS-Versionen kann auch **Rechtsklick → Öffnen** angeboten werden. Die Sicherheitsfunktionen des Macs müssen nicht generell abgeschaltet werden. Auf verwalteten Hochschul-/Firmenrechnern kann diese Freigabe durch die Administration eingeschränkt sein.

Der Mac verwendet **⌘S** zum Speichern, **⌘B** für Fett und **⌘Z** zum Rückgängigmachen. Ausschneiden, Kopieren, Einfügen und Alles auswählen sind zusätzlich über das macOS-Menü **Bearbeiten** erreichbar. Manche Beschriftungen der gemeinsamen Oberfläche zeigen noch die Windows-Bezeichnung „Strg“; auf dem Mac gilt dafür die Befehlstaste ⌘.

## Build und Überprüfung

Auf einem Mac mit Node.js 24.19.0:

```sh
npm ci
npm run dist:mac
node scripts/smoke-macos.cjs
```

`dist:mac` baut beide Architekturen, vereinigt sie und erstellt die ZIP-Datei. Eine Apple-Notarisierung ist nicht Teil dieses Builds. In GitHub Actions werden vor dem Upload geprüft:

- Beide Architekturen sind im Hauptprogramm enthalten (`lipo`).
- Die lokale Bundle-Signatur ist konsistent (`codesign --verify --deep --strict`).
- Die tatsächlich paketierte App startet auf dem Mac-Runner.
- Der Editor kann Text schreiben, über ⌘B formatieren, Überschrift/Größe/Farbe setzen und ein lokales Bild einbetten.
- ⌘S schreibt eine reale B&D-Datei; der PDF-Export erzeugt eine nichtleere PDF-Datei.
- Das gespeicherte Dokument lässt sich mit Überschrift und Bild wieder öffnen.

Die tatsächlichen Ergebnisse stehen im jeweiligen GitHub-Actions-Lauf **Build and publish B&D Word for macOS**. Bei erfolgreichem Test enthält das Run-Artefakt `macos-smoke-results` eine Ergebnisdatei, einen Screenshot und ein Beispiel-PDF. Fehlgeschlagene Tests verhindern den Upload. Die Dateidialogauswahl wird im Test vorgegeben; der PDF-Inhalt wird hier anhand von Dateikopf und Größe, nicht durch Textextraktion geprüft.

Die App wird nur auf der Architektur des CI-Runners gestartet. Das Vorhandensein beider Architekturen ist keine gesonderte Laufzeitprüfung auf zwei verschiedenen Mac-Modellen. Apple-Notarisierung, physischer Druck und die erste Gatekeeper-Freigabe auf einem persönlichen Mac sind nicht automatisiert geprüft.

Beim ersten Mac-Build beanstandete Apples Signaturwerkzeug Begleitdateien direkt unter `Contents/`. Diese Dateien werden nun über `extraResources` in `Contents/Resources/` abgelegt. Die Signaturprüfung bleibt aktiv; der fehlgeschlagene Build wurde nicht veröffentlicht.
