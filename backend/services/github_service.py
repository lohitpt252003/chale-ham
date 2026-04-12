import httpx
import base64
import json
import os
from datetime import datetime
from dotenv import load_dotenv
from typing import List, Dict, Any, Optional

load_dotenv()

GITHUB_PAT = os.getenv("GITHUB_PAT")
GITHUB_USERNAME = os.getenv("GITHUB_USERNAME")
GITHUB_REPO_NAME = os.getenv("GITHUB_REPO_NAME")
BASE_URL = f"https://api.github.com/repos/{GITHUB_USERNAME}/{GITHUB_REPO_NAME}/contents"

headers = {
    "Authorization": f"token {GITHUB_PAT}",
    "Accept": "application/vnd.github.v3+json"
}

class GitHubService:
    @staticmethod
    async def get_file_content(path: str) -> Dict[str, Any]:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{BASE_URL}/{path}", headers=headers)
            if response.status_code == 200:
                data = response.json()
                content_b64 = data["content"]
                content_str = base64.b64decode(content_b64).decode("utf-8")
                return {
                    "content": json.loads(content_str),
                    "sha": data["sha"]
                }
            elif response.status_code == 404:
                return None
            else:
                response.raise_for_status()

    @staticmethod
    async def update_file(path: str, content: Any, message: str, sha: Optional[str] = None):
        content_json = json.dumps(content, indent=4)
        content_b64 = base64.b64encode(content_json.encode("utf-8")).decode("utf-8")
        
        payload = {
            "message": message,
            "content": content_b64
        }
        if sha:
            payload["sha"] = sha

        async with httpx.AsyncClient() as client:
            response = await client.put(f"{BASE_URL}/{path}", headers=headers, json=payload)
            response.raise_for_status()
            return response.json()

    @staticmethod
    async def delete_file(path: str, message: str, sha: str):
        payload = {
            "message": message,
            "sha": sha
        }
        async with httpx.AsyncClient() as client:
            response = await client.request("DELETE", f"{BASE_URL}/{path}", headers=headers, json=payload)
            if response.status_code not in [200, 404]:
                response.raise_for_status()

    @staticmethod
    async def create_trip(trip_name: str):
        # Create people.json
        await GitHubService.update_file(
            f"trips/{trip_name}/people.json",
            [],
            f"Initialize people.json for {trip_name}"
        )
        # Create expenses.json
        await GitHubService.update_file(
            f"trips/{trip_name}/expenses.json",
            [],
            f"Initialize expenses.json for {trip_name}"
        )

    @staticmethod
    async def get_people(trip_name: str) -> List[Dict[str, Any]]:
        result = await GitHubService.get_file_content(f"trips/{trip_name}/people.json")
        return result["content"] if result else []

    @staticmethod
    async def add_person(trip_name: str, person: Dict[str, Any]):
        result = await GitHubService.get_file_content(f"trips/{trip_name}/people.json")
        people = result["content"] if result else []
        sha = result["sha"] if result else None
        
        # Check if already exists
        if any(p["email"] == person["email"] for p in people):
            return people
            
        people.append(person)
        await GitHubService.update_file(
            f"trips/{trip_name}/people.json",
            people,
            f"Add {person['name']} to {trip_name}",
            sha
        )
        return people

    @staticmethod
    async def list_trips() -> List[str]:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{BASE_URL}/trips", headers=headers)
            if response.status_code == 200:
                contents = response.json()
                return [item["name"] for item in contents if item["type"] == "dir"]
            elif response.status_code == 404:
                return []
            else:
                response.raise_for_status()

    @staticmethod
    async def get_expenses(trip_name: str) -> List[Dict[str, Any]]:
        result = await GitHubService.get_file_content(f"trips/{trip_name}/expenses.json")
        return result["content"] if result else []

    @staticmethod
    async def add_expense(trip_name: str, expense: Dict[str, Any]):
        result = await GitHubService.get_file_content(f"trips/{trip_name}/expenses.json")
        expenses = result["content"] if result else []
        sha = result["sha"] if result else None
        
        # Add ID if not present
        if "id" not in expense:
            import uuid
            expense["id"] = str(uuid.uuid4())
            
        expenses.append(expense)
        await GitHubService.update_file(
            f"trips/{trip_name}/expenses.json",
            expenses,
            f"Add expense to {trip_name}",
            sha
        )
        return expenses

    @staticmethod
    async def remove_expense(trip_name: str, expense_id: str):
        result = await GitHubService.get_file_content(f"trips/{trip_name}/expenses.json")
        if not result:
            return None
            
        expenses = result["content"]
        sha = result["sha"]
        
        new_expenses = [e for e in expenses if e.get("id") != expense_id]
        
        if len(new_expenses) == len(expenses):
            return None # Changed to return None to properly indicate not found
            
        await GitHubService.update_file(
            f"trips/{trip_name}/expenses.json",
            new_expenses,
            f"Remove expense {expense_id} from {trip_name}",
            sha
        )
        return new_expenses

    @staticmethod
    async def get_requests(trip_name: str) -> List[Dict[str, Any]]:
        result = await GitHubService.get_file_content(f"trips/{trip_name}/requests.json")
        return result["content"] if result else []

    @staticmethod
    async def add_request(trip_name: str, user: Dict[str, Any]):
        result = await GitHubService.get_file_content(f"trips/{trip_name}/requests.json")
        requests = result["content"] if result else []
        sha = result["sha"] if result else None
        
        if any(r["email"] == user["email"] for r in requests):
            return requests
            
        requests.append({
            "name": user["name"],
            "email": user["email"],
            "requested_at": datetime.now().isoformat()
        })
        await GitHubService.update_file(
            f"trips/{trip_name}/requests.json",
            requests,
            f"New join request from {user['email']} for {trip_name}",
            sha
        )
        return requests

    @staticmethod
    async def approve_request(trip_name: str, email: str):
        # 1. Remove from requests.json
        req_result = await GitHubService.get_file_content(f"trips/{trip_name}/requests.json")
        if not req_result: return
        requests = req_result["content"]
        user = next((r for r in requests if r["email"] == email), None)
        if not user: return
        
        requests = [r for r in requests if r["email"] != email]
        await GitHubService.update_file(
            f"trips/{trip_name}/requests.json",
            requests,
            f"Approve {email} for {trip_name}",
            req_result["sha"]
        )
        
        # 2. Add to people.json
        await GitHubService.add_person(trip_name, {"name": user["name"], "email": user["email"]})

    @staticmethod
    async def reject_request(trip_name: str, email: str):
        result = await GitHubService.get_file_content(f"trips/{trip_name}/requests.json")
        if not result: return
        requests = [r for r in result["content"] if r["email"] != email]
        await GitHubService.update_file(
            f"trips/{trip_name}/requests.json",
            requests,
            f"Reject {email} for {trip_name}",
            result["sha"]
        )


