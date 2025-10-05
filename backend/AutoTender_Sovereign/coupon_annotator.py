import argparse
import io
import json
import os
import re

from PIL import Image, ImageDraw, ImageFont
from pypdf import PdfReader, PdfWriter
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas


def create_annotation_overlay(
    annotations, signature_path=None, signature_coords=None, page_size=letter
):
    """Create a one-page PDF in memory with the given annotations and optional signature image."""
    packet = io.BytesIO()
    can = canvas.Canvas(packet, pagesize=page_size)

    for text, coords in annotations.items():
        try:
            can.drawString(coords[0], coords[1], text)
        except Exception:
            # ignore malformed coords
            pass

    if signature_path and signature_coords:
        try:
            can.drawImage(
                signature_path,
                signature_coords[0],
                signature_coords[1],
                width=100,
                height=50,
                mask="auto",
            )
        except FileNotFoundError:
            print(f"Signature file not found at {signature_path}")
        except Exception:
            pass

    can.save()
    packet.seek(0)
    return packet


def annotate_pdf_coupon(
    input_pdf_path,
    output_pdf_path,
    annotations,
    signature_path=None,
    signature_coords=None,
    scale_overlay=False,
):
    """Annotate every page of input_pdf_path with the overlay constructed from annotations.

    If scale_overlay=True, create an overlay per page sized to the page's MediaBox so
    placements match page coordinates.
    """

    reader = PdfReader(open(input_pdf_path, "rb"))
    writer = PdfWriter()

    for page in reader.pages:
        # Determine page size in points; fall back to letter
        page_size = letter
        if scale_overlay:
            try:
                # pypdf PageObject has mediabox with lower_left and upper_right in many versions
                try:
                    ll = page.mediabox.lower_left
                    ur = page.mediabox.upper_right
                    width = float(ur[0] - ll[0])
                    height = float(ur[1] - ll[1])
                    page_size = (width, height)
                except Exception:
                    # older API: use width/height attributes
                    try:
                        width = float(page.mediabox.width)
                        height = float(page.mediabox.height)
                        page_size = (width, height)
                    except Exception:
                        page_size = letter
            except Exception:
                page_size = letter

        overlay_packet = create_annotation_overlay(
            annotations, signature_path, signature_coords, page_size=page_size
        )
        overlay_pdf = PdfReader(overlay_packet)

        try:
            page.merge_page(overlay_pdf.pages[0])
        except Exception:
            # best-effort; continue
            pass

        writer.add_page(page)

    with open(output_pdf_path, "wb") as out_f:
        writer.write(out_f)

    print(f"Annotated PDF saved to {output_pdf_path}")


def _load_font(font_path=None):
    """Load a font, falling back to defaults."""
    if font_path and os.path.exists(font_path):
        try:
            return ImageFont.truetype(font_path, 32)
        except Exception:
            pass
    try:
        return ImageFont.truetype("arial.ttf", 32)
    except Exception:
        return ImageFont.load_default()


def annotate_image_coupon(
    input_image_path,
    output_image_path,
    annotations,
    signature_text=None,
    signature_coords=None,
    font_path=None,
):
    """Annotate an image with text annotations and an optional typed signature."""
    try:
        image = Image.open(input_image_path).convert("RGB")
    except FileNotFoundError:
        print(f"Input image not found: {input_image_path}")
        return

    draw = ImageDraw.Draw(image)
    font = _load_font(font_path)

    # Draw annotations
    for text, coords in annotations.items():
        try:
            draw.text(coords, text, fill="black", font=font)
        except Exception:
            pass

    # Draw typed signature
    if signature_text and signature_coords:
        try:
            sig_font = (
                ImageFont.truetype(font_path, 40)
                if font_path and os.path.exists(font_path)
                else font
            )
        except Exception:
            sig_font = font
        try:
            draw.text(signature_coords, signature_text, fill="blue", font=sig_font)
        except Exception:
            pass

    try:
        image.save(output_image_path)
        print(f"Annotated image saved to {output_image_path}")
    except Exception as e:
        print(f"Failed to save annotated image: {e}")


# OCR helper: exposed at module level so tests and callers can use it
def _process_ocr_lines(lines):
    """Process OCR lines to find annotations."""
    ann = {}
    amount_re = re.compile(r"\$?\d{1,3}(?:,\d{3})*(?:\.\d{2})")
    for _, info in lines.items():
        words = [w[0] for w in sorted(info["words"], key=lambda x: x[1])]
        line_text = " ".join(words)
        # try to find an amount in the line
        m = amount_re.search(line_text)
        if m:
            # place annotation at left,top of the amount token if possible
            # find which token contains the amount
            amount_token = None
            for w, left, top, _, _ in info["words"]:
                if m.group(0) in w or amount_re.search(w):
                    amount_token = (w, left, top)
                    break
            if amount_token:
                ann[f"Amount: {m.group(0)}"] = (amount_token[1], amount_token[2])
            else:
                ann[f"Amount: {m.group(0)}"] = (info["left"], info["top"])
            continue

        # look for label:value patterns like 'Pay to the order of: NAME' or 'Payee: NAME'
        if ":" in line_text:
            parts = [p.strip() for p in line_text.split(":", 1)]
            if len(parts) == 2 and parts[0] and parts[1]:
                label = parts[0]
                value = parts[1]
                ann[f"{label}: {value}"] = (info["left"], info["top"])
                continue

        # fallback: if line contains 'pay' or 'payee' add as pay-related annotation
        if "pay" in line_text.lower() or "order" in line_text.lower():
            ann[line_text] = (info["left"], info["top"])
    return ann


def auto_locate_annotations(img_path):
    """Use pytesseract to return a dict of detected label->(x,y) and a signature coordinate guess.

    Returns (annotations_dict, signature_coords)
    Raises RuntimeError if pytesseract is not available.
    """
    try:
        import pytesseract
        from pytesseract import Output
    except Exception as e:
        raise RuntimeError("pytesseract is not installed") from e

    if not os.path.exists(img_path):
        raise FileNotFoundError(img_path)

    img = Image.open(img_path)
    data = pytesseract.image_to_data(img, output_type=Output.DICT)
    n = len(data.get("text", []))

    # Group tokens by line number and build lines with bounding boxes
    lines = {}
    for i in range(n):
        txt = (data["text"][i] or "").strip()
        if not txt:
            continue
        line_num = data.get("line_num", [0] * n)[i]
        left = int(data["left"][i])
        top = int(data["top"][i])
        width = int(data["width"][i])
        height = int(data["height"][i])
        if line_num not in lines:
            lines[line_num] = {
                "words": [],
                "left": left,
                "top": top,
                "right": left + width,
                "bottom": top + height,
            }
        lines[line_num]["words"].append((txt, left, top, width, height))
        lines[line_num]["left"] = min(lines[line_num]["left"], left)
        lines[line_num]["top"] = min(lines[line_num]["top"], top)
        lines[line_num]["right"] = max(lines[line_num]["right"], left + width)
        lines[line_num]["bottom"] = max(lines[line_num]["bottom"], top + height)

    ann = _process_ocr_lines(lines)

    w, h = img.size
    sig_coord = (int(w * 0.1), int(h * 0.85))
    return ann, sig_coord


def _default_sample_path(relative_name: str) -> str:
    base = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    return os.path.join(base, relative_name)


def parse_args():
    p = argparse.ArgumentParser(description="Annotate coupon images or PDFs")
    p.add_argument("-i", "--input", help="Input file (image or PDF)")
    p.add_argument("-o", "--output", help="Output file path")
    p.add_argument("--pdf", action="store_true", help="Treat input as PDF")
    p.add_argument(
        "--ocr", action="store_true", help="Use OCR to auto-locate fields (requires Tesseract)"
    )
    p.add_argument("--font", help="Path to .ttf font to use for annotations")
    p.add_argument("--json-output", help="Write JSON of detected fields (use with --ocr)")
    return p.parse_args()


if __name__ == "__main__":
    args = parse_args()

    default_input = _default_sample_path("credit-card-statement-example-scaled.jpg")
    default_output = _default_sample_path("annotated-credit-card-statement-run.jpg")

    input_path = args.input if args.input else default_input
    output_path = args.output if args.output else default_output

    payment_annotations = {
        "Pay to the order of: GENERIC CREDIT CARD": (100, 2000),
        "Amount: $250.00": (100, 2080),
        "Tendered under UCC \u00a73-104 and \u00a73-603(b).": (100, 2160),
        "Refusal to accept without written cause may result in discharge of obligation.": (
            100,
            2240,
        ),
    }

    signature_text = "/s/ john-doe:smith, beneficiary"
    signature_coords = (100, 2340)

    font_path = args.font if args.font else None

    # If OCR requested, attempt to auto-locate
    ocr_annotations = None
    ocr_signature_coords = None
    if args.ocr and not (args.pdf or input_path.lower().endswith(".pdf")):
        try:
            ocr_annotations, ocr_signature_coords = auto_locate_annotations(input_path)
            if ocr_annotations:
                print("Auto-located annotations via OCR:", ocr_annotations)
        except Exception as e:
            print("OCR unavailable or failed:", e)

    use_annotations = ocr_annotations if ocr_annotations else payment_annotations
    use_signature_coords = ocr_signature_coords if ocr_signature_coords else signature_coords

    if args.ocr and args.json_output and use_annotations:
        try:
            with open(args.json_output, "w", encoding="utf-8") as jf:
                json.dump(
                    {"annotations": use_annotations, "signature_coords": use_signature_coords},
                    jf,
                    indent=2,
                )
                print(f"Wrote JSON to {args.json_output}")
        except Exception as e:
            print("Failed to write JSON:", e)

    try:
        if args.pdf or input_path.lower().endswith(".pdf"):
            annotate_pdf_coupon(input_path, output_path, use_annotations, None, None)
        else:
            annotate_image_coupon(
                input_path,
                output_path,
                use_annotations,
                signature_text,
                use_signature_coords,
                font_path,
            )
    except Exception as e:
        print("Error while annotating:", e)
