# B&D Word in dieser Cloud starten

Diese Aufgabe hat bereits eine isolierte Maschine. Verwende den vorhandenen Checkout `/workspace/University`; erstelle keinen Git-Worktree, außer der Benutzer verlangt ihn ausdrücklich. Lies etwaige neue AGENTS.md-Anweisungen und den aktuellen Git-Status, bevor du Änderungen vornimmst.

Node.js 24.19.0 wird über die vorhandene Laufzeit bereitgestellt. Behalte installierte Abhängigkeiten und Buildausgaben aus dem Snapshot. Falls sie fehlen oder sich Lockfiles geändert haben, führe im Checkout `bash scripts/cloud-install.sh` aus. Das Skript wurde hier erfolgreich mit `npm ci` für beide Lockfiles und anschließendem Build ausgeführt.

Liveprozesse überleben eine Snapshot-Wiederherstellung nicht verlässlich. Die native Electron-App braucht eine grafische Sitzung. In dieser Linux-Cloud sind Xorg, der Dummy-Treiber und Chromium bereits vorhanden. Prüfe zunächst `DISPLAY=:99 xdpyinfo`. Nur wenn dort keine Sitzung erreichbar ist, starte:

```sh
cd /workspace/University
/usr/bin/Xorg :99 -config /workspace/University/scripts/cloud-xorg.conf -logfile /workspace/bd-xorg.log -nolisten tcp -noreset > /workspace/bd-xorg.stdout.log 2>&1 &
```

Warte kurz und prüfe mit `DISPLAY=:99 xdpyinfo`, ob die Sitzung bereit ist. Starte keinen zweiten Server auf einem belegten Display; beende nur eigene Prozesse. Mit derselben Konfiguration wurden die echten Electron-Tests ausgeführt.

Die Desktop-App lässt sich so starten:

```sh
cd /workspace/University
DISPLAY=:99 XDG_CONFIG_HOME=/workspace/.bd-runtime-config XDG_CACHE_HOME=/workspace/.cache npm run desktop -- --no-sandbox
```

`--no-sandbox` ist nur für diesen eingeschränkten Linux-Cloud-Start vorgesehen. Die normalen Windows-Starts verwenden diesen Parameter nicht. Der Renderer erhält weiterhin keinen Node.js-Zugriff; die IPC-Brücke ist begrenzt.

Readiness bedeutet mehr als ein laufender Prozess: `npm run build` muss erfolgreich sein und `npm test` muss alle vier Tests ausführen. Sie prüfen tatsächliche Editoraktionen, Schreiben und Wiederöffnen, DOCX sowie den Inhalt ein- und zweiseitiger A4-PDFs. Die Tests benötigen das Display :99; die OS-Dateiauswahlen werden gezielt vorgegeben. Ein erfolgreicher Lauf bestätigt keine Windows-Installation und keinen physischen Drucker.

Für reine Oberflächenentwicklung ist `npm run dev` möglich. Es startet Vite auf 127.0.0.1:5173; native Datei-/PDF-Funktionen benötigen Electron. Kein Serverdienst, kein API-Schlüssel und keine Secrets sind nötig. Erzeuge in der Onboarding-Oberfläche keine localhost-Vorschau-Links.

Windows-Pakete: `npm run dist:win`. Unter der Cloud bei nötigen Downloads dieselben Proxy- und Cache-Variablen wie in `cloud-install.sh` verwenden. Das eigene NSIS-Skript benötigt kein Wine. Die tatsächlichen Windows-11-Abnahmeschritte stehen in `docs/LIVE_DEMO.md`.
