# Demo-Zugang Küche (Brace)

Nur für die Demo. Kein echtes Konto, keine echten Daten.

- Adresse: `/admin/` der veröffentlichten Seite
- E-Mail: `kueche@brace-demo.example`
- Passwort: `Ofen485-0c87c7`

Die Prüfung läuft im Browser gegen einen SHA-256-Hash (Demo-Adapter). Für den Echtbetrieb ersetzt Supabase Auth diesen Login,
siehe `supabase/schema.sql` (Rolle `kueche` in `app_metadata`).

Demo zurücksetzen: im Browser die localStorage-Einträge `brace.*` löschen.
