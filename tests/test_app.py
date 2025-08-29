import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import unittest
from unittest.mock import patch, MagicMock
from app import app
import os
from io import BytesIO # Import BytesIO

class AppTestCase(unittest.TestCase):

    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True
        # Ensure uploads directory exists for tests
        os.makedirs('uploads', exist_ok=True)

    def tearDown(self):
        # Clean up any files saved during tests
        for f in os.listdir('uploads'):
            file_path = os.path.join('uploads', f)
            if os.path.isfile(file_path): # Ensure it's a file before attempting to remove
                os.remove(file_path)
        # Do not remove the 'uploads' directory itself, as it's part of the project structure

    def test_index_route(self):
        response = self.app.get('/')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'<!DOCTYPE html>', response.data) # Check for basic HTML structure

    @patch('subprocess.run')
    @patch('werkzeug.datastructures.FileStorage.save')
    def test_scan_contract(self, mock_save, mock_subprocess_run):
        # Mock subprocess.run result
        mock_subprocess_run.return_value = MagicMock(stdout='Scan result', stderr='', returncode=0)

        # Create a dummy file for testing upload
        tag = 'test_tag' # Define tag
        data = {
            'contract': (BytesIO(b"dummy contract content"), 'test_contract.txt'),
            'tag': tag
        }
        response = self.app.post('/scan-contract', data=data, content_type='multipart/form-data')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json, {'output': 'Scan result'})
        
        # Verify file was saved
        mock_save.assert_called_once_with(os.path.join('uploads', 'test_contract.txt'))
        
        # Verify subprocess.run was called with correct arguments
        mock_subprocess_run.assert_called_once_with(
            ['bash', 'clausescanner.sh', f'--contract={os.path.join('uploads', 'test_contract.txt')}', f'--tags={tag}'],
            capture_output=True, text=True
        )

    # @patch('subprocess.run')
    # @patch('werkzeug.datastructures.FileStorage.save')
    # def test_endorse_bill(self, mock_save, mock_subprocess_run):
    #     # Mock subprocess.run result
    #     mock_subprocess_run.return_value = MagicMock(stdout='Endorsement result', stderr='', returncode=0)

    #     # Define variables from data
    #     text = 'test_endorsement'
    #     qualifier = 'test_qualifier'
    #     x = '100'
    #     y = '200'

    #     # Create a dummy file for testing upload
    #     data = {
    #         'bill': (BytesIO(b"dummy bill content"), 'test_bill.txt'),
    #         'text': text,
    #         'qualifier': qualifier,
    #         'x': x,
    #         'y': y
    #     }
    #     response = self.app.post('/endorse-bill', data=data, content_type='multipart/form-data')

    #     self.assertEqual(response.status_code, 200)
    #     self.assertEqual(response.json, {'output': 'Endorsement result'})

    #     # Verify file was saved
    #     mock_save.assert_called_once_with(os.path.join('uploads', 'test_bill.txt'))

    #     # Verify subprocess.run was called with correct arguments
    #     mock_subprocess_run.assert_called_once_with(
    #         ['python', 'endorsecoupon.py',
    #          f'--bill={os.path.join('uploads', 'test_bill.txt')}',
    #          f'--endorsement={text}',
    #          f'--qualifier={qualifier}',
    #          f'--x={x}',
    #          f'--y={y}'],
    #         capture_output=True, text=True
    #     )

    @patch('subprocess.run')
    def test_generate_remedy(self, mock_subprocess_run):
        # Mock subprocess.run result
        mock_subprocess_run.return_value = MagicMock(stdout='Remedy result', stderr='', returncode=0)

        # Define variables from data
        violation = 'test_violation'
        jurisdiction = 'test_jurisdiction'

        data = {
            'violation': violation,
            'jurisdiction': jurisdiction
        }
        response = self.app.post('/generate-remedy', data=data)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json, {'output': 'Remedy result'})

        # Verify subprocess.run was called with correct arguments
        mock_subprocess_run.assert_called_once_with(
            ['bash', 'remedygenerator.sh', f'--violation={violation}', f'--jurisdiction={jurisdiction}'],
            capture_output=True, text=True
        )

if __name__ == '__main__':
    unittest.main()
