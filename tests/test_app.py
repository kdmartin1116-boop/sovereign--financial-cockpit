import unittest
from app import app

class AppTestCase(unittest.TestCase):
    def test_app_creation(self):
        self.assertIsNotNone(app)

if __name__ == '__main__':
    unittest.main()
