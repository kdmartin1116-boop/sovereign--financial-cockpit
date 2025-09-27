from flask import Blueprint, request, jsonify, send_file
from pypdf import PdfReader
import os
import json
from modules.bill_parser import BillParser
from modules.Ucc3_Endorsements import sign_endorsement
from modules.remedy_logger import log_remedy
from modules.attach_endorsement_to_pdf import attach_endorsement_to_pdf_function, stamp_pdf_with_endorsement
import yaml
from datetime import datetime
from flask_login import login_required
from modules.utils.pdf_processor import extract_text_from_pdf
from modules.utils.annotator import annotate_pdf_coupon, annotate_image_coupon

endorsement_bp = Blueprint('endorsement_bp', __name__)

# --- HELPER FUNCTIONS (from endorsement engine) ---

def load_yaml_config(config_path: str) -> dict:
    try:
        with open(config_path, 'r') as file:
            config = yaml.safe_load(file)
        return config
    except FileNotFoundError:
        return {"error": f"Config file not found: {config_path}"}
    except yaml.YAMLError as e:
        return {"error": f"Error parsing YAML: {e}"}

def get_bill_data_from_source(file_storage) -> dict:
    text = extract_text_from_pdf(file_storage)
    if not text:
        return {"error": "Could not parse bill data from PDF (no text extracted)."}
    
    parser = BillParser()
    bill_data = parser.parse_bill(text)

    if not bill_data.get("bill_number"):
        return {"error": "Could not parse bill number from PDF."}
        
    return bill_data

def prepare_endorsement_for_signing(bill_data: dict, endorsement_text: str) -> dict:
    return {
        "document_type": bill_data.get("document_type", "Unknown"),
        "bill_number": bill_data.get("bill_number", "N/A"),
        "customer_name": bill_data.get("customer_name", "N/A"),
        "total_amount": bill_data.get("total_amount", "N/A"),
        "currency": bill_data.get("currency", "N/A"),
        "endorsement_date": datetime.now().strftime("%Y-%m-%d"),
        "endorser_id": "WEB-UTIL-001",
        "endorsement_text": endorsement_text
    }



@endorsement_bp.route('/api/bills/endorse', methods=['POST'])
@login_required
def endorse_bill():
    PRIVATE_KEY_PEM = os.environ.get("PRIVATE_KEY_PEM")
    SOVEREIGN_OVERLAY_CONFIG = os.environ.get("SOVEREIGN_OVERLAY_CONFIG_PATH", "config/sovereign_overlay.yaml")
    if not PRIVATE_KEY_PEM:
        return jsonify({"error": "Server is not configured with a private key."} ), 500

    if 'bill' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['bill']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    if not file.filename.lower().endswith('.pdf'):
        return jsonify({"error": "Unsupported file type. Please upload a PDF."} ), 400

    try:
        # The file is now processed in memory, no need to save it first for parsing.
        bill_data = get_bill_data_from_source(file)
        if "error" in bill_data:
            return jsonify(bill_data), 500

        if not os.path.exists(SOVEREIGN_OVERLAY_CONFIG):
            return jsonify({"error": f"Configuration file not found: {SOVEREIGN_OVERLAY_CONFIG}"}), 500

        overlay_config = load_yaml_config(SOVEREIGN_OVERLAY_CONFIG)
        if "error" in overlay_config:
            return jsonify(overlay_config), 500
        else:
            sovereign_endorsements = overlay_config.get("sovereign_endorsements", [])

        if not sovereign_endorsements:
            return jsonify({"message": "Bill processed, but no applicable endorsements found in config."} ), 200

        # Save the file now that we need to attach things to it
        uploads_dir = os.path.join(os.getcwd(), 'uploads')
        os.makedirs(uploads_dir, exist_ok=True)
        filepath = os.path.join(uploads_dir, file.filename)
        file.seek(0) # Reset file pointer before saving
        file.save(filepath)

        endorsed_files = []
        for endorsement_type in sovereign_endorsements:
            trigger = endorsement_type.get("trigger", "Unknown")
            meaning = endorsement_type.get("meaning", "")
            ink_color = endorsement_type.get("ink_color", "black")
            placement = endorsement_type.get("placement", "Front")
            page_index = 0 if placement.lower() == "front" else -1

            endorsement_text = f"{trigger}: {meaning}"
            endorsement_to_sign = prepare_endorsement_for_signing(bill_data, endorsement_text)

            signed_endorsement = sign_endorsement(
                endorsement_data=endorsement_to_sign,
                endorser_name=bill_data.get("customer_name", "N/A"),
                private_key_pem=PRIVATE_KEY_PEM
            )

            bill_for_logging = {
                "instrument_id": bill_data.get("bill_number"),
                "issuer": bill_data.get("issuer", "Unknown"),
                "recipient": bill_data.get("customer_name"),
                "amount": bill_data.get("total_amount"),
                "currency": bill_data.get("currency"),
                "description": bill_data.get("description", "N/A"),
                "endorsements": [{
                    "endorser_name": signed_endorsement.get("endorser_id"),
                    "text": endorsement_text,
                    "next_payee": "Original Creditor",
                    "signature": signed_endorsement["signature"]
                }],
                "signature_block": {
                    "signed_by": signed_endorsement.get("endorser_id"),
                    "capacity": "Payer",
                    "signature": signed_endorsement["signature"],
                    "date": signed_endorsement.get("endorsement_date")
                }
            }

            log_remedy(bill_for_logging)

            output_pdf_name = f"endorsed_{os.path.basename(filepath).replace('.pdf', '')}_{trigger.replace(' ', '')}.pdf"
            endorsed_output_path = os.path.join(uploads_dir, output_pdf_name)

            attach_endorsement_to_pdf_function(
                original_pdf_path=filepath,
                endorsement_data=bill_for_logging,
                output_pdf_path=endorsed_output_path,
                ink_color=ink_color,
                page_index=page_index
            )
            endorsed_files.append(output_pdf_name)

        return jsonify({"message": "Bill endorsed successfully", "endorsed_files": endorsed_files})

    except FileNotFoundError as e:
        return jsonify({"error": f"File not found: {e}"}), 500
    except yaml.YAMLError as e:
        return jsonify({"error": f"YAML parsing error in configuration: {e}"}), 500
    except Exception as e:
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500

@endorsement_bp.route('/api/endorsements', methods=['POST'])
@login_required
def stamp_endorsement_route():
    if 'bill' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['bill']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if not file.filename.lower().endswith('.pdf'):
        return jsonify({"error": "Unsupported file type. Please upload a PDF."} ), 400

    x = float(request.form.get('x', 0))
    y = float(request.form.get('y', 0))
    endorsement_text = request.form.get('endorsement_text', '')
    qualifier = request.form.get('qualifier', '')

    uploads_dir = os.path.join(os.getcwd(), 'uploads')
    os.makedirs(uploads_dir, exist_ok=True)
    original_filepath = os.path.join(uploads_dir, file.filename)
    file.save(original_filepath)

    output_filename = f"stamped_{file.filename}"
    output_filepath = os.path.join(uploads_dir, output_filename)

    success = stamp_pdf_with_endorsement(
        original_pdf_path=original_filepath,
        output_pdf_path=output_filepath,
        x=x,
        y=y,
        endorsement_text=endorsement_text,
        qualifier=qualifier
    )

    if success:
        return send_file(output_filepath, as_attachment=True, download_name=output_filename)
    else:
        return jsonify({"error": "Failed to stamp PDF"}), 500

@endorsement_bp.route('/get-bill-data', methods=['POST'])
@login_required
def get_bill_data():
    if 'bill' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['bill']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    if not file.filename.lower().endswith('.pdf'):
        return jsonify({"error": "Unsupported file type. Please upload a PDF."} ), 400

    try:
        bill_data = get_bill_data_from_source(file)
        if "error" in bill_data:
            return jsonify(bill_data), 500
        return jsonify(bill_data), 200
    except Exception as e:
        return jsonify({"error": f"Failed to extract bill data: {str(e)}"}), 500
