# ACS Student Account Lab (Experiment 10)

A small standard-library WSGI application with HTML screens and a MySQL-backed repository for student registration and credential verification.

## Features
- Python-rendered landing, registration and login UI (`/`, `/register`, `/login`).
- JSON endpoints: `GET /health`, `POST /api/register`, `POST /api/login`.
- Input validation, normalized email, parameterized SQL, unique email constraint, PBKDF2-HMAC-SHA256 password hashing and generic authentication failures.
- No database credentials in source; configuration is read from environment variables.
- Unit tests, offline WSGI/database-contract integration tests using a fake DB, and an opt-in real MySQL test suite.

## Set up a real MySQL database
1. Install Python 3.10+.
2. Install the driver: `python -m pip install -r requirements.txt`.
3. Apply schema: `mysql -u <user> -p < schema.sql` (the schema creates `acs_student_lab`).
4. Export `DB_HOST`, `DB_NAME=acs_student_lab`, `DB_USER`, `DB_PASSWORD`, and optional `DB_PORT`.
5. Run `python app.py`; visit `http://127.0.0.1:5000`.

## Test
From this directory run `python -m unittest discover -s tests -v`.

- Unit tests: pure validation and password security helpers.
- Offline integration tests: WSGI routing -> request parsing -> handlers -> SQL repository contract, using a fake in-memory database. These are deterministic but do **not** prove MySQL is available.
- Live MySQL integration: after setting DB environment variables and using a dedicated test schema, run `RUN_MYSQL_INTEGRATION=1 python -m unittest tests.test_mysql_integration -v`. This creates a uniquely named disposable test account; use only a lab schema.

## Limitations
This is a lab demonstration, not a production identity service. Before production use, add secure sessions/tokens, CSRF controls for browser forms, rate limiting, password reset, audit logging, secure cookie configuration, deployment hardening and operational monitoring. Do not claim live MySQL integration passed unless the opt-in suite has run against MySQL.
