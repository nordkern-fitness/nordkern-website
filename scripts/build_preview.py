"""Build a double-clickable Nordkern website preview ZIP without altering GitHub Pages.
All local HTML components are inlined at build time, avoiding file:// fetch errors.
The Supabase public catalogue still needs an internet connection in the browser.
"""
from pathlib import Path
import re
import shutil

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "preview"

COMPONENTS = {
    "header": "components/header.html",
    "footer": "components/footer.html",
    "contact-form": "components/contact-form.html",
    "faq": "components/faq.html",
    "home-section-studio": "components/home-section-studio.html",
    "home-section-tagespass": "components/home-section-tagespass.html",
    "home-section-app": "components/home-section-app.html",
    "home-section-urlaubspass": "components/home-section-urlaubspass.html",
    "tarif-section-getraenkeautomat": "components/tarif-section-getraenkeautomat.html",
}


def inline_components(html):
    for slot, file in COMPONENTS.items():
        source = (ROOT / file).read_text(encoding="utf-8")
        pattern = re.compile(r"<div\s+data-" + re.escape(slot) + r"\s*>\s*</div>")
        html = pattern.sub(
            lambda match: (
                '<div data-' + slot + ' data-preview-inlined="true">\n' +
                source + '\n</div>'
            ),
            html,
        )
    return html


def main():
    if DEST.exists():
        shutil.rmtree(DEST)
    DEST.mkdir()
    for folder in ("css", "js", "images"):
        shutil.copytree(ROOT / folder, DEST / folder)

    total = 0
    for original in ROOT.glob("*.html"):
        html = inline_components(original.read_text(encoding="utf-8"))
        (DEST / original.name).write_text(html, encoding="utf-8")
        total += 1

    instructions = """<!doctype html>
<html lang="de"><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Nordkern – Vorschau starten</title>
<body style="font:16px/1.6 system-ui;max-width:680px;margin:8vh auto;padding:24px;color:#171a19">
<h1>Nordkern Fitness · Vorschau</h1>
<p>Diese Vorschau ist eine unveröffentlichte Arbeitsfassung. Sie ändert nichts an der echten Website.</p>
<p><a href="index.html">Startseite ansehen</a> ·
<a href="mitgliedschaften.html">Tarifseite ansehen</a> ·
<a href="app.html">App-Seite ansehen</a></p>
<p>Alle Seiten können ohne Terminal geöffnet werden.
Der Live-Tarifkatalog benötigt allerdings Internet und eine funktionierende Verbindung zu Supabase.</p>
<p><strong>Hinweis:</strong> Formulare und geplante App-Funktionen sind nicht produktiv freigeschaltet.</p>
</body></html>"""
    (DEST / "VORSCHAU-STARTEN.html").write_text(instructions, encoding="utf-8")
    if not (DEST / "mitgliedschaften.html").is_file():
        raise SystemExit("Tarifseite fehlt in der Vorschau")
    if "data-preview-inlined" not in (DEST / "index.html").read_text(encoding="utf-8"):
        raise SystemExit("Komponenten wurden nicht eingebettet")
    print(f"OK: {total} Seiten für Doppelklick-Vorschau mit lokalen Komponenten vorbereitet.")


if __name__ == "__main__":
    main()
