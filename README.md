# Sovereign Financial Cockpit

## Disclaimer

This repository is for educational and informational purposes only. The information provided here does not constitute legal or financial advice. Consult with a qualified professional for specific guidance.

## Project Overview

The Sovereign Financial Cockpit is a web application designed to provide tools and resources for managing your finances with a focus on sovereignty. It features a React-based frontend and a Python (Flask) backend.

The project is organized into two main parts:

*   **`frontend`**: A modern React application providing the user interface.
*   **`backend`**: A Flask server that provides a REST API for the frontend and includes modules for various financial tasks.

This repository also contains `AutoTender_Sovereign`, a command-line utility for annotating invoices and other documents.

## Getting Started

### Prerequisites

*   [Node.js and npm](https://nodejs.org/en/)
*   [Python 3](https://www.python.org/downloads/)
*   [Tesseract](https://github.com/tesseract-ocr/tesseract) (optional, for OCR functionality)

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/your-username/sovereign-financial-cockpit.git
    cd sovereign-financial-cockpit
    ```

2.  **Install backend dependencies:**

    ```bash
    cd backend
    python -m venv .venv
    # On Windows
    .venv\Scripts\activate
    # On macOS/Linux
    source .venv/bin/activate
    pip install -r requirements.txt
    cd ..
    ```

3.  **Install frontend dependencies:**

    ```bash
    cd frontend
    npm install
    cd ..
    ```

### Running the Application

1.  **Start the backend server:**

    ```bash
    cd backend
    python app.py
    ```

    The backend server will start on `http://127.0.0.1:8001`.

2.  **Start the frontend development server:**

    ```bash
    cd frontend
    npm run dev
    ```

    The frontend development server will start on `http://localhost:5173` by default. Open this URL in your browser to use the application.

## AutoTender_Sovereign

The `AutoTender_Sovereign` tool is a small utility that demonstrates annotating invoice/coupon images and PDFs with text and signatures.

Key features in `AutoTender_Sovereign`:
- Image annotation (Pillow)
- PDF annotation (ReportLab + pypdf) — overlays applied per-page
- Optional OCR auto-locating of fields using `pytesseract` (system binary required)
- CLI options: `--input`, `--output`, `--pdf`, `--ocr`, `--font`, `--json-output`

Quick start (Windows PowerShell):

1. Create a virtual environment (recommended):

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend/AutoTender_Sovereign/requirements.txt
```

2. (Optional) Install Tesseract for OCR:

- Download the Windows installer from https://github.com/tesseract-ocr/tesseract
- Or install via winget/choco if available:

```powershell
# winget
winget install --id=UB-Mannheim.Tesseract
# or choco
choco install tesseract
```

Ensure `tesseract.exe` is on your PATH after installation.

3. Run the annotator using the bundled sample image:

```powershell
python backend/AutoTender_Sovereign/coupon_annotator.py
```

4. Run with OCR and JSON output (after installing Tesseract):

```powershell
python backend/AutoTender_Sovereign/coupon_annotator.py --ocr --json-output out.json
```

## CI

A basic GitHub Actions workflow is included to run pytest, pre-commit, and the repository secret scan.

## Notes

- OCR uses `pytesseract` only; you must install the Tesseract system binary for OCR to function.
- The annotator uses best-effort heuristics for OCR field detection; tune or replace with ML models for production.

## Developer / Contributing

There are a few helper files to make development easier:

- `requirements-dev.txt` - development dependencies (pytest, pre-commit, black, ruff, isort, pytest-cov).
- `Makefile` - common tasks: `make install`, `make test`, `make lint`, `make format`, `make run`.
- `.env.example` - example environment variables for local development.
- `Dockerfile` and `docker-compose.yml` - for local containerized development.

Quick dev setup (local):

```bash
python -m venv .venv
source .venv/bin/activate  # or .\.venv\Scripts\Activate.ps1 on Windows
pip install -r requirements.txt
pip install -r requirements-dev.txt
pre-commit install
```

Run tests:

```bash
make test
```

Format and lint:

```bash
make format
make lint
```

Run locally with Docker:

```bash
docker-compose up --build
```

CI is configured in `.github/workflows/ci.yml` and runs on PRs and pushes to `main`.