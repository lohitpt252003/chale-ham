import os
import pymongo
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

mongo_uri = os.getenv("MONGO_URI")

def test_mongo_connection():
    if not mongo_uri:
        print("Error: MONGO_URI not found in .env file.")
        return

    try:
        # Create a MongoClient
        client = pymongo.MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
        
        # The ismaster command is cheap and does not require auth.
        client.admin.command('ismaster')
        
        print("Successfully connected to MongoDB Atlas!")
        
        # Check database list
        db_list = client.list_database_names()
        print(f"Databases found: {db_list}")
        
    except pymongo.errors.ServerSelectionTimeoutError as err:
        print(f"Error: Could not connect to MongoDB server. Check your MONGO_URI and IP Whitelist. Details: {err}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

if __name__ == "__main__":
    test_mongo_connection()
