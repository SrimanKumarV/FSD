"""Opt-in test against a real MySQL database.

Run only after applying schema.sql and exporting DB_HOST, DB_NAME, DB_USER,
DB_PASSWORD (optional DB_PORT). Set RUN_MYSQL_INTEGRATION=1. This modifies the
lab database by inserting an uniquely-named test user; use a dedicated schema.
"""
import json
import os
import unittest
import uuid
from urllib.parse import urlencode
from wsgiref.util import setup_testing_defaults

from app import create_app


def call_wsgi(app, path, payload):
    environ = {}; setup_testing_defaults(environ)
    body = json.dumps(payload).encode()
    environ.update({"REQUEST_METHOD":"POST", "PATH_INFO":path, "CONTENT_TYPE":"application/json", "CONTENT_LENGTH":str(len(body))})
    import io; environ["wsgi.input"] = io.BytesIO(body)
    captured = {}
    def start_response(status, headers): captured["status"] = status
    captured["body"] = b"".join(app(environ, start_response))
    return captured


@unittest.skipUnless(os.getenv("RUN_MYSQL_INTEGRATION") == "1", "Requires a real MySQL instance, schema and RUN_MYSQL_INTEGRATION=1")
class LiveMySQLIntegrationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        from app import mysql_connection
        cls.app = create_app(mysql_connection)
        cls.email = f"acs-lab-{uuid.uuid4().hex[:12]}@example.invalid"
        cls.password = "CorrectHorseBattery9"

    def test_live_mysql_registration_then_login(self):
        data = {"full_name":"ACS Integration Test", "email":self.email, "password":self.password}
        registered = call_wsgi(self.app, "/api/register", data)
        self.assertTrue(registered["status"].startswith("201"), registered["body"])
        login = call_wsgi(self.app, "/api/login", {"email":self.email, "password":self.password})
        self.assertTrue(login["status"].startswith("200"), login["body"])
        wrong = call_wsgi(self.app, "/api/login", {"email":self.email, "password":"wrong password"})
        self.assertTrue(wrong["status"].startswith("401"), wrong["body"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
