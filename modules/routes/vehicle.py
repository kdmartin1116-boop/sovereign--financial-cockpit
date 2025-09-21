from flask import Blueprint, request, jsonify
from pypdf import PdfReader
from flask_login import login_required

vehicle_bp = Blueprint('vehicle_bp', __name__)

@vehicle_bp.route('/api/vehicle/validate-tila', methods=['POST'])
@login_required
def validate_tila_route():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    try:
        text = ""
        reader = PdfReader(file)
        for page in reader.pages:
            text += page.extract_text() or ""
        
        if not text.strip():
            return jsonify({"error": "Could not extract text from file."}), 500

        # Basic TILA keyword search
        tila_keywords = {
            "APR": ["annual percentage rate", "apr"],
            "Finance Charge": ["finance charge"],
            "Amount Financed": ["amount financed"],
            "Total of Payments": ["total of payments"]
        }

        results = {}
        lower_text = text.lower()

        for disclosure, keywords in tila_keywords.items():
            results[disclosure] = any(keyword in lower_text for keyword in keywords)

        return jsonify({"results": results})

    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500