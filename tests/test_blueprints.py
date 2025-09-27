import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import unittest
from unittest.mock import patch
from app import app

class BlueprintsTestCase(unittest.TestCase):

    def setUp(self):
        app.config['LOGIN_DISABLED'] = True
        app.config['TESTING'] = True
        self.app = app.test_client()

    @patch('modules.routes.profile.get_profile')
    def test_get_profile_success(self, mock_get_profile):
        # Mock the database function to return a sample profile
        mock_get_profile.return_value = {
            "name": "Test User",
            "address": "123 Test St",
            "email": "test@example.com",
            "phone": "123-456-7890"
        }
        
        response = self.app.get('/api/profile')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json['name'], 'Test User')

    @patch('modules.routes.profile.get_profile')
    def test_get_profile_not_found(self, mock_get_profile):
        # Mock the database function to return None
        mock_get_profile.return_value = None
        
        response = self.app.get('/api/profile')
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json['error'], 'Profile not found')

    @patch('modules.routes.profile.save_profile')
    def test_save_profile(self, mock_save_profile):
        # The save_profile function doesn't return anything, so no need to set a return_value
        
        profile_data = {
            "name": "New User",
            "address": "456 New Ave",
            "email": "new@example.com",
            "phone": "987-654-3210"
        }
        
        response = self.app.post('/api/profile', json=profile_data)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json['message'], 'Profile saved successfully')
        
        # Verify that the database function was called with the correct data
        database_path = app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', '')
        mock_save_profile.assert_called_once_with(
            database_path,
            "New User",
            "456 New Ave",
            "new@example.com",
            "987-654-3210"
        )

if __name__ == '__main__':
    unittest.main()