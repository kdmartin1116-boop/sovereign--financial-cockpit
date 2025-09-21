from flask import Blueprint, request, jsonify
from pypdf import PdfReader
from modules.credit_report_parser import CreditReportParser
from flask_login import login_required

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
        # Read the file content
        if file.filename.lower().endswith('.pdf'):
            text = ""
            reader = PdfReader(file)
            for page in reader.pages:
                text += page.extract_text() or ""
        else:
            text = file.read().decode('utf-8')

        if not text.strip():
            return jsonify({"error": "Could not extract text from file."} ), 500

        # Parse the text
        parser = CreditReportParser(text)
        accounts = parser.parse()
        
        return jsonify(accounts)

    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500