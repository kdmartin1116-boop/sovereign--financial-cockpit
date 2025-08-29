import re

class BillParser:
    def __init__(self):
        # Define regex patterns for common bill data fields
        self.patterns = {
            "bill_number": r"(?:Account Number|Account No|Invoice Number|Bill No|Reference No)[:\s]*([\w-]+)",
            "total_amount": r"(?:Total Amount|Amount Due|Balance Due)[:\s]*[\$€£¥]?\s*([\d.,]+)",
            "currency": r"(?:Total Amount|Amount Due|Balance Due)[:\s]*([\$€£¥])", # Capture the currency symbol
            "customer_name": r"(?:Customer Name|Client Name|Name|To)[:\s]*([A-Z][a-z]+(?:\s[A-Z][a-z]+){1,3})", # Placeholder, as it's not in the sample PDF
            "remittance_coupon_keywords": r"(?:Remittance Coupon|Payment Stub|Please Detach|Return with Payment|please return bottom portion with your payment)"
        }

    # The find_remittance_coupon method uses a basic heuristic.
    # For more robust remittance coupon extraction, consider using a library for PDF layout analysis
    # or more advanced text processing techniques.
    def find_remittance_coupon(self, bill_text: str) -> str:
        coupon_text = ""
        lines = bill_text.split('\n')
        found_coupon = False
        coupon_start_line = -1

        for i, line in enumerate(lines):
            if re.search(self.patterns["remittance_coupon_keywords"], line, re.IGNORECASE):
                found_coupon = True
                coupon_start_line = i
                break
        
        if found_coupon:
            # Heuristic: Capture a few lines after the keyword as the coupon
            # This can be improved with more advanced layout analysis
            for i in range(coupon_start_line, min(coupon_start_line + 10, len(lines))):
                coupon_text += lines[i] + "\n"
        
        return coupon_text.strip()

    def parse_bill(self, bill_text: str) -> dict:
        bill_data = {}
        
        # Extract bill number
        match = re.search(self.patterns["bill_number"], bill_text, re.IGNORECASE)
        if match:
            bill_data["bill_number"] = match.group(1).strip()
        
        # Extract total amount and currency
        # This regex tries to capture the currency symbol and the amount more robustly
        amount_currency_match = re.search(
            r"(?:Total Amount|Amount Due|Balance Due)[:\s]*([$€£¥]?)\s*([\d.,]+)",
            bill_text,
            re.IGNORECASE
        )
        if amount_currency_match:
            currency_symbol = amount_currency_match.group(1)
            amount_str = amount_currency_match.group(2)

            # Clean and parse amount string based on common European vs US formats
            if ',' in amount_str and '.' in amount_str:
                if amount_str.find(',') < amount_str.find('.'): # e.g., 1,234.56 (US format)
                    amount_str = amount_str.replace(',', '')
                else: # e.g., 1.234,56 (European format)
                    amount_str = amount_str.replace('.', '').replace(',', '.')
            elif ',' in amount_str: # e.g., 1,234 (US) or 1,23 (European decimal)
                # Ambiguous, assume US for now or require more context
                pass # Keep as is, will be parsed as float
            
            try:
                bill_data["total_amount"] = float(amount_str)
            except ValueError:
                bill_data["total_amount"] = "N/A" # Could not parse to float
            
            # Map currency symbol to ISO code
            if currency_symbol == "$":
                bill_data["currency"] = "USD"
            elif currency_symbol == "€":
                bill_data["currency"] = "EUR"
            elif currency_symbol == "£":
                bill_data["currency"] = "GBP"
            elif currency_symbol == "¥":
                bill_data["currency"] = "JPY"
            else:
                bill_data["currency"] = "N/A" # Default if no recognized symbol
        else:
            bill_data["total_amount"] = "N/A"
            bill_data["currency"] = "N/A"

        # Extract customer name (using placeholder for now)
        match = re.search(self.patterns["customer_name"], bill_text, re.IGNORECASE)
        if match:
            bill_data["customer_name"] = match.group(1).strip()
        else:
            bill_data["customer_name"] = "Valued Customer" # Default if not found

        # Find and parse remittance coupon (for demonstration)
        remittance_coupon_text = self.find_remittance_coupon(bill_text)
        if remittance_coupon_text:
            print(f"\n--- Remittance Coupon Found ---\n{remittance_coupon_text}\n---")
            # You can add more specific regex patterns here to extract data from the coupon
            # For example, if the coupon has its own amount due or account number

        return bill_data