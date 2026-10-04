"""
Offline unit tests for the contact form endpoint (Supabase and SMTP are mocked).

Run from the project root:
  .venv\\Scripts\\python.exe -m unittest discover -s rag_service\\tests -p "test_unit_*.py"
"""
import os
import pathlib
import sys
import unittest
from unittest import mock

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from fastapi.testclient import TestClient  # noqa: E402

import contact  # noqa: E402
import main  # noqa: E402

GOOD = {
    "name": "Asha Rao",
    "email": "asha@example.com",
    "message": "Could we arrange a demo for our law school?",
    "consent": True,
}


class ContactEndpoint(unittest.TestCase):
    def setUp(self):
        contact._hits.clear()
        self.client = TestClient(main.app)
        self.store = mock.patch.object(contact, "store_message").start()
        self.notify = mock.patch.object(contact, "notify_owner").start()
        self.addCleanup(mock.patch.stopall)

    def post(self, **overrides):
        return self.client.post("/contact", json={**GOOD, **overrides})

    def test_valid_message_is_stored_and_owner_notified(self):
        r = self.post()
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json(), {"status": "ok"})
        self.store.assert_called_once()
        self.notify.assert_called_once()

    def test_honeypot_pretends_success_but_stores_nothing(self):
        r = self.post(website="http://spam.example")
        self.assertEqual(r.status_code, 200)
        self.store.assert_not_called()
        self.notify.assert_not_called()

    def test_consent_is_required(self):
        self.assertEqual(self.post(consent=False).status_code, 422)
        self.store.assert_not_called()

    def test_validation(self):
        self.assertEqual(self.post(email="not-an-email").status_code, 422)
        self.assertEqual(self.post(name="   ").status_code, 422)
        self.assertEqual(self.post(message="short").status_code, 422)
        self.assertEqual(self.post(message="x" * 2001).status_code, 422)
        self.store.assert_not_called()

    def test_rate_limit(self):
        for _ in range(contact.RATE_LIMIT):
            self.assertEqual(self.post().status_code, 200)
        self.assertEqual(self.post().status_code, 429)

    def test_storage_failure_returns_503_and_no_email(self):
        self.store.side_effect = RuntimeError("down")
        self.assertEqual(self.post().status_code, 503)
        self.notify.assert_not_called()


class RateLimiter(unittest.TestCase):
    def test_window_expires(self):
        contact._hits.clear()
        for _ in range(contact.RATE_LIMIT):
            self.assertFalse(contact.rate_limited("a", now=1000.0))
        self.assertTrue(contact.rate_limited("a", now=1001.0))
        self.assertFalse(contact.rate_limited("a", now=1000.0 + contact.RATE_WINDOW + 5))

    def test_clients_are_independent(self):
        contact._hits.clear()
        for _ in range(contact.RATE_LIMIT):
            contact.rate_limited("a", now=1.0)
        self.assertFalse(contact.rate_limited("b", now=1.0))


class Storage(unittest.TestCase):
    data = contact.ContactRequest(**GOOD)

    def test_posts_to_supabase_with_the_secret_key(self):
        env = {"SUPABASE_URL": "https://x.supabase.co/", "SUPABASE_SECRET_KEY": "sb_secret_test"}
        with mock.patch.dict(os.environ, env), mock.patch.object(contact.requests, "post") as post:
            post.return_value = mock.Mock(status_code=201, text="")
            contact.store_message(self.data)
        url = post.call_args.args[0]
        self.assertEqual(url, "https://x.supabase.co/rest/v1/contact_messages")
        self.assertEqual(post.call_args.kwargs["headers"]["apikey"], "sb_secret_test")
        self.assertEqual(post.call_args.kwargs["json"]["email"], "asha@example.com")

    def test_errors_when_unconfigured_or_rejected(self):
        with mock.patch.dict(os.environ, {"SUPABASE_URL": "", "SUPABASE_SECRET_KEY": ""}):
            with self.assertRaises(RuntimeError):
                contact.store_message(self.data)
        env = {"SUPABASE_URL": "https://x.supabase.co", "SUPABASE_SECRET_KEY": "k"}
        with mock.patch.dict(os.environ, env), mock.patch.object(contact.requests, "post") as post:
            post.return_value = mock.Mock(status_code=404, text="relation does not exist")
            with self.assertRaises(RuntimeError):
                contact.store_message(self.data)


class Notification(unittest.TestCase):
    data = contact.ContactRequest(**GOOD)
    smtp_env = {
        "CONTACT_NOTIFY_TO": "owner@example.com",
        "SMTP_HOST": "smtp.example.com",
        "SMTP_PORT": "587",
        "SMTP_USER": "bot@example.com",
        "SMTP_PASSWORD": "pw",
    }

    def test_email_has_reply_to_the_visitor(self):
        msg = contact.build_email(self.data, "bot@example.com", "owner@example.com")
        self.assertEqual(msg["Reply-To"], "asha@example.com")
        self.assertIn("Asha Rao", msg["Subject"])
        self.assertIn("law school", msg.get_content())

    def test_sends_through_smtp_when_configured(self):
        with mock.patch.dict(os.environ, self.smtp_env), mock.patch.object(contact.smtplib, "SMTP") as smtp:
            contact.notify_owner(self.data)
        server = smtp.return_value.__enter__.return_value
        server.starttls.assert_called_once()
        server.login.assert_called_once_with("bot@example.com", "pw")
        server.send_message.assert_called_once()

    def test_no_smtp_means_no_email_and_no_error(self):
        env = {"CONTACT_NOTIFY_TO": "", "SMTP_HOST": ""}
        with mock.patch.dict(os.environ, env), mock.patch.object(contact.smtplib, "SMTP") as smtp:
            contact.notify_owner(self.data)
        smtp.assert_not_called()

    def test_mail_failure_never_raises(self):
        with mock.patch.dict(os.environ, self.smtp_env), mock.patch.object(
            contact.smtplib, "SMTP", side_effect=OSError("connection refused")
        ):
            contact.notify_owner(self.data)  # must not raise


if __name__ == "__main__":
    unittest.main()
