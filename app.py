from flask import Flask, request, jsonify, render_template, send_file, send_from_directory
import subprocess
import os
import sys
import yaml
from datetime import datetime
from pypdf import PdfReader
import pytesseract
from PIL import Image

# Add the project root to the Python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

# --- MODULES FROM ENDORSEMENT ENGINE -- -
from modules.Ucc3_Endorsements import sign_endorsement
from modules.remedy_logger import log_remedy
from modules.bill_parser import BillParser
from modules.attach_endorsement_to_pdf import attach_endorsement_to_pdf_function, stamp_pdf_with_endorsement

# Disable default static serving
app = Flask(__name__, static_folder='dist', template_folder='dist/src', static_url_path='/')



# --- CONFIGURATION ---
# Load the private key from an environment variable for security or from file
PRIVATE_KEY_PEM = os.environ.get("PRIVATE_KEY_PEM")
if not PRIVATE_KEY_PEM:
    try:
        with open("config/private_key.pem", "r") as f:
            PRIVATE_KEY_PEM = f.read()
    except FileNotFoundError:
        PRIVATE_KEY_PEM = None # Or handle the error as appropriate
SOVEREIGN_OVERLAY_CONFIG = os.environ.get("SOVEREIGN_OVERLAY_CONFIG_PATH", "config/sovereign_overlay.yaml")

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

def get_bill_data_from_source(bill_source_path: str) -> dict:
    if bill_source_path.endswith(".pdf"):
        text = ""
        try:
            with open(bill_source_path, "rb") as f:
                reader = PdfReader(f)
                for page in reader.pages:
                    text += page.extract_text() or ""
        except Exception as e:
            # Fallback to OCR if text extraction fails
            try:
                # Convert PDF to image and then use OCR
                # This requires poppler-utils to be installed on the system
                # and pytesseract to be configured to find it.
                # For simplicity, this example assumes a direct image conversion
                # or that the PDF is already an image.
                # A more robust solution would involve pdf2image library.
                # For now, we'll simulate by assuming the PDF is an image.
                # This part needs actual implementation for PDF to image conversion.
                # For a real application, consider 'pdf2image' library.
                # Example: images = convert_from_path(bill_source_path)
                # For this example, we'll just assume a direct OCR on the PDF path
                # which pytesseract can sometimes do if poppler is configured.
                text = pytesseract.image_to_string(bill_source_path)
            except Exception as ocr_e:
                return {"error": f"PDF text extraction and OCR failed: {e}, {ocr_e}"}

        if not text.strip():
            return {"error": "Could not parse bill data from PDF (no text extracted)."}
        
        parser = BillParser()
        bill_data = parser.parse_bill(text)

        if not bill_data.get("bill_number"):
            return {"error": "Could not parse bill number from PDF."}
            
        return bill_data
    else:
        return {"error": "Unsupported bill source format."}

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

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/scan-contract', methods=['POST'])
def scan_contract():
    file = request.files['contract']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    if not file.filename.lower().endswith('.pdf'):
        return jsonify({"error": "Unsupported file type. Please upload a PDF."}), 400
    tag = request.form['tag']
    filepath = os.path.join('uploads', file.filename)
    file.save(filepath)

    output = f"Scanning contract: {filepath} for tags: {tag}\n(pdftotext is installed, but actual scanning logic is not yet implemented)"
    return jsonify({'output': output})

@app.route('/endorse-bill', methods=['POST'])
def endorse_bill():
    if not PRIVATE_KEY_PEM:
        return jsonify({"error": "Server is not configured with a private key."}), 500

    if 'bill' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['bill']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    if not file.filename.lower().endswith('.pdf'):
        return jsonify({"error": "Unsupported file type. Please upload a PDF."}), 400

    uploads_dir = os.path.join(os.getcwd(), 'uploads')
    os.makedirs(uploads_dir, exist_ok=True)
    filepath = os.path.join(uploads_dir, file.filename)
    file.save(filepath)

    try:
        bill_data = get_bill_data_from_source(filepath)
        if "error" in bill_data:
            return jsonify(bill_data), 500

        # Check if SOVEREIGN_OVERLAY_CONFIG file exists
        if not os.path.exists(SOVEREIGN_OVERLAY_CONFIG):
            return jsonify({"error": f"Configuration file not found: {SOVEREIGN_OVERLAY_CONFIG}"}), 500

        overlay_config = load_yaml_config(SOVEREIGN_OVERLAY_CONFIG)
        if "error" in overlay_config:
            # This means there was a YAML parsing error
            return jsonify(overlay_config), 500
        else:
            sovereign_endorsements = overlay_config.get("sovereign_endorsements", [])

        if not sovereign_endorsements:
            return jsonify({"message": "Bill processed, but no applicable endorsements found in config."}), 200

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
        # Catch any other unexpected errors
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500

@app.route('/stamp_endorsement', methods=['POST'])
def stamp_endorsement_route():
    if 'bill' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['bill']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if not file.filename.lower().endswith('.pdf'):
        return jsonify({"error": "Unsupported file type. Please upload a PDF."}), 400

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

@app.route('/generate-tender-letter', methods=['POST'])
def generate_tender_letter():
    data = request.get_json()
    user_name = data.get('userName')
    user_address = data.get('userAddress')
    creditor_name = data.get('creditorName')
    creditor_address = data.get('creditorAddress')
    bill_file_name = data.get('billFileName')

    if not all([user_name, user_address, creditor_name, creditor_address, bill_file_name]):
          return jsonify({"error": "Missing required data for tender letter generation."}), 400      
    today = datetime.now().strftime("%B %d, %Y")

    tender_letter_content = f"""
*** DISCLAIMER: This letter is based on pseudo-legal theories associated with the \"sovereign citizen\" movement. These theories are not recognized in mainstream commercial law and may have adverse legal consequences. Use at your own risk. ***

[Your Name: {user_name}]
[Your Address: {user_address}]

{today}

TO: {creditor_name}
    {creditor_address}

SUBJECT: Private Administrative Process - Tender of Payment for Instrument {bill_file_name}

Dear Sir/Madam,

This correspondence serves as a formal tender of payment, presented in good faith, for the instrument identified as \"{bill_file_name}\". This instrument, having been properly endorsed and accepted for value, is hereby presented as a valid and lawful tender for the discharge and settlement of any alleged obligation or account associated therewith.

Be advised that this tender is made in accordance with the principles of commercial law and equity. Under Uniform Commercial Code (UCC) 3-603, a tender of payment of an obligation to pay an instrument made to a person entitled to enforce the instrument, if refused, discharges the obligation of the obligor to pay interest on the obligation after the due date and discharges any party with a right of recourse against the obligor to the extent of the amount of the tender.

Your refusal to accept this lawful tender of payment will be considered a dishonor of a commercial instrument and a refusal of a valid tender. All rights, remedies, and recourse, both at law and in equity, are expressly reserved without prejudice, pursuant to UCC 1-308.

This is a private administrative process. Your acceptance of this tender, or your failure to return the instrument with specific objections within [e.g., 3, 7, 10] days, will be deemed as acceptance of this tender and agreement to the discharge of the obligation.

Sincerely,

By: {user_name}
Authorized Representative / Agent
All Rights Reserved. Without Prejudice. UCC 1-308.
"""
    return jsonify({"letterContent": tender_letter_content.strip()}), 200

@app.route('/generate-ptp-letter', methods=['POST'])
def generate_ptp_letter():
    data = request.get_json(force=True)
    user_name = data.get('userName')
    user_address = data.get('userAddress')
    creditor_name = data.get('creditorName')
    creditor_address = data.get('creditorAddress')
    account_number = data.get('accountNumber')
    promise_amount = data.get('promiseAmount')
    promise_date = data.get('promiseDate')

    if not all([user_name, user_address, creditor_name, creditor_address, account_number, promise_amount, promise_date]):
        return jsonify({"error": "Missing required data for Promise to Pay letter generation."}), 400

    today = datetime.now().strftime("%B %d, %Y")
    # Format promise_date for display
    formatted_promise_date = datetime.strptime(promise_date, '%Y-%m-%d').strftime("%B %d, %Y")

    ptp_letter_content = f"""
[Your Name: {user_name}]
[Your Address: {user_address}]

{today}

TO: {creditor_name}
    {creditor_address}

SUBJECT: Promise to Pay - Account: {account_number}

Dear {creditor_name},

This letter serves as my formal commitment to pay the outstanding amount on the account referenced above.

I, {user_name}, hereby promise to pay the amount of ${promise_amount} on or before {formatted_promise_date}.

This payment is being made to settle the account. Please update your records accordingly upon receipt of the payment. I request that you provide written confirmation of the payment being received and the account being settled.

Thank you for your understanding in this matter.

Sincerely,

{user_name}
"""
    return jsonify({"letterContent": ptp_letter_content.strip()}), 200


@app.route('/get-bill-data', methods=['POST'])
def get_bill_data():
    if 'bill' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['bill']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    if not file.filename.lower().endswith('.pdf'):
        return jsonify({"error": "Unsupported file type. Please upload a PDF."}), 400

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
        return jsonify({"error": f"Failed to extract bill data: {str(e)}"}), 500
    finally:
        # Clean up the temporary file
        if os.path.exists(filepath):
            os.remove(filepath)

@app.route('/scan-for-terms', methods=['POST'])
def scan_for_terms():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    tag = request.form.get('tag')

    if not file or not tag:
        return jsonify({"error": "Missing file or tag"}), 400

    # Define keyword mappings
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
        # Simplified text extraction
        text = ""
        with open(filepath, "rb") as f:
            reader = PdfReader(f)
            for page in reader.pages:
                text += page.extract_text() or ""
        
        if not text.strip():
            return jsonify({"error": "Could not extract text from PDF."} ), 500

        # Search for keywords in sentences
        found_sentences = []
        sentences = text.replace('\n', ' ').split('. ')

        for sentence in sentences:
            for keyword in keywords:
                if keyword in sentence.lower():
                    found_sentences.append(sentence.strip() + ".")
                    break 
        
        return jsonify({"found_clauses": found_sentences})

    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500
    finally:
        if os.path.exists(filepath):
            os.remove(filepath)


@app.route('/generate-remedy', methods=['POST'])
def generate_remedy():
    violation = request.form['violation']
    jurisdiction = request.form['jurisdiction']
    output = f"Generating remedy for violation: {violation} in jurisdiction: {jurisdiction}\n(Remedy generation logic is not yet implemented)"
    return jsonify({'output': output})

if __name__ == '__main__':
    os.makedirs('uploads', exist_ok=True)
    app.run(host='127.0.0.1', port=8000, debug=True)