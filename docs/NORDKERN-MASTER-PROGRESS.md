# NORDKERN FITNESS · MASTER PROGRESS

## 9.3 – Sichtbare Vertrags- und Guthabenübersicht (25.11.2026)

Ausgang 4cca1910. Implementierungscommit 96dcf39e bindet js/account-overview.js und css/account-overview.css in das tatsächliche Kontoportal ein. Bestehende servervalidierte Vertragsdarstellung, Session-Scopes, Wallet-, Rechnungs- und Bestellfunktionen bleiben erhalten; keine neue Zahlungs-/Zutrittslogik. Responsive Vertragskarte mit aufklappbaren Originaldetails, Guthabenkarten, explizite unbestätigte Werte und unveränderte Konto-Isolation. Lokale Chromium-Teilvorschau mit byteidentischen Git-Blobs 47a32b990434cedfba2ed846406211215c4981e6 und 93d5b11b6f1af33aa160866711c85718ef2a5e9c, synthetischen Daten und getrenntem Wrapper; Desktop 1440×1050/Mobil 390×844 ohne Überlauf, Zustandswechsel, Vertragsdetails, Text-/Netzwerkschutz geprüft. Private eigenständige HTML-Datei plus Desktop/Mobil und rekonstruierter Vorher-Auszug im Chat geliefert. Keine vollständige Website oder native App ausgeführt. Website Quality 45705055216 und Read-only DEV 45705055286 success. Mock-E2E 45705055542: 42 erfolgreich, 3 fehlerhaft wegen altem Textassert Freigetränke: 3. Neuer Browser-Test prüft tatsächliche Zahl im zugehörigen Tile, Tastatur-Disclosure, unbekannte Werte und Textsicherheit; Ergebnis des Folgeworkflows noch offen. Keine Veröffentlichung oder DEV-Änderung. App PR #4 3da02ffc: gruppierte rollenbezogene Arbeitsbereiche, gemeinsame Profil-/Menüberechtigungen, 7 lokale Tests. Keine native Abnahme. Gesamtauftrag offen.

## Master-Ergänzung – sichtbare UI/UX (25.11.2026)

Ausgang `1367b91e`. `b9bf67c6`: tatsächliche Startseiten-Intro-Komponente, responsive Editorial-Layout, grün/orange, klarere Navigation und native HTML-Details. Bestehende Studiofotos und weitere Home-Module bleiben im Quellcode erhalten. Hauptskript und Offline-Preview-Builder laden dieselbe Komponente. Git-Blob 5a1a806284f24258b71a7f08a37239afafa303f7 lokal exakt abgeglichen. Chromium-Render 1440×1000 und 390×844 mit Überlauf-, Disclosure- und Vorschau-Linkdialog-Tests erfolgreich. Private HTML-Teilvorschau und zwei tatsächliche Screenshots im Chat ausgeliefert; kein kompletter Website-Render (lokale Git-/Asset-Übertragung wegen DNS blockiert; separater Preview-Wrapper, keine restlichen Seiten, keine Live-Daten). Website-CI auf b9bf67c6: Quality 45703953724, Mock Chromium 45703953820, DEV read-only 45703953674 success. `88c0234f`: gemeinsames FDS-Styling, Fokus, Buttons, Karten, Formulare, Lade-/Statusflächen, Responsive- und Reduced-Motion-Regeln. CI für den Folgecommit bei letzter Abfrage nicht bestätigt. Vollständige visuelle Abnahme aller Website-Seiten und vollständige bedienbare private Website/App-Vorschau offen. App PR #4: gemeinsame FDS-Komponenten und Inhaber-Dashboard überarbeitet, native Runner weiterhin nicht zugeteilt, keine native Screenshots behauptet. Keine Veröffentlichung, kein Main-Merge, keine DEV-Änderung, keine Kosten oder Änderung der Privatsphäre-Einstellungen.

## 9.3 – Master-Fortsetzung: Produkt- und Betriebsverwaltung (25.11.2026)

Website-Ausgang `a42d8e93`. Neue Verwaltungsoberflächen und neun geordnete SQL-Kandidaten befinden sich im App PR #4 (Implementierungsstand `3a4e6409`). Website-Funktionscode in dieser Fortsetzung unverändert; bestehende Rechnungs-, Vertrags-, Konto- und Shop-Funktionen bleiben erhalten. Produktbilder, öffentliche Studio-Angebote und veröffentlichte Öffnungszeiten noch nicht integriert; physischer Versand bleibt gesperrt. App-Clienttests 10/10 lokal erfolgreich, gemeinsame PostgreSQL-CI ohne Runner (45703102034); keine DEV-Migration oder Datenbankfreigabe. Keine Änderung an Main, öffentlicher Website, DNS, Pages, Sichtbarkeit, Rechtstexten oder Zahlungen. Gesamtauftrag bleibt offen.

## 9.3 – Master-Fortsetzung: echte Rechnungsquellen im Mitgliederbereich (25.11.2026)

Ausgang `a08ba5aa`. Implementierungscommit `74af31d33500ffb6853d5e14f01f82bc224fe264`: Rechnungsübersicht auf Basis der neuen scoped Billing-RPCs im bestehenden Kontoportal; getrennte Rechnungs-, Zahlungsbeleg- und Korrekturarten, Zahlungs-/Erstattungsstatus, Pagination und Originaldokument-Validierung. Keine Guthabenbuchungen als Rechnung ausgegeben. Bei fehlenden oder nicht freigegebenen RPCs kein fingierter Datenbestand. Backend-Kandidat nur in App PR #4, Featureflag aus, keine DEV-Migration. Kein Stripe-Kauf oder Backfill; Dokumentlinks können ablaufen, keine vollständige PDF-Archivierung. Website-CI am Implementierungscommit: Quality 45685282479 success; Chromium E2E 45685282655 success (Mock); read-only DEV-Browserintegration 45685282505 success. Beide Drafts unverändert privat im Entwicklungsworkflow bzw. ohne Veröffentlichung; keine Änderung an Main, Pages, Domain, Sichtbarkeit, DEV-Konten oder Rechtstexten. Weitere Funktions-/Datenbank-/Produktionsfreigaben offen; Gesamtauftrag bleibt bestehen.

## 9.3 – Master-Fortsetzung: Guthabenverlauf und Vertragsdetailparität (25.11.2026)

`586198842ab43ca23917ea17a219d4e8253cfcbd`: Kontoportal liest ausschließlich eigene RLS-geschützte wallet_ledger-Buchungen (Einheiten, Grund, Datum), validiert Identität/Kategorie/Signatur der Menge, 30+1 Cursor-Seiten mit voller Timestamp-Präzision, Mehrladen und Aktualisieren, Login-Lebensdauer und DOM-Mount-Guard schützen verspätete Antworten. Neues wallet-ledger.test.cjs. `094fb2077ed6e73817a395dd08e90e86645d906c`: Vertragsbeginn, bestätigter ursprünglicher Preis und tatsächlich im Snapshot vorhandene Monatskontingente analog App; keine Preisannahmen. Vertrags-/Bestell-/Guthabenbelege sind keine vollständigen Rechnungen.

CI `58619884`: Quality 45681381070 SUCCESS, Chromium mocked 45681381095 SUCCESS, DEV read-only 45681381073 SUCCESS. `094fb207`: Quality 45681846708 SUCCESS; Chromium 45681846750 und DEV read-only 45681846717 bei Prüfung noch in progress. Keine Änderung an main, öffentlicher Website, Rechtsangaben, DNS/Pages, Sichtbarkeit, Historie, DEV-Konten oder Zahlungen. App PR #4 erweitert um Rollen-/Rechteverwaltungskandidat, Mitgliederkonto und Audit-Metadaten; PostgreSQL-Abnahme wegen fehlender App-Runner nicht ausgeführt. Rechnungsübersicht, vollständige Vertrags-/Kontoverwaltung, operative Stripe- und Hardware-Abnahme offen. Master-Auftrag bleibt offen.

## 9.3 – Konto- und Bestellsicherheit im laufenden Master-Auftrag (25.11.2026)

Implementierungscommit `26186782c0e47135ee9f2ab2dec0ce37edb81d96`: Login-Lebensdauer für autorisierte Anfragen, Refresh, Konto-, Bestell- und Gerätesichten, sichere Guard-Prüfung vor/nach asynchronen Requests. Logout löscht private lokale Warenkorbdaten und alte Kontooberflächen; unbestätigter Gerätewiderruf wird nicht als bereits gesperrt behauptet. Neue `tests/account-session-scope.test.cjs` decken verzögertes Ergebnis über Logout/erneute Anmeldung und die Verdrahtung ab. Bestehende öffentliche Seite, rechtliche Angaben, Pages, DNS, Sichtbarkeit und Historie unverändert. **CI auf Implementierungscommit:** [Quality 45665131633](https://github.com/nordkern-fitness/nordkern-website/actions/runs/45665131633) SUCCESS, [Chromium E2E 45665131658](https://github.com/nordkern-fitness/nordkern-website/actions/runs/45665131658) SUCCESS (mocked Supabase), [DEV read-only 45665131664](https://github.com/nordkern-fitness/nordkern-website/actions/runs/45665131664) SUCCESS. Keine neue externe Zahlung, keine Änderung von DEV-Daten durch diese Runde.

App PR #4 vollständig mit dem früheren Sicherungsbranch vereinheitlicht; PR #5 ohne Merge geschlossen, Branch bleibt erhalten. Weiterarbeit: Website-Vertrags-/Shop-/Konto-Gesamtpfade und responsive Abnahme, kontrollierter privater Entwicklungsbetrieb nach separater Freigabe, native und Stripe-Abnahme im privaten App-Repo. Kein Produktionsrelease. App-CI fehlende Runner-Ausführung getrennt dokumentiert; keine manuelle Testpflicht des Inhabers.

## 9.2 – Privatbetrieb vorbereitet (25.11.2026)

Implementierung `6043b054`: lokaler Vorschau-Server, HTTP-Tests und CI-Archive nur privat/manuell. [Umstellungsplan und Rückkehrstrategie](9.2-private-development-transition.md). Keine Änderung an Sichtbarkeit, DNS, Pages, main oder Historie. Rechtliche und administrative Freigaben ausstehend; CI am tatsächlichen Implementierungscommit separat prüfen.

## 9.1 – Vorgründungs-Privatsphäre, öffentliche GitHub-Quellen und sichere Offline-Vorschau (24.11.2026)

**Tatsächlich implementiert und geprüft:** Website PR #3 auf Entwicklungsbranch, Code-Commit `58e141b7`, Syntaxkorrektur `670567fc`. [Website Quality 45464517934](https://github.com/nordkern-fitness/nordkern-website/actions/runs/45464517934) **SUCCESS** einschließlich neuer Python-Privacy-Tests, nachvollziehbarer sechs rechtlich relevanter Namensnennungen nur in `impressum.html`, automatischer Negativprüfung aller getrackten Textdateien und erneuter Prüfung des **ohne Namensduplikat** generierten Offline-Vorschaupakets. [Chromium-E2E 45464518088](https://github.com/nordkern-fitness/nordkern-website/actions/runs/45464518088) und [READ-ONLY-DEV-Browser 45464518167](https://github.com/nordkern-fitness/nordkern-website/actions/runs/45464518167) **SUCCESS**.

- **Fakten:** Website-Repository öffentlich, App-Repository privat; sechs Namensnennungen im unveränderten `main/impressum.html` und identisch im unveränderten Legal-Quelltext des Entwicklungszweigs. Bisherige rechtliche Anbieter-/Ansprechpartner- und Datenschutzfelder enthalten teilweise Platzhalter für eine zustellfähige Anschrift und bedürfen vor geschäftlicher Freigabe einer individuellen DDG-/Datenschutzprüfung. Historische Git-Commits/Archive bleiben öffentlich, GitHub-History wird **nicht** umgeschrieben. Vier öffentliche Branches (jeweils sechs identische Namensnennungen im jeweiligen Legal-Quelltext), und 300 aktuelle `main`-Commit-Metadatensätze wurden auf Marken-/Namensbezüge geprüft; **151/300 ältere Autor-E-Mail-Metadaten verwenden Gmail statt der Marken-Domain**, ohne dass der in der Website genannte vollständige Personenname in den untersuchten Autor-Namen vorkam; kein Vollständigkeitsbeweis für externe Archive/Suchmaschinen. Kein Klarname wird in dieser Dokumentation dupliziert.
- **Technische Änderung nur im PR:** `scripts/build_preview.py` ersetzt die kopierte Legal-Seite **ausschließlich innerhalb des CI-Offline-Vorschaudownloads** durch einen klar gekennzeichneten Hinweis mit Link auf die unveränderte veröffentlichte Legal-Seite. `scripts/privacy_audit.py` liest die Identität aus der tatsächlichen Legal-Quelldatei, verbietet Namenskopien außerhalb der Rechtstexte bzw. im Vorschaupaket und gibt niemals Namen/Adresse/E-Mail in Logs aus. Vollständige öffentliche PR-Source-ZIP-Artefakte werden nicht mehr automatisch neu hochgeladen; manuelle Versionsarchive bleiben möglich. `main/impressum.html` und tatsächliche öffentlich laufende Website wurden **nicht** verändert.
- **Neuer Schutz gegen künftige Git-Metadaten-Lecks:** Ab Commit `98c72605` lehnt der Privacy-Guard neue HEAD-Autor/Committer-Identitäten mit persönlicher bzw. nicht freigegebener E-Mail-Domain oder dem rechtlich erkannten Klarnamen ab, ohne alte öffentliche Gmail-Commits anzutasten. Fiktive Negativ- und Marken-/No-Reply-Positivtests sind in der Python-CI enthalten. [Website Quality 45465359458](https://github.com/nordkern-fitness/nordkern-website/actions/runs/45465359458) **SUCCESS**.\n- **Rechts-/Release-Grenze:** Keine heimliche Entfernung von Pflichtangaben, kein Fake-Betreiber, keine Scheinanschrift. Bei geschäftsmäßigem Betrieb ist die korrekte Anbieteridentität und ladungsfähige Anschrift nach § 5 DDG grundsätzlich anzugeben; die für diesen konkreten Vorgründungsstatus zulässige Gestaltung muss rechtlich abgenommen werden. Host-/Pages-Quelle und tatsächlich ausgelieferte Domainversion sind nicht durch verlässlichen Live-URL-Abruf bestätigt. DNS, Domain, Sichtbarkeit und Git-Historie blieben unverändert.

**9.1-Fachbericht:** [9.1-privacy-exposure-and-review.md](9.1-privacy-exposure-and-review.md). Weitere App-/native-/Stripe-Abnahmen werden im privaten App-Repository dokumentiert. Beide PRs bleiben offen/Draft, nicht gemergt; kein Live-Deployment.

**Stand:** 14. November 2026 · nach unabhängiger GitHub-/Supabase-Prüfung.  \n**Aktueller überprüfter Implementierungsstand (14.11.2026):** App `aa90e0a8` (App/Edge-CI grün), Website `118f90c4` (Website-CI grün). Stripe-Webhook `nordkern-dev` v12 aktiv. Neue Mitgliedschafts-Refund-RPC ungetestet und NICHT angebunden. Doku-Commits können die nachstehend genannten Implementierungs-HEADs fortschreiben.\n\n
**Status:** In Entwicklung; ausdrücklich **nicht produktionsreif**.  
**Branches:** App `feature/staff-studio-access-2026-11-12` / PR [#4](https://github.com/nordkern-fitness/nordkern-app/pull/4); Website `fix/hash-navigation-safety-2026-11-12` / PR [#3](https://github.com/nordkern-fitness/nordkern-website/pull/3). Beide offen, Draft, nicht gemergt.

## Verifizierter Speicherpunkt

- App: Implementierungs-HEAD `cae10dbcf5e3bd41afa6f5a80854a0e557f6f738` (UUID-Korrektur im Stripe-Testportal); App-CI `43449573997` **success**, Edge-CI `43449574021` und `43449565907` **success**.
- Website: Implementierungs-HEAD `29aa3cad4d12ab784c5a23d455555e17fe6dd5e5`; Website-CI `43449434289` **success**.
- Dieses Dokument wird als eigener Folge-Commit gespeichert. Prüfe bei Fortsetzung den tatsächlichen Branch-HEAD: Ein Commit kann seine eigene SHA nicht vorab enthalten.
- Letzte fehlgeschlagene Tests auf älterem App-Commit `ac4ef87c` waren Stripe-Testportal-Auth-Tests wegen zu strenger, fehlerhafter UUID-RegEx. Fix im Commit `cae10dbc`, nachfolgende CI grün.

## Tatsächlich angewendete Supabase-Migrationen (letzte relevante)

- `20261111220430` revoke_anonymous_privileged_rpc_access
- `20261112085212` staff_studio_scope
- `20261112093257` atomic_stripe_webhook_claims
- `20261112095043` deny_unpaid_membership_qr_access
- `20261112180751` log_qr_denied_access_decisions
- `20261112191107` safe_digital_shop_order_snapshots
- `20261112191229` fix_shop_order_coalesce_expression
- `20261112192211` shop_refund_tracking_and_unlimited_digital_stock
- `20261112192308` reconcile_refunded_shop_digital_credits
- `20261113143907` allow_safe_stale_staff_studio_assignment_revocation
- `20261113144308` deny_historical_pass_member_scope_leak
- `20261113145311` isolate_qr_readers_by_studio
- `20261114062638` disabled_accounts_never_have_staff_roles

## Bereitgestellte Edge Functions (aus Projektabfrage)

| Funktion | Version | Status |
| --- | ---: | --- |
| create-offer-checkout | 10 | ACTIVE, echte Byte-Limits, JWT |
| create-shop-checkout | 2 | ACTIVE, echte Byte-Limits, JWT |
| stripe-webhook | 12 | ACTIVE, Kündigungsabgleich aus aktuellem Stripe-Status, HMAC erforderlich |
| issue-access-token | 8 | ACTIVE, echte Byte-Limits, JWT |
| verify-access-token | 8 | ACTIVE |
| cancel-membership | 5 | ACTIVE |
| create-checkout-session (Legacy, HTTP 410) | 5 | ACTIVE, gesperrt |
| create-billing-portal (Legacy, HTTP 410) | 3 | ACTIVE, gesperrt |
| create-test-billing-portal | 2 | ACTIVE, JWT und Stripe-Testschlüssel erforderlich |

## Abgeschlossene und verifizierte Abschnitte

1. Expo-SDK-58-Paketmigration, App-/Website-Qualitätsworkflows und reproduzierbare Source-Artefakte; nur CI-/Buildnachweis, **kein** Gerätezertifikat.
2. Standort-RLS und rollenbasierte Mitarbeiterverwaltung, paginierte Mitarbeitersuche, Inhaber-Widerruf inaktiver Freigaben.
3. Reproduzierter Datenschutzfehler durch abgelaufenen Altpass behoben und gegen reale PostgreSQL-Rollen im Rollback-Test erneut geprüft.
4. Digitale Shopbestellung mit serverseitigen Preisen, Stripe-Testgates, idempotenten Webhooks, digitalem Guthaben und rückgängig machbaren Erstattungen; Tests mit Testdoubles und SQL-Rollback.
5. Signierte QR-Token, einmalige Nonces, gültige Bezahlperioden, Geräte-Widerruf, separater Reader je Studio. Reader-Tests und SQL-Rollback bestanden; **0 aktive/registrierte Hardware-Reader** beim letzten Abgleich.
6. Login, Passwortverwaltung und erneute E-Mail-Bestätigung als App-/Webfunktionen; keine Mailzustellung nachgewiesen.
7. Ältere potentiell unsichere Checkout- und Billing-Endpunkte in `nordkern-dev` deaktiviert.

## Nicht als abgeschlossen ausgeben

- **Kein nachgewiesener echter Stripe-Testcheckout mit realer Stripe-Testzahlung und zugestellten signierten Events.** Testkeys, Stripe-Account-Zugang und Testportal-Verfügbarkeit müssen über den sicheren Account-Weg geprüft werden.
- **Keine vollständige QR-Hardware-/Reader-Abnahme**, keine freigegebene Produktionstür.
- Keine durchgängige Abnahme Registrierung → Mail → Stripe → Backend → physische Zutrittsentscheidung mit echten externen Diensten; nur Teilintegration, simulierte Tests und SQL-Transaktionen.
- Produktion, rechtliche Texte, Datenschutz-/AGB-Freigabe, Laden-/Erfüllungs- und Rechnungsprozesse, Endgeräte-Tests, Usability und Supportprozesse sind offen. Website ist nicht als fertig/live freigegeben.
- Backend- und Repository-Versionen können divergieren: beim Fortsetzen stets beide prüfen.

## Nächste konkrete Entwicklungsaktionen (Priorität)

1. Testportal v1 wurde nach erfolgreichen Deno-Tests in `nordkern-dev` bereitgestellt (nur Testschlüssel, JWT erforderlich). Nächster Schritt: weitere sichere Integrations- und Datenbanktests, kein echter Stripe-Karten-Test ohne angebundenes Testkonto.
2. Automatisierte echte Datenbank-Integrationschecks für Leser/QR/Vertragsstatus weiter ausbauen, besonders Stornos, Fehler, Event-Reihenfolge, verifizierte RLS und ungewöhnliche Grenzfälle.
3. Shop-Bestand/Reservierung physischer Waren transaktionssicher entwerfen und erst dann freischalten; Rechnungs-/Steuer- und Refund-Workflow fachlich prüfen.
4. Auth, Versand von Bestätigungs-Mails, Stripe-Testkonto und iOS/Android separat E2E abnehmen, sobald externe Zugänge vorliegen.
5. App und Website auf verbliebene funktionslose Oberflächen, Barrierefreiheit und konsistente Tarifpreise prüfen. Beide PRs offen lassen, bis Freigabevoraussetzungen erfüllt sind.

**Sicherheit:** Kein `.env`, Service-Role-Key, Stripe-Secret, Reader-Klartext, Live-Zahlung oder echte Türfreigabe im Repository. Datenbanktests mit Rollback. Keine Behauptung vollständiger Produktionsreife.

## Fortsetzung 6.0 – geprüfter Abschnitt (14.11.2026)

- Das Testabrechnungsportal `create-test-billing-portal` wurde als **v1 ACTIVE mit `verify_jwt=true`** aus dem App-Entwicklungsbranch bereitgestellt. Dies ist ein Deploy-Nachweis, **kein Nachweis eines realen Stripe-Testkunden oder einer erfolgreichen externen Stripe-Portalsitzung**.
- Eingangsstand App `cae10dbc`, Website `29aa3cad` mit CI-Erfolg geprüft; dieses Dokument erzeugte anschließend die gespeicherten Commits App `9e2f7033963e861bab089282cf34f7f664b826c2`, Website `49f4d608ad86bf9afaff546079de2d5684a813c7`.
- Blockade für echte externe Zahlung: kein in der Sitzung authentifiziertes Stripe-Testkonto/Testzahlungs-Event. Weiter ohne Live-Zahlungen und produktive Reader.
- **Nächste Aktion:** Testportal- und Reader-Sicherheitsgrenzen einschließlich Fehlerbehandlung prüfen, CI erneut abwarten; DB-Rollbacktests erweitern.

## Fortsetzung 6.0 – Integrations- und Sicherheitstests (14.11.2026)

- **GitHub-Stand vor diesem Dokument-Update:** App `2f881bb6a274d9f227ce939a9233d8834f74fb34`, Website `ca72072bdf7c25522dd2903b1e53e55cc7127310`. PR #4/#3 weiterhin Draft und nicht gemergt.
- **CI derselben App-SHA:** Nordkern FDS Quality `43566409820` SUCCESS; Edge Functions static check `43566409816` SUCCESS, Push-Edge `43566405715` SUCCESS. Website Quality `43565719419` SUCCESS für `ca72072b`.
- **Reale DEV-PostgreSQL-Transaktionen mit Rollback:** `supabase/tests/qr_nonce_real_database_e2e.sql` prüft Pass, Nonce-Replay, Studios, Geräte, Kontosperre und Audit; `supabase/tests/qr_paid_membership_period_e2e.sql` prüft unbezahlte, bezahlte, gekündigte, pausierte, abgelaufene und zukünftige Mitgliedschaften; `supabase/tests/disabled_staff_role_revocation.sql` prüft drei aktive und deaktivierte Rollen. Alle drei bestanden. Die erste Erarbeitung des Nonce-Tests erkannte unzulässige Test-Hashzeichen; korrigierte gültige Hex-Tests bestanden.
- **Neue Migration angewendet:** `20261114062638_disabled_accounts_never_have_staff_roles`. Zentrale Rollenfunktionen prüfen Kontosperren und sind nicht mehr direkt für `anon` aufrufbar.
- **Edge JSON-Sicherheit:** Gemeinsamer `_shared/bounded-json.ts` mit Test für falsche `Content-Length`, echte Byte-Limits, beschädigtes UTF-8, Nicht-Objekt-JSON und fehlende Bodys. Erfolgreiche CI. Neue DEV-Deployments `create-test-billing-portal` v2, `create-shop-checkout` v2, `create-offer-checkout` v10, `issue-access-token` v8, jeweils `verify_jwt=true`.
- **Advisor 14.11.2026:** öffentlich abrufbare Rollenprüfungen gezielt abgesichert; weitere RLS-/SECURITY-DEFINER-Hinweise müssen funktionsbezogen bewertet werden. Tabellen ohne RLS-Policy sind teilweise absichtlich service-role-only; keine pauschale öffentliche Policy hinzufügen. Referenz: https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable
- **Nächste konkrete Aktion:** Prüfen, ob übrige administrative SECURITY-DEFINER-Funktionen Sperren und Studioberechtigungen korrekt erzwingen; Stripe-Live-E2E nur mit gültigem Testkonto, keine Test-Erfolge erfinden; weitere Website-/App-Geschäftsabläufe schließen. Physische QR-Hardware, echte Testzahlungen und E-Mail-Zustellung weiterhin nicht nachgewiesen.

## Fortsetzung 7.0 – Vertragssnapshot, durchgängiger Datenbankprozess und Kontoanzeige (14.11.2026)

**Aktueller verifizierter Implementierungsstand vor diesem Checkpoint-Commit:**
- App PR #4: `00d1239b7ba9f32432ebbdc68d92d0459c42d17c`. GitHub App-CI `43571666401` **SUCCESS**, Edge-CI `43571666421` und `43571660923` **SUCCESS**.
- Website PR #3: `230d3ae2b14770d2e37f0acbe24fe64871cbc605`. Website-CI `43571685626` **SUCCESS**. Beide PRs weiterhin Draft, kein Merge.
- Supabase-Devmigrationen tatsächlich angewendet: `20261114072228_grant_membership_credits_from_contract_snapshot_only` und `20261114072739_deny_disabled_users_changing_home_studio`. Beide in App-PR #4 committed.
- **Belegter Abrechnungsfehler vorher:** Ein Altvertrag mit 3 Freigetränken bekam nach Katalogänderung tatsächlich 99 gutgeschrieben, reproduziert nur in SQL `BEGIN … ROLLBACK`. **Behoben:** `grant_membership_invoice_credits` schreibt nur originale `memberships.pricing_snapshot.monthly_credits` gut, niemals aktuelle Katalogwerte. Zusätzlich verlangt die RPC bestätigten aktuellen bezahlten Zeitraum, aktives Konto und verwendet atomare, einmalige Rechnungsbuchung mit `ON CONFLICT` und Mitgliederzeilensperre. Funktionsausführung ausschließlich Backend-Service-Rolle; im Entwicklungsprojekt zum Migrationszeitpunkt **0 bestehende Mitgliedschaften**.
- **Realer End-to-End-Datenbanktest:** `supabase/tests/contract_checkout_invoice_credits_qr_e2e.sql` **PASS**, vollständig zurückgerollt. Er prüft Auth-Registrierungs-Trigger, automatisch gebundenes Heimatstudio, idempotente Checkout-Mitgliedschaft, zunächst verweigerten Zutritt und Guthaben für unbezahlte Mitgliedschaft, danach eine **im SQL simulierte, bereits extern verifizierte** Zahlungsperiode, Vertragssnapshot (3 statt 99 Getränke), Rechnungskredit einmalig, positive QR-Nonce-Entscheidung, Replay-, Ablauf-, Kündigungs- und Kontosperren. **Kein echtes Stripe-E2E und keine physische Türprüfung**. Erster Versuch, das bereits vom Trigger gewählte Studio erneut zu wählen, scheiterte berechtigt an 60-Tage-Sperre; Test entsprechend korrigiert.
- **Gesperrtes Konto / Studiowechsel:** tatsächliche Lücke reproduziert: deaktivierter Benutzer konnte trotz altem JWT Heimatstudio ändern; Migration schließt den Weg. `supabase/tests/disabled_member_studio_change.sql` **PASS** prüft normalen 60-Tage-Lock, Ablehnung gesperrter Konten und berechtigten Wechsel nach Ablauf – alle Testdaten zurückgerollt.
- **App und Website:** Bezahlter Vertrag zeigt jetzt tatsächlichen ursprünglichen Vertragspreis und Mindestlaufzeit aus dem Mitgliedschafts-/Vertragssnapshot, nicht neue Katalogpreise. App zeigt zusätzliches digitales Getränkeguthaben getrennt von Freigetränken. App `tests/account-flow.test.mjs` um Vertrags-/Guthabenvalidierung erweitert; Website `tests/account.test.cjs` um ursprünglichen Preis unabhängig vom Katalog erweitert. Ein älterer App-CI-Lauf `43571527616` schlug wegen noch unvollständiger Wallet-Testfixture fehl; Testfixture auf zusätzliche Getränke ergänzt, aktuelle CI erfolgreich.

**Offen nach Priorität:** Echte signierte Stripe-Testzahlungen und zugestellte Webhooks (kein autorisierter Stripe-Testkontozugriff nachgewiesen), E-Mail-Bestätigungszustellung und native Geräteabnahme, physische Reader-/Türabnahme, produktive Vertrags-/Rechnungs- und Rechtstexte. Sichere Teilintegrationen und echte Dev-DB-Tests ersetzen keine Endabnahme. Produktive Zahlungen/Türen bleiben unangetastet.

**Nächste konkrete Aktion:** Stripe-Webhook-Ereignisreihenfolge für Registrierung/Erstzahlung/Renewal mit autoritativer Periodenprüfung gezielt reviewen, unzuverlässige Doppel-/Späterereignisse durch zusätzliche signierte Testfälle abdecken, weiter UI/Shop und Auth konsolidieren; nicht unnötig bestandene Tests wiederholen.

## Fortsetzung 7.0 – signierter Stripe-Test-Webhook, Kündigungsabgleich und letzte UI-Integration (14.11.2026)

**Verifizierte Implementierungs-Commits vor diesem Doku-Commit:** App `e67382ce88330fb4c64da94be1e71b2da51c87e1`, Website `dae368f4ce32bdd345e7228052c03002428f3c30`. Beide PRs #4/#3 weiterhin offen/Draft, nicht gemergt.

**CI/Nachweise:**
- App FDS `43572299467` **SUCCESS**, Edge `43572299463` und `43572295713` **SUCCESS** für `e67382ce`.
- Website Quality `43572124294` **SUCCESS** für `dae368f4`.
- Stripe-Webhook-Code wurde nach erfolgreicher CI aus App-PR #4 in `nordkern-dev` als `stripe-webhook` **v12 ACTIVE** bereitgestellt (`verify_jwt=false` für Stripe-HMAC, eigene Signature-Prüfung zwingend). **Kein produktives Stripe- oder Tür-Deployment.**
- Erweiterte signierte Deno-Webhooktests: Ein bezahlter Checkout erzeugt den Vertrag; `invoice.paid` gewährt einmalig Rechnungscredits, selbst bei gleicher/erneut zugestellter Rechnung. Trifft `invoice.paid` vor der Checkout-Vertragsanlage ein, wird das Ereignis nicht als erfolgreich verbucht; ein späterer Retry kann nach dem Checkout genau einmal buchen.
- `customer.subscription.updated` gleicht eine Termin-Kündigung **und ihre Rücknahme** aus der aktuell erneut bei Stripe gelesenen Subscription ab. Der alte Webhook-Payload wird nicht als aktueller Vertragsstatus behandelt. Ein ungültiger expliziter Stripe-Zeitstempel führt zu einem retriable Fehler statt stiller Entfernung eines Kündigungsdatums.
- App- und Website-Mitgliederansicht zeigen den wirksamen Kündigungstermin, sofern vorhanden, zusätzlich zu ursprünglichem Vertragspreis, Mindestlaufzeit und bezahltem Zeitraum. Website-/App-Tests dafür erfolgreich.
- Supabase-Sicherheitsadvisor (erneut auf DEV geprüft): 11 INFO `rls_enabled_no_policy` (teils absichtlich backend-only), 2 WARN `anon_security_definer_function_executable` (öffentliche Inhalte separat fachlich prüfen), 30 WARN `authenticated_security_definer_function_executable` (rollenbezogene Funktionen müssen weiter geprüft werden) und 1 WARN `auth_leaked_password_protection` (Auth-Projekteinstellung noch offen). Advisor-Hinweise nicht pauschal durch Freigaben beheben.

**Externe und weiterhin tatsächliche Blockaden:** Kein direkt autorisiertes Stripe-Testkonto mit echter Testkarten-Zahlung/Webhook-Zustellung im Ausführungszugang, keine vollständige reale Auth-Mail-Zustellung, keine iOS-/Android-Geräteabnahme und keine physische Reader-/Türintegration. CI und SQL-Rollbacktests sind nicht der Nachweis einer echten Zahlung oder produktiven Fertigstellung.

**Nächste konkrete Arbeit:** Weitere Stripe-Kündigungs- und Fehlerzustände sicher als Integration prüfen, kontrollierte Testrechnungs-/Belegansicht sowie Shop-Fehlerzustände prüfen, Supabase Advisor-Funde nach Risiko priorisieren; nach Zugang zu Stripe-Testkonto echten Testcheckout mit echten signierten Events abnehmen. Nie Live-Zahlungen/Türen aktivieren.

## Fortsetzung 7.0 – Refund-Entwicklung mit bewusster Test- und Deployment-Sperre (14.11.2026)

- **Speicherstand vor Doku-Commit:** App PR #4 `aa90e0a82f82324ad3dceb28683c54cfeba6d3e0`. CI: FDS `43572948728` SUCCESS, Edge `43572948682` und `43572942836` SUCCESS. Website PR #3 `118f90c489e5d9041a0446717782f12cd3b6a263`; CI `43572500810` SUCCESS. Beide PRs Draft, kein Merge.
- **Nur in DEV angewendet:** `20261114074828_reconcile_refunded_membership_invoice_credits.sql`. Enthält RLS-geschützte, service-role-only `public.membership_credit_refunds` und `public.reconcile_membership_invoice_refund(text,integer,boolean)`. Ziel: kumulative Teil-/Voll-Erstattung idempotent erfassen; bei Vollerstattung höchstens ungenutzte Credits zurücknehmen, fehlende Credits ohne Negativsaldo markieren, Audit erzeugen.
- **Wichtig: Geschäftstest ausdrücklich NICHT bestanden / NICHT ausgeführt.** Ein mit `BEGIN … ROLLBACK` angelegter vollständiger Test gegen simulierte Finanzbuchungen wurde von den Sicherheitschecks des Ausführungswerkzeugs blockiert. Die Blockade wurde nicht umgangen, keine Ersatzbehauptung. Deshalb bleibt diese neue Refund-Funktion **ungetestet und wird vom Stripe-Webhook v12 ausdrücklich noch nicht aufgerufen**. Kein realer Konto-/Guthabenbestand wurde geändert; DEV enthält beim Kontrollzeitpunkt **0 Mitgliedschafts-Refund-Einträge und 0 Rechnungs-Guthabenbuchungen**.
- **Tatsächlich erfolgreich geprüft:** read-only DEV SQL bestätigt RLS aktiv, `anon`/`authenticated` kein SELECT/UPDATE auf Refund-Tabelle und kein EXECUTE auf Refund-RPC; `service_role` darf die RPC ausführen. Quellenmigration ist im App-PR versioniert, die CI prüft weiterhin Code/Dateiqualität, **nicht** die ungetestete Geldlogik.
- **Nächste konkrete Aktion:** Mit einem zulässigen, freigegebenen Entwicklungs-Testmechanismus den vollständigen Refund-RPC-E2E unter Rollback/isolierter Instanz abnehmen, bis dahin **nicht** in `charge.refunded` verdrahten. Parallel unabhängige Features/Tests fortsetzen, insbesondere bekannte RLS-/Security-Advisor-Warnungen und nicht freigegebene Auth-E-Mail-/Test-Stripe-/Reader-Hardwareabnahmen. Ein erfolgreicher Build, eine grüne CI oder eine migrierte Funktion sind keine Produktionsfreigabe.

## Fortsetzung 7.0 – Self-Service-Gerätesperre und native Bindungswiederherstellung (14.11.2026)

- **Geprüfter Implementierungs-HEAD vor Doku-Commit:** App `281b0ed1602169b6dcbe371cfa6c104349b945f0`; App/FDS CI `43573626772` **SUCCESS**, Edge CI `43573626773` und `43573622653` **SUCCESS**. Website `b28420e29bfa9f897f5b093d6ecf5f05918d4707`; Website Quality `43573826821` **SUCCESS**. Beide PRs weiterhin Draft/offen.
- **Neue DEV-Migration:** `20261114075825_allow_member_to_revoke_own_qr_device`. `public.revoke_own_device(p_device_id uuid)` ist nur für `authenticated` ausführbar, nutzt `auth.uid()`, widerruft ausschließlich ein eigenes noch aktives Gerät, protokolliert den Vorgang einmal und gibt bei Wiederholung `false` zurück. Keine direkte Update-Berechtigung für Frontend auf `devices`. Das serverseitige Nonce-Backend verweigert bereits ausgegebene QR-Nonces sofort nach `devices.revoked_at`.
- **Echte ROLLBACK-Datenbankintegration bestanden:** `supabase/tests/revoke_own_qr_device.sql`: eigener/anderer Account, einmaliger und wiederholter Widerruf, positive QR-Nutzung vor und verweigerter QR-Zutritt nach Sperre, Audit, unverändertes Fremdgerät. Testdaten nicht persistent; kein realer Reader betroffen.
- **Website-Mitgliederportal:** `konto.html` zeigt RLS-eingeschränkte eigene Geräte ohne Credential-Hash oder Secrets; per bestätigtem Button an `rpc/revoke_own_device` sperren, Liste aktualisieren; barrierearme responsive Darstellung und `tests/account.test.cjs` erweitert.
- **Mobile App:** `src/access/reader-client.ts` erkennt vorhandenes SecureStore-Gerätecredential, `app/(tabs)/access.tsx` stellt die Bindung nach Neustart nur nach erneuter erfolgreicher serverseitiger `register_current_device`-Prüfung wieder her. Bindungszustand ist an die aktuell angemeldete User-ID gekoppelt, um Benutzerwechsel abzusichern. Noch **keine echte iOS/Android-Hardwareabnahme**; CI/TypeScript grün.
- **Offen:** Bei widerrufenem Gerätecredential auf demselben Smartphone ist der lokale Schlüssel noch nicht komfortabel zurücksetzbar; Support oder kontrollierter Re-Pairing-Prozess vor echter Nutzung erforderlich. Echte Auth-Mailzustellung, Stripe-Transaktion/Webhooks und Reader-Hardwareabnahme unverändert extern offen. **Die neu angelegte Refund-RPC aus `20261114074828` bleibt ungetestet/nicht an Stripe angebunden** (Sicherheitsblockade), keinesfalls als fertig deklarieren.
- **Nächste konkrete Aktion:** Kontrollierten Gerätetausch/Re-Pairing-Prozess mit Nachweis alter Revocation und nicht wiederverwendbaren Credentials entwerfen; dann realen Gerätetest. Alternativ weitere ausschließlich sichere, unabhängige Account-/Shop-End-to-End-Funktionen schließen. Kein Live-Geld/Türfreigabe, kein Merge.
