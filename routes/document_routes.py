from flask import Blueprint, request, jsonify, send_file
import os
import yaml
from pypdf import PdfReader

from modules.Ucc3_Endorsements import sign_endorsement
from modules.remedy_logger import log_remedy
from modules.attach_endorsement_to_pdf import attach_endorsement_to_pdf_function, stamp_pdf_with_endorsement
from modules.utils import load_yaml_config, get_bill_data_from_source, prepare_endorsement_for_signing

document_bp = Blueprint('document_bp', __name__)

# --- CONFIGURATION ---
PRIVATE_KEY_PEM = os.environ.get("PRIVATE_KEY_PEM")
SOVEREIGN_OVERLAY_CONFIG = os.environ.get("SOVEREIGN_OVERLAY_CONFIG_PATH", "config/sovereign_overlay.yaml")

@document_bp.route('/scan-contract', methods=['POST'])
def scan_contract():
    file = request.files['contract']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    if not file.filename.lower().endswith('.pdf'):
        return jsonify({"error": "Unsupported file type. Please upload a PDF."} ), 400
    tag = request.form['tag']
    filepath = os.path.join('uploads', file.filename)
    file.save(filepath)

    # Python implementation of clausescanner.sh
    output = f"Scanning contract: {filepath} for tags: {tag}\n(pdftotext is installed, but actual scanning logic is not yet implemented)"
    return jsonify({'output': output})

@document_bp.route('/endorse-bill', methods=['POST'])
def endorse_bill():
    if not PRIVATE_KEY_PEM:
        return jsonify({"error": "Server is not configured with a private key."} ), 500

    if 'bill' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['bill']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    if not file.filename.lower().endswith('.pdf'):
        return jsonify({"error": "Unsupported file type. Please upload a PDF."} ), 400

    uploads_dir = os.path.join(os.getcwd(), 'uploads')
    os.makedirs(uploads_dir, exist_ok=True)
    filepath = os.path.join(uploads_dir, file.filename)
    file.save(filepath)

    try:
        bill_data = get_bill_data_from_source(filepath)
        if "error" in bill_data:
            return jsonify(bill_data), 500

        if not os.path.exists(SOVEREIGN_OVERLAY_CONFIG):
            return jsonify({"error": f"Configuration file not found: {SOVEREIGN_OVERLAY_CONFIG}"} ), 500

        overlay_config = load_yaml_config(SOVEREIGN_OVERLAY_CONFIG)
        if "error" in overlay_config:
            return jsonify(overlay_config), 500
        else:
            sovereign_endorsements = overlay_config.get("sovereign_endorsements", [])

        if not sovereign_endorsements:
            return jsonify({"message": "Bill processed, but no applicable endorsements found in config."} ), 200

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
        return jsonify({"error": f"File not found: {e}"} ), 500
    except yaml.YAMLError as e:
        return jsonify({"error": f"YAML parsing error in configuration: {e}"} ), 500
    except Exception as e:
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"} ), 500

@document_bp.route('/stamp_endorsement', methods=['POST'])
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

@document_bp.route('/get-bill-data', methods=['POST'])
def get_bill_data():
    if 'bill' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['bill']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    if not file.filename.lower().endswith('.pdf'):
        return jsonify({"error": "Unsupported file type. Please upload a PDF."} ), 400

    uploads_dir = os.path.join(os.getcwd(), 'uploads')
    os.makedirs(uploads_dir, exist_ok=True)
    filepath = os.path.join(uploads_dir, file.filename)
    file.save(filepath)

    try:
        bill_data = get_bill_data_from_source(filepath)
        if "error" in bill_data:
            return jsonify(bill_data), 500
        return jsonify(bill_data), 200
    except Exception as e:
        return jsonify({"error": f"Failed to extract bill data: {str(e)}"} ), 500
    finally:
        if os.path.exists(filepath):
            os.remove(filepath)

@document_bp.route('/scan-for-terms', methods=['POST'])
def scan_for_terms():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    tag = request.form.get('tag')

    if not file or not tag:
        return jsonify({"error": "Missing file or tag"}), 400

    keyword_map = {
        "hidden_fee": ["convenience fee", "service charge", "processing fee", "undisclosed", "surcharge"],
        "misrepresentation": ["misrepresented", "misleading", "deceptive", "false statement", "inaccurate"],
        "arbitration": ["arbitration", "arbitrator", "binding arbitration", "waive your right to"]
    }

    keywords = keyword_map.get(tag, [])
    if not keywords:
        return jsonify({"error": "Invalid tag specified"}), 400

    uploads_dir = os.path.join(os.getcwd(), 'uploads')
    os.makedirs(uploads_dir, exist_ok=True)
    filepath = os.path.join(uploads_dir, file.filename)
    file.save(filepath)

    try:
        text = ""
        with open(filepath, "rb") as f:
            reader = PdfReader(f)
            for page in reader.pages:
                text += page.extract_text() or ""
        
        if not text.strip():
            return jsonify({"error": "Could not extract text from PDF."} ), 500

        found_sentences = []
        sentences = text.replace('\n', ' ').split('. ')

        for sentence in sentences:
            for keyword in keywords:
                if keyword in sentence.lower():
                    found_sentences.append(sentence.strip() + ".")
                    break 
        
        return jsonify({"found_clauses": found_sentences})

    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"} ), 500
    finally:
        if os.path.exists(filepath):
            os.remove(filepath)
