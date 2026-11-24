"""9.1 Privacy guard for PUBLIC website PRs; never print name or emails.

Legal content is deliberately preserved: the DDG §5 provider information
must be settled by a qualified legal reviewer, not removed by automation.
This guard instead prevents accidental duplication in code and preview ZIPs.
"""
from pathlib import Path
import argparse
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
LEGAL = Path("impressum.html")
TEXT_EXT = {".html", ".md", ".py", ".js", ".cjs", ".mjs", ".ts", ".tsx",
            ".css", ".txt", ".yml", ".yaml", ".json", ".toml", ".xml", ".sh"}


def extract_provider_name(html):
    match = re.search(
        r"<span>\s*Vertreten durch\s*</span>\s*<p>\s*([^<>]+?)\s*</p>",
        html, flags=re.I | re.S,
    )
    if not match:
        raise ValueError("Legal representation must be inspected manually")
    name = match.group(1).strip()
    if not re.fullmatch(r"[\wÄÖÜäöüß'-]+(?:\s+[\wÄÖÜäöüß'-]+)+", name):
        raise ValueError("Imprint identity is missing or incomplete; legal review required")
    return name


def additional_occurrences(texts, name):
    """Return only paths; never return or print the personal name."""
    return sorted(str(path) for path, contents in texts.items()
                  if path != LEGAL and name.casefold() in contents.casefold())


def tracked_texts():
    result = subprocess.run(
        ["git", "ls-files", "-z"], cwd=ROOT, check=True,
        stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
    )
    data = {}
    for raw in result.stdout.split(b"\0"):
        if not raw:
            continue
        path = Path(raw.decode("utf-8", errors="replace"))
        if path.suffix.lower() not in TEXT_EXT and path.name not in {
            "CNAME", "LICENSE", "README"
        }:
            continue
        file = ROOT / path
        if not file.is_file():
            continue
        try:
            data[path] = file.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError):
            continue
    return data


def audit(preview=False):
    texts = tracked_texts()
    legal = (ROOT / LEGAL).read_text(encoding="utf-8")
    name = extract_provider_name(legal)
    legal_count = legal.casefold().count(name.casefold())
    if legal_count < 2:
        raise ValueError("Unexpected legal identity change: manual review needed")
    extra = additional_occurrences(texts, name)
    print(f"PRIVACY: {legal_count} existing legally relevant mentions in "
          "impressum.html; legal source preserved, not redacted")
    if extra:
        print("ERROR: New/unnecessary personal name exposure in tracked paths: "
              + ", ".join(extra))
        return 1
    if preview:
        directory = ROOT / "preview"
        if not (directory / LEGAL).is_file():
            print("ERROR: Preview legal link notice missing")
            return 1
        leaked = []
        for file in directory.rglob("*"):
            if file.is_file() and file.suffix.lower() in TEXT_EXT:
                if name.casefold() in file.read_text(encoding="utf-8").casefold():
                    leaked.append(file.relative_to(ROOT).as_posix())
        if leaked:
            print("ERROR: Personal legal identity repeated in preview: "
                  + ", ".join(sorted(leaked)))
            return 1
        if "nordkern-fitness.de/impressum.html" not in (
            directory / LEGAL).read_text(encoding="utf-8"):
            print("ERROR: Preview legal notice lacks published imprint link")
            return 1
        print("PRIVACY: Offline preview does not duplicate legal identity")
    print("PRIVACY: No additional personal name exposure in tracked text files")
    return 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--preview", action="store_true")
    args = parser.parse_args()
    try:
        raise SystemExit(audit(preview=args.preview))
    except (ValueError, OSError) as exc:
        # Avoid echoing unexpected contents of legal files or private data.
        print("ERROR: Privacy source invariant failed; inspect legal document")
        raise SystemExit(1) from None
