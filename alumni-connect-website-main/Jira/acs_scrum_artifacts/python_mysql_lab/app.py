"""Small Python WSGI user interface + MySQL-backed student account lab.

Run with: python app.py
Configure DB_HOST, DB_PORT (optional), DB_NAME, DB_USER, DB_PASSWORD.
The database driver is imported only when a DB-backed route is called so that
validation and simulated integration tests can run without external packages.
"""
from __future__ import annotations
import html
import json
import os
from urllib.parse import parse_qs
from typing import Any, Callable

from security import hash_password, verify_password
from validation import EMAIL_RE, normalize_email, validate_registration


def mysql_connection() -> Any:
    """Open a real MySQL connection from environment variables."""
    import mysql.connector  # install mysql-connector-python to enable database routes
    required = ("DB_HOST", "DB_NAME", "DB_USER", "DB_PASSWORD")
    missing = [name for name in required if not os.getenv(name)]
    if missing:
        raise RuntimeError("Missing database configuration: " + ", ".join(missing))
    return mysql.connector.connect(
        host=os.environ["DB_HOST"],
        port=int(os.getenv("DB_PORT", "3306")),
        database=os.environ["DB_NAME"],
        user=os.environ["DB_USER"],
        password=os.environ["DB_PASSWORD"],
        autocommit=False,
    )


def _page(title: str, body: str) -> bytes:
    return ("<!doctype html><html lang='en'><head><meta charset='utf-8'>"
            "<meta name='viewport' content='width=device-width,initial-scale=1'>"
            f"<title>{html.escape(title)}</title><style>"
            "body{font-family:system-ui,Arial,sans-serif;max-width:720px;margin:3rem auto;padding:0 1rem;color:#182230}"
            "main{border:1px solid #d7dee7;border-radius:12px;padding:1.5rem}label{display:block;margin:.8rem 0 .25rem}"
            "input{box-sizing:border-box;width:100%;padding:.7rem;border:1px solid #9caaba;border-radius:6px}"
            "button{margin-top:1rem;background:#155eef;color:white;border:0;padding:.75rem 1rem;border-radius:7px;cursor:pointer}"
            "a{color:#155eef}small{color:#596579}</style></head><body><main>"
            f"<h1>{html.escape(title)}</h1>{body}</main></body></html>").encode("utf-8")


def create_app(connection_factory: Callable[[], Any] | None = None):
    """Build a WSGI callable. connection_factory is injectable for tests."""
    get_connection = connection_factory or mysql_connection

    def respond(start_response, status: str, body: bytes, content_type: str = "application/json; charset=utf-8"):
        start_response(status, [("Content-Type", content_type), ("Content-Length", str(len(body))), ("X-Content-Type-Options", "nosniff")])
        return [body]

    def json_response(start_response, status: str, payload: dict[str, Any]):
        return respond(start_response, status, json.dumps(payload, ensure_ascii=False).encode("utf-8"))

    def request_payload(environ) -> tuple[dict[str, Any], bool]:
        length = min(int(environ.get("CONTENT_LENGTH") or 0), 1_000_000)
        raw = environ["wsgi.input"].read(length).decode("utf-8", errors="replace") if length else ""
        content_type = environ.get("CONTENT_TYPE", "").split(";", 1)[0].lower()
        if content_type == "application/json":
            try:
                value = json.loads(raw or "{}")
                return (value if isinstance(value, dict) else {}), True
            except json.JSONDecodeError:
                return {}, True
        return {key: values[-1] for key, values in parse_qs(raw, keep_blank_values=True).items()}, False

    def do_register(payload: dict[str, Any]) -> tuple[int, dict[str, Any]]:
        full_name = str(payload.get("full_name", ""))
        email = normalize_email(str(payload.get("email", "")))
        password = str(payload.get("password", ""))
        errors = validate_registration(full_name, email, password)
        if errors:
            return 400, {"errors": errors}
        connection = cursor = None
        try:
            connection = get_connection()
            cursor = connection.cursor()
            cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
            if cursor.fetchone():
                return 409, {"error": "An account with these details already exists"}
            cursor.execute(
                "INSERT INTO users (full_name, email, password_hash) VALUES (%s, %s, %s)",
                (full_name.strip(), email, hash_password(password)),
            )
            connection.commit()
            return 201, {"message": "Registration successful"}
        except Exception:
            if connection is not None:
                try:
                    connection.rollback()
                except Exception:
                    pass
            return 500, {"error": "Unable to process registration at this time"}
        finally:
            if cursor is not None:
                cursor.close()
            if connection is not None:
                connection.close()

    def do_login(payload: dict[str, Any]) -> tuple[int, dict[str, Any]]:
        email = normalize_email(str(payload.get("email", "")))
        password = str(payload.get("password", ""))
        if not email or not EMAIL_RE.fullmatch(email) or not password:
            return 400, {"error": "Email and password are required"}
        connection = cursor = None
        try:
            connection = get_connection()
            cursor = connection.cursor(dictionary=True)
            cursor.execute("SELECT id, password_hash FROM users WHERE email = %s", (email,))
            user = cursor.fetchone()
            if not user or not verify_password(password, user["password_hash"]):
                return 401, {"error": "Invalid email or password"}
            # This educational lab verifies credentials only. Production still needs
            # session/token issuance, CSRF/rate limiting, account recovery and audit.
            return 200, {"message": "Credentials verified", "user_id": user["id"]}
        except Exception:
            return 500, {"error": "Unable to authenticate at this time"}
        finally:
            if cursor is not None:
                cursor.close()
            if connection is not None:
                connection.close()

    def application(environ, start_response):
        method = environ.get("REQUEST_METHOD", "GET").upper()
        path = environ.get("PATH_INFO", "/")
        if method == "GET" and path == "/health":
            return json_response(start_response, "200 OK", {"status": "ok", "service": "acs-student-lab"})
        if method == "GET" and path == "/":
            body = "<p>Student account lab: registration and credential verification backed by MySQL.</p>"
            body += "<p><a href='/register'>Register</a> · <a href='/login'>Log in</a> · <a href='/health'>Health endpoint</a></p>"
            body += "<small>Educational project. Do not deploy without production session, CSRF, rate-limit and operational controls.</small>"
            return respond(start_response, "200 OK", _page("ACS Student Portal Lab", body), "text/html; charset=utf-8")
        if method == "GET" and path in ("/register", "/login"):
            if path == "/register":
                title, endpoint, fields = "Create Student Account", "/register", "<label>Full name</label><input name='full_name' required maxlength='120'><label>Email</label><input type='email' name='email' required><label>Password (8–256 characters)</label><input type='password' name='password' required minlength='8' maxlength='256'>"
            else:
                title, endpoint, fields = "Student Login", "/login", "<label>Email</label><input type='email' name='email' required><label>Password</label><input type='password' name='password' required>"
            body = f"<form method='post' action='{endpoint}'>{fields}<button type='submit'>Continue</button></form><p><a href='/'>Home</a></p>"
            return respond(start_response, "200 OK", _page(title, body), "text/html; charset=utf-8")
        if method == "POST" and path in ("/register", "/api/register"):
            payload, wants_json = request_payload(environ)
            status, data = do_register(payload)
            if path.startswith("/api/") or wants_json:
                labels = {201: "201 Created", 400: "400 Bad Request", 409: "409 Conflict", 500: "500 Internal Server Error"}
                return json_response(start_response, labels[status], data)
            message = html.escape(data.get("message") or "; ".join(data.get("errors", [])) or data.get("error", "Request failed"))
            return respond(start_response, {201:"201 Created",400:"400 Bad Request",409:"409 Conflict",500:"500 Internal Server Error"}[status], _page("Registration Result", f"<p>{message}</p><p><a href='/register'>Back</a></p>"), "text/html; charset=utf-8")
        if method == "POST" and path in ("/login", "/api/login"):
            payload, wants_json = request_payload(environ)
            status, data = do_login(payload)
            if path.startswith("/api/") or wants_json:
                labels = {200: "200 OK", 400: "400 Bad Request", 401: "401 Unauthorized", 500: "500 Internal Server Error"}
                return json_response(start_response, labels[status], data)
            message = html.escape(data.get("message") or data.get("error", "Request failed"))
            return respond(start_response, {200:"200 OK",400:"400 Bad Request",401:"401 Unauthorized",500:"500 Internal Server Error"}[status], _page("Login Result", f"<p>{message}</p><p><a href='/login'>Back</a></p>"), "text/html; charset=utf-8")
        return json_response(start_response, "404 Not Found", {"error": "Not found"})

    return application


if __name__ == "__main__":
    from wsgiref.simple_server import make_server
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", "5000"))
    with make_server(host, port, create_app()) as server:
        print(f"ACS Student Portal Lab listening at http://{host}:{port}")
        server.serve_forever()
