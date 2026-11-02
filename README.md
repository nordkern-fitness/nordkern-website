# Nordkern Fitness – Website

**Stand: 02.11.2026 · Öffentliche Informationswebsite, keine Web-Buchung**

## Hauptzweig und Entwicklungsstand

- `main` ist die bisherige veröffentlichte Website.
- `reboot/nordkern-unified-design` ist unser **Entwicklungszweig**, auf dem wir die Website an Nordkern FDS angleichen.
- [Draft Pull Request #1](https://github.com/nordkern-fitness/nordkern-website/pull/1) enthält die neuen gemeinsamen Markenfarben und den ehrlichen Hinweis zur noch nicht veröffentlichten App.
- Die Website ist noch nicht vollständig neugestaltet, aber die Tarifseite lädt im Entwicklungszweig **aktive Angebote aus demselben Supabase-Katalog wie die App**. Keine Buchung und kein Checkout.
- Die Hauptdomain ist laut der `CNAME`-Datei `nordkern-fitness.de`. Die tatsächliche GitHub-Pages-Konfiguration wird separat in **Settings → Pages** kontrolliert.

## So kannst du die Website ohne Terminal ansehen

**Bestehende veröffentlichte Seite:** https://nordkern-fitness.de

**Neue Website-Vorschau ohne Terminal:**
1. Öffne [Pull Request #1](https://github.com/nordkern-fitness/nordkern-website/pull/1) und dort den zuletzt grünen **Nordkern Website Quality**-Prüflauf (alternativ im Tab **Actions**).
2. Scrolle auf der Prüfungsseite nach unten zu **Artifacts** und klicke **Nordkern-Website-Vorschau**.
3. ZIP herunterladen und entpacken.
4. **VORSCHAU-STARTEN.html** im entpackten Ordner doppelt anklicken. Dort kannst du Startseite, Tarife und App-Seite direkt öffnen.

Diese Vorschau enthält alle lokalen Website-Bilder, CSS-, JavaScript-Dateien und bereits eingebettete HTML-Komponenten. Ein lokaler Webserver ist dafür nicht nötig. **Der Live-Tarifkatalog braucht trotzdem eine Internetverbindung und ein aktives Supabase-Projekt.** Bei einem Verbindungsfehler werden bewusst keine alten Preise als aktuell dargestellt.

GitHub bewahrt den automatisch erstellten Vorschau-Download **14 Tage** auf. Bei neuen Änderungen entsteht ein frisches Paket im nächsten erfolgreichen Prüflauf. Die echte Website wird dadurch **nicht** aktualisiert.

**Alternative für Entwickler (lokaler Server):**

```bash
git clone https://github.com/nordkern-fitness/nordkern-website.git
cd nordkern-website
git switch reboot/nordkern-unified-design
python3 -m http.server 8000
```

Danach im Browser `http://localhost:8000` öffnen. Falls du bereits eine lokale Projektversion hast, vor dem Wechsel deine Änderungen sichern und dann `git fetch origin` sowie `git pull --ff-only` verwenden.

## Architektur und offene Punkte

- HTML, CSS und JavaScript; Inhalte werden teils aus `components/` geladen.
- App-Downloadlinks werden erst nach echter App-Store-Veröffentlichung gesetzt.
- Kein Bestellformular/Stripe-Checkout auf dieser Informationswebsite.
- Der **Live-Tarifkatalog** ist für die Tarifseite angebunden (nur öffentliche Daten). Bei API-Ausfall werden **keine veralteten Preise** angezeigt. Die alten `components/tarif-*.html` werden nicht mehr geladen und dienen nur noch als Altdaten bis zur Aufräumphase.
- Nächste Schritte: Gestaltung auf Mac/iPhone visuell prüfen, Barrierefreiheit und Mobilansichten testen, FAQ und Studiotexte zentral administrierbar machen. Noch kein veröffentlichter Checkout.
- GitHub Actions prüft lokale Links/Dateiverweise, JavaScript-Syntax und Kataloglogik und erzeugt die Vorschau-ZIP.

## Branch-Schutz

Die Website ist öffentlich. Schütze `main` über **Settings → Rules → Rulesets** (oder Settings → Branches) vor Force-Push und Löschung; nach Möglichkeit PRs vor dem Merge verlangen. Der private App-Zweig benötigt für GitHubs Branch-Schutz GitHub Pro, sonst bitte weiterhin ausschließlich auf Entwicklungszweigen arbeiten.

**Bitte keine ungetesteten Entwicklungsänderungen in `main` übernehmen.**
