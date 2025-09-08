import yaml
from datetime import datetime
from pypdf import PdfReader
import pytesseract
from modules.bill_parser import BillParser

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
            try:
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
