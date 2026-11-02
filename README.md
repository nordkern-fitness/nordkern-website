# Nordkern Fitness – Website

**Stand: 02.11.2026 · Öffentliche Informationswebsite, keine Web-Buchung**

## Hauptzweig und Entwicklungsstand

- `main` ist die bisherige veröffentlichte Website.
- `reboot/nordkern-unified-design` ist unser **Entwicklungszweig**, auf dem wir die Website an Nordkern FDS angleichen.
- [Draft Pull Request #1](https://github.com/nordkern-fitness/nordkern-website/pull/1) enthält die neuen gemeinsamen Markenfarben und den ehrlichen Hinweis zur noch nicht veröffentlichten App.
- Es gibt noch **keine vollständige Neugestaltung** und **keine Verbindung des Website-Tarifkatalogs** zur Supabase-Datenbank.
- Die Hauptdomain ist laut der `CNAME`-Datei `nordkern-fitness.de`. Die tatsächliche GitHub-Pages-Konfiguration wird separat in **Settings → Pages** kontrolliert.

## So siehst du die Website

**Bisherige veröffentlichte Seite:** https://nordkern-fitness.de

**Entwicklungszweig nur lokal ansehen**, ohne die veröffentlichte Website zu ändern:

```bash
git clone https://github.com/nordkern-fitness/nordkern-website.git
cd nordkern-website
git switch reboot/nordkern-unified-design
python3 -m http.server 8000
```

Danach auf deinem Mac im Browser **http://localhost:8000** öffnen.
Die Website lädt einige Komponenten per JavaScript nach; deshalb **nicht nur `index.html` doppelklicken**, denn lokale `file://`-Zugriffe können die Komponenten blockieren.

Wenn der Ordner bereits vorhanden ist: lokale Änderungen zuerst sichern, dann `git fetch origin`, `git switch reboot/nordkern-unified-design` und `git pull --ff-only`. Alternativ lässt sich der Branch als ZIP aus GitHub herunterladen und anschließend im entpackten Ordner derselbe lokale Server starten.

Die Vorschau ist **nicht** automatisch online, nur weil ein GitHub-Pull-Request existiert. Auf die echte Domain gelangt ein geprüfter Stand erst nach deiner Freigabe und einer geeigneten Veröffentlichung.

## Architektur und offene Punkte

- HTML, CSS und JavaScript; Inhalte werden teils aus `components/` geladen.
- App-Downloadlinks werden erst nach echter App-Store-Veröffentlichung gesetzt.
- Kein Bestellformular/Stripe-Checkout auf dieser Informationswebsite.
- Nächste Schritte: Website-Design gründlich prüfen, Barrierefreiheit und Mobilansichten testen, Tarife und Pässe mit dem gemeinsamen Supabase-Katalog synchronisieren, FAQ und Studiotexte zentral administrierbar machen.
- GitHub Actions soll im Pull Request automatisch lokale Links/Dateiverweise prüfen.

## Branch-Schutz

Die Website ist öffentlich. Schütze `main` über **Settings → Rules → Rulesets** (oder Settings → Branches) vor Force-Push und Löschung; nach Möglichkeit PRs vor dem Merge verlangen. Der private App-Zweig benötigt für GitHubs Branch-Schutz GitHub Pro, sonst bitte weiterhin ausschließlich auf Entwicklungszweigen arbeiten.

**Bitte keine ungetesteten Entwicklungsänderungen in `main` übernehmen.**
