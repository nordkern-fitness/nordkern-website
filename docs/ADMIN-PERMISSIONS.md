# Nordkern – Verwaltung und Berechtigungen (beschlossen)

Stand: 20.10.2026. Freigabe: abgestufte Berechtigungen ab Beginn, keine ausschließlich inhaberspezifische Verwaltung.

## Rollen
- Mitglied (member): persönliche Daten, Käufe und Zutritt.
- Mitarbeiter (staff): nur ausdrücklich freigegebene Studio-/Serviceaufgaben.
- Studioleitung (studio_manager): standortbezogene Verwaltung und Mitarbeiterabläufe.
- Management (management): standortübergreifende operative Verwaltung, soweit freigegeben.
- Mitinhaber (co_owner): weitreichende Verwaltung, aber keine Inhaberrolle vergeben/entziehen.
- Inhaber (owner): höchste Berechtigung; **nur Inhaber darf Inhaberrechte vergeben oder entziehen**.

## Technische Regeln
1. **Server ist Autorität.** UI blendet Funktionen nur ergänzend aus; jede Datenänderung wird in RLS, RPC oder Edge Function geprüft.
2. Rechte sind feingranular, z. B. `content.greetings.edit`, `catalog.edit`, `studio.edit`, `members.read`, `roles.manage`, `owner.manage`. Vergeben nur über geprüfte Serverfunktionen.
3. Berechtigungen gelten pro Rolle und optional mit individuellen Ausnahmen; Standortgrenzen beachten. Keine Rechteeskalation durch Änderung eigener Rolle oder eigener Overrides.
4. Änderungen an Tarifen, Guthaben, Rollen, Studiozugängen und rechtlichen Dokumenten werden nachvollziehbar protokolliert.
5. Live-Inhalte (Begrüßungen, FAQ, Marketing, Studioinfos) können über eine veröffentlichte, versionierte Inhaltskonfiguration aktualisiert werden. App und Website lesen dieselbe veröffentlichte Fassung.
6. Keine unkontrollierte Live-Änderung an Vertragskonditionen bereits abgeschlossener Mitgliedschaften; bestehende Verträge behalten Preis-/Konditions-Snapshots.
7. Sicherheitssensible Änderungen brauchen strengere Rechte, Validierung und ggf. gesonderte Bestätigung.
8. Kein Service-Role-Key in der App oder Website.

## Bereits in Supabase vorgefunden
- `profiles.role`: enum member/staff/studio_manager/management/co_owner/owner
- `profiles.account_enabled`
- `role_permissions`
- `profile_permission_overrides`
Diese vorhandenen Strukturen werden nach vollständiger Prüfung **wiederverwendet**, statt doppelte Rechte-Tabellen zu schaffen.

## Nächste Implementierung
- Vorhandene Berechtigungsfunktionen und RLS-Policies inventarisieren.
- Sicheres Backend-API für die veröffentlichten Begrüßungstexte und Zeitfenster festlegen.
- Inhaber-Verwaltungsansicht zunächst nur für zulässige Rollen sichtbar machen; echte Serverberechtigungen vor Schreibfunktionen prüfen.
- Tests: Mitglied kann nichts administrieren; Mitarbeiter nur zugewiesene Rechte; Mitinhaber kann Inhaberrechte nicht vergeben/entziehen; Inhaber kann diese verwalten.
