# NORDKERN FITNESS · MASTER PROGRESS

**Stand:** 14. November 2026 · nach unabhängiger GitHub-/Supabase-Prüfung.  
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

## Bereitgestellte Edge Functions (aus Projektabfrage)

| Funktion | Version | Status |
| --- | ---: | --- |
| create-offer-checkout | 9 | ACTIVE |
| create-shop-checkout | 1 | ACTIVE |
| stripe-webhook | 11 | ACTIVE |
| issue-access-token | 7 | ACTIVE |
| verify-access-token | 8 | ACTIVE |
| cancel-membership | 5 | ACTIVE |
| create-checkout-session (Legacy, HTTP 410) | 5 | ACTIVE, gesperrt |
| create-billing-portal (Legacy, HTTP 410) | 3 | ACTIVE, gesperrt |
| create-test-billing-portal | 1 | ACTIVE, verify_jwt=true, nur mit Stripe-Testschlüssel nutzbar |

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
