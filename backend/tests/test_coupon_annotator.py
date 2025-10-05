import importlib.util
import os
import tempfile


def load_coupon_annotator():
    here = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "AutoTender_Sovereign"))
    path = os.path.join(here, "coupon_annotator.py")
    spec = importlib.util.spec_from_file_location("coupon_annotator", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


coupon_annotator = load_coupon_annotator()


def test_image_annotation_creates_file():
    sample = os.path.abspath(
        os.path.join(
            os.path.dirname(__file__), "..", "..", "credit-card-statement-example-scaled.jpg"
        )
    )
    if not os.path.exists(sample):
        # If sample is missing, skip the test
        import pytest

        pytest.skip("sample image not present")

    fd, out = tempfile.mkstemp(suffix=".jpg")
    os.close(fd)
    try:
        coupon_annotator.annotate_image_coupon(sample, out, {"Test": (10, 10)}, "sig", (20, 20))
        assert os.path.exists(out)
        assert os.path.getsize(out) > 0
    finally:
        try:
            os.remove(out)
        except OSError:
            pass


def test_image_missing_file_handled_gracefully():
    missing = os.path.abspath(os.path.join(os.path.dirname(__file__), "no-such-file.jpg"))
    fd, out = tempfile.mkstemp(suffix=".jpg")
    os.close(fd)
    try:
        # Should not raise
        coupon_annotator.annotate_image_coupon(missing, out, {"Test": (10, 10)}, "sig", (20, 20))
        # output may or may not be created; ensure function handled missing input without exception
        assert True
    finally:
        try:
            os.remove(out)
        except OSError:
            pass
