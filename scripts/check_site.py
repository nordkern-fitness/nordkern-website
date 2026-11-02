"""Nordkern static website verification — no network or third-party packages."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
HTML = sorted(ROOT.rglob("*.html"))
EXCLUDE = {".git", "node_modules", "dist", "preview"}
ATTRS = {"href", "src", "poster"}


class ResourceParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.resources = []

    def handle_starttag(self, tag, attrs):
        for attr, value in attrs:
            if attr in ATTRS and value:
                self.resources.append((tag, attr, value))


def referenced_file(source, url):
    value = url.strip()
    if not value or value.startswith(("#", "//")):
        return None
    parsed = urlsplit(value)
    if parsed.scheme or parsed.netloc or not parsed.path:
        return None

    relative = Path(unquote(parsed.path).lstrip("/"))
    if ".." in relative.parts:
        raise ValueError("Pfad verlässt Website-Verzeichnis")

    if parsed.path.startswith("/"):
        return (ROOT / relative,)

    candidates = [source.parent / relative]
    # HTML components are injected into root pages; relative assets resolve there.
    if "components" in source.parts:
        candidates.append(ROOT / relative)
    return tuple(candidates)


def main():
    errors = []
    if not HTML:
        errors.append("Keine HTML-Dateien gefunden")
    cname = ROOT / "CNAME"
    if not cname.is_file() or cname.read_text(encoding="utf-8").strip() != "nordkern-fitness.de":
        errors.append("CNAME fehlt oder enthält nicht die erwartete Nordkern-Domain")

    count = 0
    for file in HTML:
        if set(file.parts) & EXCLUDE:
            continue
        parser = ResourceParser()
        parser.feed(file.read_text(encoding="utf-8"))
        for _, attr, url in parser.resources:
            try:
                candidates = referenced_file(file, url)
            except ValueError as exc:
                errors.append(f"{file.relative_to(ROOT)}: {attr}={url!r}: {exc}")
                continue
            if candidates is None:
                continue
            count += 1
            if not any(candidate.is_file() for candidate in candidates):
                errors.append(
                    f"{file.relative_to(ROOT)}: {attr}={url!r} nicht gefunden "
                    "(Groß-/Kleinschreibung prüfen)"
                )

    for error in errors:
        print("FEHLER:", error)
    print(f"Geprüft: {len(HTML)} HTML-Dateien, {count} lokale Dateiverweise")
    if errors:
        raise SystemExit(1)
    print("OK: Lokale HTML-Dateiverweise und CNAME sind konsistent")


if __name__ == "__main__":
    main()
