"""Offline integration tests: WSGI request -> handler -> SQL repository contract.
These use a deterministic fake DB. They are not a substitute for live MySQL tests.
"""
import io
import json
import unittest
from urllib.parse import urlencode
from wsgiref.util import setup_testing_defaults

from app import create_app
from tests.fakes import FakeDatabase


def request(app, method="GET", path="/", payload=None, content_type="application/json"):
    environ = {}
    setup_testing_defaults(environ)
    environ.update({"REQUEST_METHOD": method, "PATH_INFO": path, "CONTENT_TYPE": content_type})
    if payload is None:
        body = b""
    elif content_type == "application/json":
        body = json.dumps(payload).encode()
    else:
        body = urlencode(payload).encode()
    environ["CONTENT_LENGTH"] = str(len(body))
    environ["wsgi.input"] = io.BytesIO(body)
    captured = {}
    def start_response(status, headers):
        captured["status"] = status
        captured["headers"] = dict(headers)
    body_bytes = b"".join(app(environ, start_response))
    captured["body"] = body_bytes
    return captured


class WSGIIntegrationTests(unittest.TestCase):
    def setUp(self):
        self.db = FakeDatabase()
        self.app = create_app(self.db.connect)

    def test_home_and_health_routes(self):
        home = request(self.app)
        health = request(self.app, path="/health")
        self.assertTrue(home["status"].startswith("200"))
        self.assertIn(b"ACS Student Portal Lab", home["body"])
        self.assertEqual(json.loads(health["body"])["status"], "ok")

    def test_registration_persists_hashed_password_and_duplicate_is_rejected(self):
        payload = {"full_name":"Student A", "email":" Student@Example.com ", "password":"StrongPass123"}
        created = request(self.app, "POST", "/api/register", payload)
        self.assertTrue(created["status"].startswith("201"))
        self.assertIn("student@example.com", self.db.users)
        self.assertNotEqual(self.db.users["student@example.com"]["password_hash"], payload["password"])
        duplicate = request(self.app, "POST", "/api/register", payload)
        self.assertTrue(duplicate["status"].startswith("409"))
        self.assertEqual(len(self.db.users), 1)
        self.assertEqual(self.db.commits, 1)

    def test_validation_rejects_bad_payload_before_opening_database(self):
        response = request(self.app, "POST", "/api/register", {"full_name":"", "email":"bad", "password":"x"})
        self.assertTrue(response["status"].startswith("400"))
        self.assertEqual(len(self.db.users), 0)
        self.assertEqual(self.db.commits, 0)

    def test_login_accepts_correct_and_rejects_wrong_password(self):
        payload = {"full_name":"Student A", "email":"student@example.com", "password":"StrongPass123"}
        request(self.app, "POST", "/api/register", payload)
        good = request(self.app, "POST", "/api/login", {"email":"STUDENT@example.com", "password":"StrongPass123"})
        bad = request(self.app, "POST", "/api/login", {"email":"student@example.com", "password":"incorrect-password"})
        self.assertTrue(good["status"].startswith("200"))
        self.assertTrue(bad["status"].startswith("401"))

    def test_html_form_post_escapes_result(self):
        response = request(self.app, "POST", "/register", {"full_name":"Student <A>", "email":"bad", "password":"x"}, "application/x-www-form-urlencoded")
        self.assertTrue(response["status"].startswith("400"))
        self.assertIn(b"Registration Result", response["body"])
        self.assertNotIn(b"<A>", response["body"])

    def test_unknown_user_gets_generic_authentication_failure(self):
        response = request(self.app, "POST", "/api/login", {"email":"missing@example.com", "password":"StrongPass123"})
        self.assertTrue(response["status"].startswith("401"))
        payload = json.loads(response["body"])
        self.assertEqual(payload["error"], "Invalid email or password")
        self.assertNotIn("missing@example.com", response["body"].decode())

    def test_database_connection_failure_returns_generic_error(self):
        def failing_connection_factory():
            raise RuntimeError("private-hostname-and-password-must-not-leak")
        failing_app = create_app(failing_connection_factory)
        response = request(failing_app, "POST", "/api/login", {"email":"student@example.com", "password":"StrongPass123"})
        self.assertTrue(response["status"].startswith("500"))
        self.assertEqual(json.loads(response["body"]), {"error":"Unable to authenticate at this time"})
        self.assertNotIn("private-hostname", response["body"].decode())


if __name__ == "__main__":
    unittest.main(verbosity=2)
