"""Internal loopback-only preview; does not publish or proxy requests."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from functools import partial
import argparse
import build_preview

CSP = ("default-src 'self'; script-src 'self' 'unsafe-inline'; "
       "style-src 'self' 'unsafe-inline'; img-src 'self' data:; "
       "font-src 'self' data:; connect-src 'none'; form-action 'none'; "
       "object-src 'none'; frame-src 'none'; frame-ancestors 'none'; base-uri 'none'")

class PreviewHandler(SimpleHTTPRequestHandler):
    def parse_request(self):
        if not super().parse_request():
            return False
        if self.headers.get("Host") != f"127.0.0.1:{self.server.server_port}":
            self.send_error(403)
            return False
        return True

    def end_headers(self):
        self.send_header("Content-Security-Policy", CSP)
        self.send_header("X-Robots-Tag", "noindex, nofollow, noarchive")
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        super().end_headers()

    def list_directory(self, path):
        self.send_error(404)
        return None

    def log_message(self, fmt, *args):
        pass

def make_server(port, directory):
    return ThreadingHTTPServer(("127.0.0.1", port),
        partial(PreviewHandler, directory=str(directory)))

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=8765)
    args = parser.parse_args()
    build_preview.main()
    with make_server(args.port, Path(__file__).resolve().parents[1] / "preview") as server:
        print(f"LOCAL ONLY: http://127.0.0.1:{server.server_port}/VORSCHAU-STARTEN.html", flush=True)
        print("API/form submissions blocked by CSP. Do not enter real data or follow external links.", flush=True)
        server.serve_forever()

if __name__ == "__main__":
    main()
