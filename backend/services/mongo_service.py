import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from typing import List, Dict, Any, Optional
from datetime import datetime

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "ka25eq0346@gmail.com")
client = AsyncIOMotorClient(MONGO_URI)

# Try to get database from URI, else use 'chale-ham'
try:
    db = client.get_default_database()
except Exception:
    db = client.get_database("chale-ham")

class MongoService:
    @staticmethod
    async def get_user(email: str) -> Optional[Dict[str, Any]]:
        return await db.users.find_one({"email": email}, {"_id": 0})

    @staticmethod
    async def upsert_user(user_data: Dict[str, Any]):
        email = user_data["email"]
        existing = await MongoService.get_user(email)
        
        if existing:
            # Preserve existing flags
            user_data["is_active"] = existing.get("is_active", True)
            user_data["is_admin"] = existing.get("is_admin", email == ADMIN_EMAIL)
        else:
            # Set defaults for new user
            user_data["is_active"] = True
            user_data["is_admin"] = (email == ADMIN_EMAIL)
            
        user_data["last_login"] = datetime.now().isoformat()
        
        await db.users.update_one(
            {"email": email},
            {"$set": user_data},
            upsert=True
        )
        return await MongoService.get_user(email)

    @staticmethod
    async def list_users() -> List[Dict[str, Any]]:
        cursor = db.users.find({}, {"_id": 0})
        return await cursor.to_list(length=100)

    @staticmethod
    async def set_user_status(email: str, is_active: bool):
        await db.users.update_one(
            {"email": email},
            {"$set": {"is_active": is_active}}
        )
        return await MongoService.get_user(email)

    # --- TRIP HYBRID CACHE METHODS ---
    
    @staticmethod
    async def get_trip(trip_name: str) -> Optional[Dict[str, Any]]:
        return await db.trips.find_one({"trip_name": trip_name}, {"_id": 0})
        
    @staticmethod
    async def get_all_trips_meta() -> List[Dict[str, Any]]:
        cursor = db.trips.find({}, {"_id": 0, "trip_name": 1, "is_active": 1})
        return await cursor.to_list(length=1000)

    @staticmethod
    async def set_trip_active(trip_name: str, payload: Dict[str, Any]):
        """Caches a huge JSON bundle of all 5 github files into Mongo."""
        await db.trips.update_one(
            {"trip_name": trip_name},
            {"$set": {
                "trip_name": trip_name,
                "is_active": True,
                "people": payload.get("people", []),
                "expenses": payload.get("expenses", []),
                "balances": payload.get("balances", []),
                "requests": payload.get("requests", []),
                "settlements": payload.get("settlements", []),
            }},
            upsert=True
        )

    @staticmethod
    async def set_trip_inactive(trip_name: str):
        """Archives internal DB data arrays to save space."""
        await db.trips.update_one(
            {"trip_name": trip_name},
            {"$set": {"is_active": False},
             "$unset": {"people": "", "expenses": "", "balances": "", "requests": "", "settlements": ""}},
            upsert=True
        )

    @staticmethod
    async def get_trip_bundle(trip_name: str, document_type: str) -> List[Any]:
        """Gets a specific array out of the active Mongo cache."""
        trip = await db.trips.find_one({"trip_name": trip_name}, {"_id": 0, document_type: 1})
        if trip and document_type in trip:
            return trip[document_type]
        return []

    @staticmethod
    async def update_trip_bundle(trip_name: str, document_type: str, content: List[Any]):
        """Mirrors GitHubService update_file structure."""
        await db.trips.update_one(
            {"trip_name": trip_name},
            {"$set": {document_type: content}},
            upsert=True
        )

