from unittest.mock import patch, MagicMock, mock_open
from io import BytesIO

def test_scan_contract(client):
    with patch('os.makedirs'), patch('werkzeug.datastructures.FileStorage.save'):
        data = {
            'contract': (BytesIO(b'my file contents'), 'test.pdf'),
            'tag': 'hidden_fee'
        }
        response = client.post('/scan-contract', data=data, content_type='multipart/form-data')
        assert response.status_code == 200
        json_data = response.get_json()
        assert 'output' in json_data
        assert 'Scanning contract' in json_data['output']

def test_endorse_bill(client):
    with patch('routes.document_routes.PRIVATE_KEY_PEM', 'dummy_key'), \
         patch('routes.document_routes.get_bill_data_from_source') as mock_get_bill, \
         patch('routes.document_routes.load_yaml_config') as mock_load_config, \
         patch('routes.document_routes.sign_endorsement') as mock_sign, \
         patch('routes.document_routes.log_remedy'), \
         patch('routes.document_routes.attach_endorsement_to_pdf_function'), \
         patch('os.path.exists') as mock_exists, \
         patch('werkzeug.datastructures.FileStorage.save'):
        
        mock_get_bill.return_value = {'bill_number': '123', 'customer_name': 'Test Customer'}
        mock_load_config.return_value = {'sovereign_endorsements': [{'trigger': 'Test', 'meaning': 'Test Meaning'}]}
        mock_sign.return_value = {'signature': 'signed', 'endorser_id': 'test-id', 'endorsement_date': '2025-09-05'}
        mock_exists.return_value = True

        data = {
            'bill': (BytesIO(b'my bill contents'), 'test_bill.pdf'),
        }
        response = client.post('/endorse-bill', data=data, content_type='multipart/form-data')
        
        assert response.status_code == 200
        json_data = response.get_json()
        assert json_data['message'] == 'Bill endorsed successfully'
        assert len(json_data['endorsed_files']) == 1

def test_stamp_endorsement(client):
    with patch('routes.document_routes.stamp_pdf_with_endorsement') as mock_stamp, \
         patch('werkzeug.datastructures.FileStorage.save'), \
         patch('os.makedirs'):
        
        mock_stamp.return_value = True
        
        data = {
            'bill': (BytesIO(b'my bill contents'), 'test_bill.pdf'),
            'x': '100',
            'y': '200',
            'endorsement_text': 'Test Endorsement',
            'qualifier': 'Test Qualifier'
        }
        
        with patch('routes.document_routes.send_file') as mock_send_file:
            mock_send_file.return_value = "file sent"
            response = client.post('/stamp_endorsement', data=data, content_type='multipart/form-data')
            
            assert response.status_code == 200
            assert response.data == b'file sent'

def test_get_bill_data(client):
    with patch('routes.document_routes.get_bill_data_from_source') as mock_get_bill, \
         patch('werkzeug.datastructures.FileStorage.save'), \
         patch('os.makedirs'), \
         patch('os.remove'):
        
        mock_get_bill.return_value = {'bill_number': '123', 'customer_name': 'Test Customer'}
        
        data = {
            'bill': (BytesIO(b'my bill contents'), 'test_bill.pdf'),
        }
        
        response = client.post('/get-bill-data', data=data, content_type='multipart/form-data')
        
        assert response.status_code == 200
        json_data = response.get_json()
        assert json_data['bill_number'] == '123'
        assert json_data['customer_name'] == 'Test Customer'

def test_scan_for_terms(client):
    with patch('werkzeug.datastructures.FileStorage.save'), \
         patch('os.makedirs'), \
         patch('os.remove'), \
         patch('builtins.open', mock_open(read_data=b'dummy pdf content')), \
         patch('routes.document_routes.PdfReader') as mock_pdf_reader: # Patch the PdfReader class in the module

        mock_instance = MagicMock()
        mock_page = MagicMock()
        mock_page.extract_text.return_value = "This is a sentence with a convenience fee."
        mock_instance.pages = [mock_page]
        mock_pdf_reader.return_value = mock_instance # Set the return value of the PdfReader constructor

        data = {
            'file': (BytesIO(b'my file contents'), 'test.pdf'),
            'tag': 'hidden_fee'
        }
        
        response = client.post('/scan-for-terms', data=data, content_type='multipart/form-data')
        
        assert response.status_code == 200
        json_data = response.get_json()
        assert 'found_clauses' in json_data
        assert len(json_data['found_clauses']) == 1
        assert "convenience fee" in json_data['found_clauses'][0]
