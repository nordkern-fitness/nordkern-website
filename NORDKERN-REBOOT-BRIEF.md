# Nordkern — Neustart-Briefing (Entwurf, 20.10.2026)

## Produktentscheidung
- **Nordkern App**: zentrale Anwendung für Mitglieder und berechtigte Mitarbeiter/Inhaber; Tarife buchen, Shop kaufen, Zutritt, Verwaltung.
- **Nordkern Website**: reine Information, Standorte, Tarife, FAQ, Kontakt, rechtliche Inhalte und Verweise/Deep Links zur App; **kein Web-Checkout und kein Web-Shop**.
- **Einheitliches Designsystem** für App und Website: gleiche visuelle Identität, Typografie, Farben, Komponentenprinzipien und Bewegungscharakter; jeweils passend für Mobilgeräte und Browser.
- **Eine Datenquelle** (Supabase): Preise, Laufzeiten, Kontingente, Standorte und strukturierte FAQ-Inhalte zentral. Rechtstexte/Verträge nur versioniert und nach Freigabe aktualisieren.

## Bereits bekannte Designentscheidungen
- Modern, minimalistisch, freundlich und ruhig, zugleich lebendig und kraftvoll; eigenständige Identität mit Apple-artigem Qualitätsanspruch.
- Grün gezielt für wichtige Aktionen und aktive Zustände.
- Light/Dark/System, Light standardmäßig.
- Subtile natürliche Animationen und Haptik.
- Übersetzungsziel: Deutsch (Standard), Englisch, Französisch, Polnisch, Dänisch.
- Home bewusst übersichtlich, wenig unnötige Personalisierung.

## Arbeitsregeln
- **Keine Löschung auf main, kein Überschreiben produktiver Datenbankdaten** im Zuge des Neustarts.
- Altstände bleiben als Referenz und Rückfalloption verfügbar; Neustart erfolgt in separaten Entwicklungszweigen.
- App ist die funktionale und gestalterische Referenz; Website übernimmt das Designsystem parallel, sobald Grundkomponenten feststehen.
- Entscheidungen, Screens und größere Änderungen werden dem Inhaber nachvollziehbar zur Mitgestaltung vorgestellt.
- Keine Secrets in GitHub. Tests und Sicherheitsprüfung vor Merge.
- App-Version zunächst 0.0.0.0; erst vollständiges Grundgerüst wird 1.0.0.0.

## Offene Designentscheidungen zur Abstimmung
1. Präzise Markenästhetik (Logo, Schrift, Grünton, Bildsprache).
2. Startseitenaufbau und gewünschte Reihenfolge der App-Funktionen.
3. Website-Informationsarchitektur und App-Weiterleitung (App Store / Play Store / Deep Links).
4. Verhalten bei noch nicht veröffentlichter App (Warteliste/Info statt totem Download-Link).
