# Alumnex Connect Scrum Lab — Evidence Package

This package accompanies Jira project **ACS — Alumnex Connect - Scrum** and the ten faculty experiments. The model artifacts have been updated from a generic student/course/examination sample to the actual Alumnex Connect product domain.

## Product source studied
- Repository: https://github.com/SrimanKumarV/FSD/tree/master/alumni-connect-website-main
- Live web demo: https://alumnex-connect.onrender.com
- Production backend: https://alumnex-backend-9y5t.onrender.com

Actual product stack: React frontend, Node.js/Express API, MongoDB/Mongoose persistence, Socket.IO/Redis real-time messaging, AI provider integrations and Capacitor Android client. The faculty's separate Python/MySQL requirement is demonstrated in `python_mysql_lab/`; it must not be presented as the production Alumnex technology stack.

## Contents
- `diagrams/use_case_model.png` / `.svg` / `.dot` / `.mmd`: Alumnex business actors and system use cases.
- `diagrams/domain_model.png` / `.svg` / `.mmd`: Alumnex conceptual domain entities and major associations.
- `diagrams/class_roles.md`: Boundary / Control / Entity classification grounded in existing React pages, Express routes/services and Mongoose models.
- `python_mysql_lab/`: separate Python WSGI registration/login UI, schema, validation/security helpers, automated tests and XAMPP setup instructions.
- `test-results.txt`: latest actual offline Python lab test run.

## Test evidence
Run from `python_mysql_lab/`:

```bash
PYTHONPATH=. python -m unittest discover -s tests -v
```

Recorded result: 16 tests discovered, 15 passed, 1 skipped, 0 failures. The skipped test needs a real configured MySQL instance. Do not claim live MySQL integration until that test passes against an actual database.

The GitHub repository has its own Node/Jest, frontend build and Playwright workflow. The repository README reports 56 backend tests, but this was not independently re-run from this package's runtime. Deployment metadata showed the Render frontend/backend deployments live on 11 Oct 2026, but direct browser access from the package-generation environment was blocked by DNS; no manual production user journey is claimed here.
