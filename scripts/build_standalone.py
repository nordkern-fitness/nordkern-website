"""Reproducible single-file offline preview. No app source, real account or live API."""
from pathlib import Path
import base64
import json
import mimetypes
import re
import subprocess
import build_preview

ROOT=Path(__file__).resolve().parents[1]
PAGES=("index.html","mitgliedschaften.html","standorte.html","app.html","konto.html","shop.html","kontakt.html","hausordnung.html","impressum.html")
CSP='<meta http-equiv="Content-Security-Policy" content="default-src \'none\';script-src \'unsafe-inline\';style-src \'unsafe-inline\';img-src data:;font-src data:;connect-src \'none\';form-action \'none\';frame-src \'none\';object-src \'none\';base-uri \'none\'">__NK_BOOTSTRAP__'
def safe_json(value):
    return json.dumps(value,ensure_ascii=True).replace("<",r"\u003c")
def build():
    build_preview.main()
    root=build_preview.DEST
    assets={}
    for p in sorted((root/"images").iterdir()):
        if p.is_file():
            key="images/"+p.name
            mime=mimetypes.guess_type(p.name)[0]
            if not mime or not mime.startswith("image/"): raise ValueError(key)
            assets[key]="data:"+mime+";base64,"+base64.b64encode(p.read_bytes()).decode()
    def asset_refs(s):
        # Longest first, remove cache-buster on image URLs.
        for key in sorted(assets,key=len,reverse=True):
            s=re.sub(re.escape(key)+r"(?:\?v=[\w.-]+)?",lambda _: "__NK_ASSET:"+key+"__",s)
        return s
    def css(path):
        text=path.read_text(encoding="utf-8")
        text=re.sub(r"@import\s+url\([^;]+\)\s*;","",text)
        return text.replace("../images/","images/")
    def attr(tag,key):
        m=re.search(r"\b"+key+r"\s*=\s*(['\"])(.*?)\1",tag,re.I|re.S)
        return m.group(2) if m else ""
    def link(m):
        tag=m.group(0); href=attr(tag,"href").split("?")[0]
        if attr(tag,"rel")=="stylesheet":
            return "<style>"+css(root/href)+"</style>" if re.fullmatch(r"css/[\w.-]+\.css",href) else ""
        if href.startswith("images/"): return tag
        return ""
    def script(m):
        src=attr(m.group(1),"src").split("?")[0]
        if not re.fullmatch(r"js/[\w.-]+\.js",src): raise ValueError("unexpected script: "+src)
        return "<script>"+(root/src).read_text(encoding="utf-8").replace("</script","<\\/script")+"</script>"
    pages={}
    for name in PAGES:
        s=(root/name).read_text(encoding="utf-8")
        s=re.sub(r"<iframe\b[^>]*>.*?</iframe\s*>",'<p>Externe Karte in der Offline-Vorschau deaktiviert.</p>',s,flags=re.I|re.S)
        s=re.sub(r"<link\b[^>]*>",link,s,flags=re.I)
        s=asset_refs(s)
        s=re.sub(r"(<script\b[^>]*\bsrc\s*=[^>]*>)\s*</script\s*>",script,s,flags=re.I)
        s=re.sub(r"<head\b[^>]*>",lambda m:m.group(0)+CSP,s,count=1,flags=re.I)
        if "__NK_BOOTSTRAP__" not in s: raise ValueError(name+" missing head")
        pages[name]=s
    fixture=(ROOT/"browser-tests/fixtures.cjs").read_text(encoding="utf-8")
    fixture=re.sub(r"module\.exports\s*=\s*\{[^\n]+\};", "window.nkFixture={seed,installFixtures};",fixture)
    if "window.nkFixture=" not in fixture: raise ValueError("fixture export changed")
    pack={"pages":pages,"assets":assets,"fixture":fixture,"runtime":(ROOT/"scripts/standalone-runtime.js").read_text(),"source":subprocess.check_output(["git","rev-parse","--short=12","HEAD"],cwd=ROOT,text=True).strip()}
    wrapper=(ROOT/"scripts/standalone-template.html").read_text()
    out=root/"Nordkern-Website.html"
    out.write_text(wrapper.replace("__NK_PACK__",safe_json(pack)),encoding="utf-8")
    print("Offline preview: "+str(len(pages))+" pages, "+str(len(assets))+" original image files")
    return out
if __name__=="__main__": build()
