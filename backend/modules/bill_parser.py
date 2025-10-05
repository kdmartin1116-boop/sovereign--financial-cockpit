import re


class BillParser:
    def __init__(self):
        # Define regex patterns for common bill data fields
        # Break long regexes into smaller pieces to keep line lengths reasonable
        bill_number_alts = r"Account Number|Account No|Invoice Number|Bill No|Reference No"
        total_amount_alts = r"Total Amount|Amount Due|Balance Due"
        customer_name_alts = r"Customer Name|Client Name|Name|To"
        remittance_alts = (
            r"Remittance Coupon|Payment Stub|Please Detach|Return with Payment"
            r"|please return bottom portion with your payment"
        )

        self.patterns = {
            "bill_number": rf"(?:{bill_number_alts})[:\s]*([\w-]+)",
            "total_amount": rf"(?:{total_amount_alts})[:\s]*[\$€£¥]?\s*([\d.,]+)",
            "currency": rf"(?:{total_amount_alts})[:\s]*([\$€£¥])",
            "customer_name": (
                rf"(?:{customer_name_alts})[:\s]*" rf"([A-Z][a-z]+(?:\s[A-Z][a-z]+){{1,3}})"
            ),
            "remittance_coupon_keywords": rf"(?:{remittance_alts})",
        }
        self.free_text_patterns = {
            "payee": r"Pay to the order of (.*?)(?: the sum| on or before)",
            "amount": r"the sum of (?:[$€£¥])?\s*([\d,.]+)",
            "currency": r"the sum of ([\$€£¥])",
            "due_date": r"on or before (.*)",
        }

    def parse_free_text_bill(self, bill_text: str) -> dict:
        bill_data = {}

        payee_match = re.search(self.free_text_patterns["payee"], bill_text, re.IGNORECASE)
        if payee_match:
            bill_data["payee"] = payee_match.group(1).strip()

        amount_match = re.search(self.free_text_patterns["amount"], bill_text, re.IGNORECASE)
        if amount_match:
            bill_data["total_amount"] = float(amount_match.group(1).replace(",", ""))

        currency_match = re.search(self.free_text_patterns["currency"], bill_text, re.IGNORECASE)
        if currency_match:
            currency_symbol = currency_match.group(1)
            if currency_symbol == "$":
                bill_data["currency"] = "USD"
            elif currency_symbol == "€":
                bill_data["currency"] = "EUR"
            elif currency_symbol == "£":
                bill_data["currency"] = "GBP"
            elif currency_symbol == "¥":
                bill_data["currency"] = "JPY"

        due_date_match = re.search(self.free_text_patterns["due_date"], bill_text, re.IGNORECASE)
        if due_date_match:
            bill_data["due_date"] = due_date_match.group(1).strip().replace(".", "")

        return bill_data

    # The find_remittance_coupon method uses a basic heuristic.
    # For more robust remittance coupon extraction, consider using a library for PDF layout analysis
    # or more advanced text processing techniques.
    def find_remittance_coupon(self, bill_text: str) -> str:
        coupon_text = ""
        lines = bill_text.split("\n")
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
        structured_data = self.parse_structured_bill(bill_text)
        if structured_data.get("bill_number"):
            return structured_data

        free_text_data = self.parse_free_text_bill(bill_text)
        if free_text_data:
            return free_text_data

        return {}

    def parse_structured_bill(self, bill_text: str) -> dict:
        bill_data = {}

        # Helper: extract a match group or return None
        def _first_group(pattern: str) -> str | None:
            m = re.search(pattern, bill_text, re.IGNORECASE)
            return m.group(1).strip() if m else None

        # Extract bill number
        bill_number = _first_group(self.patterns["bill_number"])
        if bill_number:
            bill_data["bill_number"] = bill_number

        # Extract total amount and currency using smaller regex pieces
        # Build amount pattern directly here (keeps method self-contained)
        amount_pattern = r"(?:Total Amount|Amount Due|Balance Due)[:\s]*([\$€£¥]?)\s*([\d.,]+)"
        amount_match = re.search(amount_pattern, bill_text, re.IGNORECASE)
        if amount_match:
            currency_symbol = amount_match.group(1)
            amount_str = amount_match.group(2)

            # Normalize number formatting
            if "," in amount_str and "." in amount_str:
                if amount_str.find(",") < amount_str.find("."):
                    amount_str = amount_str.replace(",", "")
                else:
                    amount_str = amount_str.replace(".", "").replace(",", ".")

            try:
                bill_data["total_amount"] = float(amount_str)
            except ValueError:
                bill_data["total_amount"] = "N/A"

            bill_data["currency"] = {
                "$": "USD",
                "€": "EUR",
                "£": "GBP",
                "¥": "JPY",
            }.get(currency_symbol, "N/A")
        else:
            bill_data["total_amount"] = "N/A"
            bill_data["currency"] = "N/A"

        # Extract customer name
        customer = _first_group(self.patterns["customer_name"])
        bill_data["customer_name"] = customer if customer else "Valued Customer"

        # Find and parse remittance coupon (for demonstration)
        remittance_coupon_text = self.find_remittance_coupon(bill_text)
        if remittance_coupon_text:
            print(f"\n--- Remittance Coupon Found ---\n{remittance_coupon_text}\n---")
            # You can add more specific regex patterns here to extract data from the coupon
            # For example, if the coupon has its own amount due or account number

        return bill_data
