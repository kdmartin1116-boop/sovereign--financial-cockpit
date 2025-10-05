import os
import sys
import unittest

# Add the project root to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from modules.bill_parser import BillParser


class TestBillParser(unittest.TestCase):

    def test_parse_free_text_bill(self):
        # Create a BillParser instance
        parser = BillParser()

        # Read the content of the sample bill
        with open("sample_bill.txt", "r") as f:
            bill_text = f.read()

        # Parse the bill
        bill_data = parser.parse_bill(bill_text)

        # Check the extracted data
        self.assertEqual(bill_data.get("payee"), "Sovereign Bank")
        self.assertEqual(bill_data.get("total_amount"), 1200.0)
        self.assertEqual(bill_data.get("currency"), "USD")
        self.assertEqual(bill_data.get("due_date"), "September 1, 2025")


if __name__ == "__main__":
    unittest.main()
