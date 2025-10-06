# Architecture Overview

This document provides a brief overview of the project's architecture.

- Frontend: React app in `frontend/`.
- Backend: Flask app at the repository root (`app.py`) and a legacy `backend/app.py` used by some tests. Blueprints are in `modules/routes/` and `routes/`.
- Utilities: `backend/AutoTender_Sovereign` contains the coupon annotator CLI.
- Data: `app_database.db` (SQLite) is used for development. Use `SQLALCHEMY_DATABASE_URI` to point to the DB.

Blueprints and responsibilities:
- `modules/routes/endorsement.py`: endorsement and signing logic.
- `routes/document_routes.py`: document parsing and endpoints for scanning and endorsements.
- `routes/generator_routes.py`: letter generator endpoints.

Testing & CI:
- Tests live under `tests/` and `backend/tests/`.
- CI is configured via `.github/workflows/ci.yml` and runs pre-commit and pytest.

Notes:
- There are two `app.py` files (root and `backend/`). This is historical; consider consolidating to avoid confusion.
- Secret scanning helper: `tools/secret_scan.py` (if present) is executed in CI as an optional step.
