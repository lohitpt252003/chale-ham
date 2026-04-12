import os
import asyncio
from dotenv import load_dotenv
from services.auth_service import AuthService
import unittest
from unittest.mock import patch

load_dotenv()

class TestOAuth(unittest.IsolatedAsyncioTestCase):
    async def test_auth_service_mock(self):
        with patch('services.auth_service.id_token.verify_oauth2_token') as mock_verify:
            mock_verify.return_value = {
                'email': 'ka25eq0346@gmail.com',
                'name': 'Admin User',
                'picture': ''
            }

            async def fake_find_one(*a, **kw):
                return {
                    "email": "ka25eq0346@gmail.com",
                    "name": "Admin User",
                    "picture": "",
                    "is_active": True,
                    "is_admin": True
                }

            async def fake_update_one(*a, **kw):
                return None

            with patch('services.mongo_service.db') as mock_db:
                mock_db.users.find_one = fake_find_one
                mock_db.users.update_one = fake_update_one

                result = await AuthService.verify_token("fake_token")
                self.assertIsNotNone(result)
                self.assertEqual(result['email'], 'ka25eq0346@gmail.com')
                self.assertTrue(result['is_admin'])
                print("\nMock OAuth test passed: AuthService correctly identifies admin user.")

    async def test_real_oauth_config(self):
        client_id = os.getenv("GOOGLE_CLIENT_ID")
        if not client_id or client_id == "your_google_client_id_here":
            print("SKIP: GOOGLE_CLIENT_ID is not set in .env")
            return

        print(f"\nGOOGLE_CLIENT_ID is set to: {client_id}")
        try:
            result = await AuthService.verify_token("invalid_token")
            self.assertIsNone(result)
            print("OAuth config check: AuthService correctly returns None for invalid token.")
        except Exception as e:
            self.fail(f"AuthService crashed during verification: {e}")

if __name__ == "__main__":
    unittest.main()
