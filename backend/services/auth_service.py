from google.oauth2 import id_token
from google.auth.transport import requests
import os
from .mongo_service import MongoService

ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "ka25eq0346@gmail.com")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

class AuthService:
    @staticmethod
    async def verify_token(token: str):
        try:
            # Specify the CLIENT_ID of the app that accesses the backend:
            idinfo = id_token.verify_oauth2_token(token, requests.Request(), GOOGLE_CLIENT_ID)

            # ID token is valid. Get the user's Google Account ID from the decoded token.
            email = idinfo['email']
            name = idinfo.get('name', '')
            picture = idinfo.get('picture', '')

            # Register/Update user in MongoDB
            user_data = {
                "email": email,
                "name": name,
                "picture": picture
            }
            user = await MongoService.upsert_user(user_data)

            if not user["is_active"]:
                return {"error": "User account is inactive"}

            return {
                "email": email,
                "name": name,
                "picture": picture,
                "is_admin": user["is_admin"],
                "is_active": user["is_active"]
            }
        except ValueError:
            # Invalid token
            return None
