# AutoTender_Sovereign — Coupon Annotator

This small tool demonstrates annotating invoice/coupon images and PDFs with text and signatures.

Features added:
- Image annotation (Pillow)
- PDF annotation (ReportLab + pypdf) — now applies overlay to all pages
- Optional OCR auto-locating of fields using `pytesseract` (requires Tesseract binary)
- CLI options: `--input`, `--output`, `--pdf`, `--ocr`, `--font`, `--json-output`
 - PDF overlay scaling per page: `--scale-overlay` (generate overlays sized to each PDF page so coordinates align)
 - Improved OCR grouping heuristics (groups tokens into lines, extracts label:value pairs and amounts)

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

3. Run the annotator using bundled sample image:

```powershell
python AutoTender_Sovereign/coupon_annotator.py
```

4. Run with OCR and JSON output (after installing Tesseract):

```powershell
python AutoTender_Sovereign/coupon_annotator.py --ocr --json-output out.json
```

CI

A basic GitHub Actions workflow is included to run pytest.

Notes
- OCR uses `pytesseract` only; you must install the Tesseract system binary for OCR to function.
- The script uses best-effort heuristics for OCR field detection; tune or replace with machine-learning models for production use.
