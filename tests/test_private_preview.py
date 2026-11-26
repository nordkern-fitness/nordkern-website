import sys
import tempfile
import threading
import unittest
from pathlib import Path
from http.client import HTTPConnection

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from private_preview import make_server
from build_preview import inline_components

class InlinedComponentsTest(unittest.TestCase):
    def test_class_bearing_home_slots_are_preserved_and_inlined(self):
        for slot in ("home-section-studio", "home-section-tagespass", "home-section-urlaubspass", "home-section-app"):
            source = '<div class="home-slot" data-' + slot + '></div>'
            result = inline_components(source)
            self.assertIn('class="home-slot"', result)
            self.assertIn('data-preview-inlined="true"', result)
            self.assertIn('<article', result)
            self.assertNotEqual(source, result)

    def test_boolean_slot_with_following_attribute(self):
        result = inline_components('<div data-header class="example"></div>')
        self.assertIn('data-header class="example" data-preview-inlined="true"', result)
        self.assertIn('<header', result)

class PrivatePreviewTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        Path(self.temp.name, "index.html").write_text("<h1>Internal test</h1>")
        self.server = make_server(0, self.temp.name)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join()
        self.temp.cleanup()
    def request(self, path="/", method="GET", host=None):
        port = self.server.server_port
        connection = HTTPConnection("127.0.0.1", port, timeout=5)
        try:
            connection.request(method, path, headers={"Host": host or f"127.0.0.1:{port}"})
            response = connection.getresponse()
            response.read()
            return response.status, dict(response.getheaders())
        finally:
            connection.close()
    def test_loopback_and_csp(self):
        self.assertEqual(self.server.server_address[0], "127.0.0.1")
        status, headers = self.request()
        self.assertEqual(status, 200)
        self.assertIn("connect-src 'none'", headers["Content-Security-Policy"])
        self.assertIn("form-action 'none'", headers["Content-Security-Policy"])
        self.assertEqual(headers["Cache-Control"], "no-store")
    def test_rejects_alternate_host(self):
        self.assertEqual(self.request(host="external.example")[0], 403)
    def test_no_source_or_write(self):
        self.assertEqual(self.request("/../.git/config")[0], 404)
        self.assertEqual(self.request("/index.html", "POST")[0], 501)
    def test_no_directory_listing(self):
        Path(self.temp.name,"empty").mkdir()
        self.assertEqual(self.request("/empty/")[0], 404)
