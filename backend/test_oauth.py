import os
from dotenv import load_dotenv
from services.auth_service import AuthService
import unittest
from unittest.mock import patch, MagicMock

load_dotenv()

class TestOAuth(unittest.TestCase):
    def test_auth_service_mock(self):
        # Mock the google id_token.verify_oauth2_token call
        with patch('services.auth_service.id_token.verify_oauth2_token') as mock_verify:
            # Set up mock response
            mock_verify.return_value = {
                'email': 'ka25eq0346@gmail.com',
                'name': 'Admin User'
            }
            
            # Test verification
            result = AuthService.verify_token("fake_token")
            self.assertIsNotNone(result)
            self.assertEqual(result['email'], 'ka25eq0346@gmail.com')
            self.assertTrue(result['is_admin'])
            print("Mock OAuth test passed: AuthService correctly identifies admin user.")

    def test_real_oauth_config(self):
        client_id = os.getenv("GOOGLE_CLIENT_ID")
        if not client_id or client_id == "your_google_client_id_here":
            print("SKIP: GOOGLE_CLIENT_ID is not set in .env")
            return
        
        print(f"GOOGLE_CLIENT_ID is set to: {client_id}")
        # We can't easily test a REAL token without a browser, but we can verify the service exists
        # and doesn't crash on an invalid token.
        try:
            result = AuthService.verify_token("invalid_token")
            self.assertIsNone(result)
            print("OAuth config check: AuthService correctly returns None for invalid token.")
        except Exception as e:
            self.fail(f"AuthService crashed during verification: {e}")

if __name__ == "__main__":
    unittest.main()
