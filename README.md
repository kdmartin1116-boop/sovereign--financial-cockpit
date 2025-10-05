# Sovereign Financial Cockpit

## Disclaimer

This repository is for educational and informational purposes only. The information provided here does not constitute legal or financial advice. Consult with a qualified professional for specific guidance.

## Project overview

This repository contains multiple components. The `AutoTender_Sovereign` tool is a small utility that demonstrates annotating invoice/coupon images and PDFs with text and signatures. The larger app contains routes and utilities for a lightweight financial cockpit.

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
pip install -r AutoTender_Sovereign/requirements.txt
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
python AutoTender_Sovereign/coupon_annotator.py
```

4. Run with OCR and JSON output (after installing Tesseract):

```powershell
python AutoTender_Sovereign/coupon_annotator.py --ocr --json-output out.json
```

CI

A basic GitHub Actions workflow is included to run pytest, pre-commit, and the repository secret scan.

Notes

- OCR uses `pytesseract` only; you must install the Tesseract system binary for OCR to function.
- The annotator uses best-effort heuristics for OCR field detection; tune or replace with ML models for production.

