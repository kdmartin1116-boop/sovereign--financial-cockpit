from flask import Blueprint, jsonify, request
from flask_login import login_required

from modules.utils.pdf_processor import extract_text_from_pdf

vehicle_bp = Blueprint("vehicle_bp", __name__)


@vehicle_bp.route("/api/validations/tila", methods=["POST"])
@login_required
def validate_tila_route():
    if "file" not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    try:
        text = extract_text_from_pdf(file)
        if not text:
            return jsonify({"error": "Could not extract text from file or file is empty."}), 500

        # Basic TILA keyword search
        tila_keywords = {
            "APR": ["annual percentage rate", "apr"],
            "Finance Charge": ["finance charge"],
            "Amount Financed": ["amount financed"],
            "Total of Payments": ["total of payments"],
        }

        results = {}
        lower_text = text.lower()

        for disclosure, keywords in tila_keywords.items():
            results[disclosure] = any(keyword in lower_text for keyword in keywords)

        return jsonify({"results": results})

    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500


@vehicle_bp.route("/api/contracts/analysis", methods=["POST"])
@login_required
def scan_for_terms():
    if "file" not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files["file"]
    tag = request.form.get("tag")

    if not file or not tag:
        return jsonify({"error": "Missing file or tag"}), 400

    keyword_map = {
        "hidden_fee": [
            "convenience fee",
            "service charge",
            "processing fee",
            "undisclosed",
            "surcharge",
        ],
        "misrepresentation": [
            "misrepresented",
            "misleading",
            "deceptive",
            "false statement",
            "inaccurate",
        ],
        "arbitration": ["arbitration", "arbitrator", "binding arbitration", "waive your right to"],
    }

    keywords = keyword_map.get(tag, [])
    if not keywords:
        return jsonify({"error": "Invalid tag specified"}), 400

    # The original function saved the file, but the new utility reads it in memory.
    # This is more efficient and avoids disk I/O.
    try:
        text = extract_text_from_pdf(file)
        if not text:
            return jsonify({"error": "Could not extract text from PDF or file is empty."}), 500

        found_clauses = []
        sentences = text.replace("\n", " ").split(". ")

        for i, sentence in enumerate(sentences):
            for keyword in keywords:
                if keyword in sentence.lower():
                    context = {
                        "before": sentences[i - 1].strip() + "." if i > 0 else "",
                        "match": sentence.strip() + ".",
                        "after": sentences[i + 1].strip() + "." if i < len(sentences) - 1 else "",
                    }
                    found_clauses.append(context)
                    break

        return jsonify({"found_clauses": found_clauses})

    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500
