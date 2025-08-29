import unittest
from unittest.mock import patch, MagicMock, call

class EndorseCouponTestCase(unittest.TestCase):

    def setUp(self):
        # No need to create dummy files as we will mock PDF operations
        pass

    def tearDown(self):
        # No need to clean up files as we are mocking
        pass

    @patch('pypdf.PdfReader')
    @patch('pypdf.PdfWriter')
    @patch('reportlab.pdfgen.canvas.Canvas')
    @patch('builtins.open', new_callable=MagicMock)
    def test_endorsement_creation_mocked(self, mock_open, mock_canvas, mock_pdf_writer, mock_pdf_reader):
        # Mock PdfReader behavior
        mock_reader_instance = MagicMock()
        mock_pdf_reader.return_value = mock_reader_instance
        mock_reader_instance.pages = [MagicMock()]

        # Mock PdfWriter behavior
        mock_writer_instance = MagicMock()
        mock_pdf_writer.return_value = mock_writer_instance

        # Mock Canvas behavior
        mock_canvas_instance = MagicMock()
        mock_canvas.return_value = mock_canvas_instance

        endorsement_text = "TEST ENDORSEMENT"
        qualifier_text = "TEST QUALIFIER"
        x_coord = 100
        y_coord = 200
        bill_path = "dummy_bill.pdf"

        # Simulate running the script
        # We need to directly call the logic of endorse coupon, as subprocess.run would run the actual script
        # and not use our mocks.
        # Instead, we'll simulate the argparse behavior and then call the main logic.

        # Mock argparse.ArgumentParser().parse_args()
        with patch('argparse.ArgumentParser') as mock_arg_parser:
            mock_args = MagicMock()
            mock_args.bill = bill_path
            mock_args.endorsement = endorsement_text
            mock_args.qualifier = qualifier_text
            mock_args.x = x_coord
            mock_args.y = y_coord
            mock_arg_parser.return_value.parse_args.return_value = mock_args

            # Import the script to execute its main logic
            # This is a bit tricky as we need to re-import it to pick up the mocks
            # A cleaner way would be to refactor endorse_coupon.py into a function
            # For now, we'll use a trick to re-import it.
            import sys
            if 'endorsecoupon' in sys.modules:
                del sys.modules['endorsecoupon']
            import endorsecoupon  # noqa: F401

        # Assertions for Canvas operations
        mock_canvas.assert_called_once_with(unittest.mock.ANY, pagesize=unittest.mock.ANY)
        mock_canvas_instance.setFont.assert_called_once_with("Helvetica-Bold", 12)
        # Check both calls to setFillColorRGB
        mock_canvas_instance.setFillColorRGB.assert_has_calls([
            call(1, 1, 1),  # white box
            call(0, 0, 0)   # black text
        ])
        mock_canvas_instance.rect.assert_called_once_with(x_coord - 5, y_coord - 5, 300, 20, fill=1, stroke=0)
        mock_canvas_instance.drawString.assert_called_once_with(x_coord, y_coord, f"{endorsement_text} ({qualifier_text})")
        mock_canvas_instance.save.assert_called_once()

        # Assertions for PDF operations
        # PdfReader is called twice: once with the bill path, once with the BytesIO object
        mock_pdf_reader.assert_has_calls([
            call(bill_path),
            call(unittest.mock.ANY) # The BytesIO object from packet
        ])
        mock_reader_instance.pages[0].merge_page.assert_called_once_with(unittest.mock.ANY)
        mock_pdf_writer.assert_called_once()
        mock_writer_instance.add_page.assert_called_once_with(unittest.mock.ANY)

        # Assertions for file saving
        expected_output_path = bill_path.replace(".pdf", "_endorsed.pdf")
        # Use assert_called_with to check the last call to open
        mock_open.assert_called_with(expected_output_path, "wb")
        mock_writer_instance.write.assert_called_once_with(mock_open().__enter__()) # Expect the file object from __enter__

if __name__ == '__main__':
    unittest.main()