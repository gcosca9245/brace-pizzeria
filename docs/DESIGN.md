# Brace – Designentscheidungen

## Konzepte
Drei Richtungen, verglichen in `qa/concepts-vergleich.jpg` (nicht im Repo):
- **A „Glut“** – dunkler, filmischer Einstieg, Wortmarke groß, Bestellfeld im ersten Bild. Gewählt.
- **B „Mehl“** – helle Editorial-Karte. Übernommen für die Speisekarte auf der Startseite.
- **C „Ofenpass“** – Bestellung als Werkzeug. Übernommen für Bestell-Dock und Warenkorbleiste.

## System
- Schrift: Bodoni Moda (optische Größen) für Display, Hanken Grotesk für UI und Zahlen (tabular).
- Farben: Kohle #1d1714, Ofen #0f0c0a, Mehl #f4efe7, Asche #6f665e, Glut #e9894a, Pomodoro #b8321c nur für Kaufaktionen.
- Bewegung: ein GSAP-Zeitstrahl für den Film, Lenis nur bei Maus/Trackpad, Touch scrollt nativ.
  Taster skalieren beim Drücken auf 0,97, Übergänge nennen ihre Eigenschaften, ease-out-Kurven.

## Film
Drei 1080p-Clips je Format (16:9 und 9:16), weich verbunden zu 28,8 s: Belegen → in den Ofen → Backen →
Herausholen → Schneiden. Ausgeliefert als WebP-Einzelbilder (Desktop 1920/1280, Handy 720 hoch),
schrittweise geladen, max. 8 dekodierte Bilder auf Touch-Geräten, beim Stillstand rastet das Bild auf einen echten Frame ein.
Ohne Bewegung (prefers-reduced-motion) zeigt die Seite drei Standbilder statt des Films.

## Kritik, Audit, Feinschliff (Auszug)
- Links im Button-Look waren `role="button"` → eigener `LinkButton` als echtes `<a>`.
- Zugängliche Namen der Karteneinträge wichen vom sichtbaren Text ab → sichtbarer Text + `sr-only`-Zusatz.
- Überblend-Geister bei schnellen Handbewegungen → Einrasten auf den nächsten Frame nach 160 ms.
- Bestellfeld auf dem Handy zu hoch → PLZ und „Bestellen“ in einer Zeile, Bild bleibt sichtbar.
- Schwebende Leiste verdeckte die Kapitelleiste → erscheint erst nach dem Film, auf dem Handy nur mit Warenkorb.
- Karte kam erst nach dem JavaScript (LCP 9,9 s) → statische Karte im HTML, Live-Daten danach (LCP 1,8 s).
- Status ändern und Stornieren in der Küche lassen sich per „Rückgängig“ zurücknehmen.
- Skip-Link, `touch-action: manipulation`, keine Abfragen im Hintergrund-Tab.

## Bewusst nicht verwendet
Spline (Gewicht + Wasserzeichen, kein Mehrwert gegenüber echtem Film), 3D-Kugeln, Glow-Verläufe, Icon-über-Überschrift-Karten.
