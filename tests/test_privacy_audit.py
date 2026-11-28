"""Offline tests use fictional sample identities only."""
import unittest
from pathlib import Path
from scripts.privacy_audit import extract_provider_name, additional_occurrences, unsafe_new_commit_identity

class PrivacyAuditTest(unittest.TestCase):
    def test_extracts_authoritative_legal_name_without_baking_it_into_source(self):
        html = "<span>Vertreten durch</span>\n<p>Ada Lovelace</p>"
        self.assertEqual(extract_provider_name(html), "Ada Lovelace")

    def test_rejects_placeholder_identity(self):
        with self.assertRaises(ValueError):
            extract_provider_name("<span>Vertreten durch</span><p>[Name]</p>")

    def test_outside_legal_mentions_fail_closed(self):
        docs = {
            Path("impressum.html"): "Ada Lovelace",
            Path("index.html"): "Brand Nordkern",
            Path("README.md"): "Founder Ada Lovelace",
        }
        self.assertEqual(additional_occurrences(docs, "Ada Lovelace"), ["README.md"])

    def test_future_personal_email_and_legal_name_commit_metadata_rejected(self):
        self.assertTrue(unsafe_new_commit_identity("Nordkern Fitness", "employee@gmail.com", "Ada Lovelace"))
        self.assertTrue(unsafe_new_commit_identity("Ada Lovelace", "team@nordkern-fitness.de", "Ada Lovelace"))
        self.assertFalse(unsafe_new_commit_identity("Nordkern Fitness", "commits@nordkern-fitness.de", "Ada Lovelace"))
        self.assertFalse(unsafe_new_commit_identity("GitHub", "noreply@github.com", "Ada Lovelace"))

    def test_brand_text_does_not_cause_false_positive(self):
        self.assertEqual(additional_occurrences({
            Path("index.html"): "Nordkern Fitness is planned",
            Path("README.md"): "Nordkern Fitness",
        }, "Ada Lovelace"), [])

if __name__ == "__main__":
    unittest.main()
