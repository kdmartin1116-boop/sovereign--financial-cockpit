import importlib.util
import os


def load_module():
    here = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "AutoTender_Sovereign"))
    path = os.path.join(here, "coupon_annotator.py")
    spec = importlib.util.spec_from_file_location("coupon_annotator", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


coupon_annotator = load_module()


def test_ocr_only_if_tesseract_installed():
    # This test will try to run OCR only if pytesseract and tesseract binary are present.
    try:
        pass
    except Exception:
        import pytest

        pytest.skip("pytesseract not installed")

    # Check for tesseract binary on PATH
    import shutil

    if not shutil.which("tesseract"):
        import pytest

        pytest.skip("tesseract binary not available")

    # Use bundled sample image if present
    sample = os.path.abspath(
        os.path.join(
            os.path.dirname(__file__), "..", "..", "credit-card-statement-example-scaled.jpg"
        )
    )
    if not os.path.exists(sample):
        import pytest

        pytest.skip("sample image not present")

    ann, sig = coupon_annotator.auto_locate_annotations(sample)
    # Ensure it returns a dict and coords tuple
    assert isinstance(ann, dict)
    assert isinstance(sig, tuple)
