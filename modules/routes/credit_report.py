from flask import Blueprint, request, jsonify
from modules.credit_report_parser import CreditReportParser
from flask_login import login_required
from modules.utils.pdf_processor import extract_text_from_pdf

credit_report_bp = Blueprint('credit_report_bp', __name__)

@credit_report_bp.route('/api/credit-report/upload', methods=['POST'])
@login_required
def upload_credit_report():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    try:
        text = None
        if file.filename.lower().endswith('.pdf'):
            text = extract_text_from_pdf(file)
        else:
            text = file.read().decode('utf-8')

        if not text:
            return jsonify({"error": "Could not extract text from file or file is empty."} ), 500

        # Parse the text
        parser = CreditReportParser(text)
        accounts = parser.parse()
        
        return jsonify(accounts)

    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500