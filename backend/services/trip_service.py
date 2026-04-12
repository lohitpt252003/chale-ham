import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
from services.github_service import GitHubService
from services.mongo_service import MongoService

class TripService:
    @staticmethod
    async def get_trip_meta(trip_name: str) -> dict:
        trip = await MongoService.get_trip(trip_name)
        return {"name": trip_name, "is_active": trip.get("is_active", False)} if trip else {"name": trip_name, "is_active": False}

    @staticmethod
    async def is_active(trip_name: str) -> bool:
        meta = await TripService.get_trip_meta(trip_name)
        return meta["is_active"]

    @staticmethod
    async def toggle_status(trip_name: str, active: bool):
        current_status = await TripService.is_active(trip_name)
        if active and not current_status:
            people = await GitHubService.get_people(trip_name)
            expenses = await GitHubService.get_expenses(trip_name)
            balance_res = await GitHubService.get_file_content(f"trips/{trip_name}/balances.json")
            balances = balance_res["content"] if balance_res else []
            requests = await GitHubService.get_requests(trip_name)
            settlements_res = await GitHubService.get_file_content(f"trips/{trip_name}/settlements.json")
            settlements = settlements_res["content"] if settlements_res else []

            payload = {
                "people": people,
                "expenses": expenses,
                "balances": balances,
                "requests": requests,
                "settlements": settlements,
            }
            await MongoService.set_trip_active(trip_name, payload)

            for doc in ["people", "expenses", "balances", "requests", "settlements"]:
                res = await GitHubService.get_file_content(f"trips/{trip_name}/{doc}.json")
                if res and res.get("sha"):
                    await GitHubService.delete_file(
                        f"trips/{trip_name}/{doc}.json",
                        f"Migrate {doc} to Mongo for {trip_name}",
                        res["sha"]
                    )

        elif not active and current_status:
            trip = await MongoService.get_trip(trip_name)

            async def push_to_gh(doc: str, content: list):
                res = await GitHubService.get_file_content(f"trips/{trip_name}/{doc}.json")
                sha = res["sha"] if res else None
                await GitHubService.update_file(f"trips/{trip_name}/{doc}.json", content, f"Archive {doc} from cache", sha)

            await push_to_gh("people", trip.get("people", []))
            await push_to_gh("expenses", trip.get("expenses", []))
            await push_to_gh("balances", trip.get("balances", []))
            await push_to_gh("requests", trip.get("requests", []))
            await push_to_gh("settlements", trip.get("settlements", []))

            await MongoService.set_trip_inactive(trip_name)

        return await TripService.get_trip_meta(trip_name)

    @staticmethod
    async def _get_bundle(trip_name: str, doc: str) -> List[Any]:
        if await TripService.is_active(trip_name):
            return await MongoService.get_trip_bundle(trip_name, doc)
        else:
            res = await GitHubService.get_file_content(f"trips/{trip_name}/{doc}.json")
            return res["content"] if res else []

    @staticmethod
    async def _save_bundle(trip_name: str, doc: str, content: List[Any], message: str):
        if await TripService.is_active(trip_name):
            await MongoService.update_trip_bundle(trip_name, doc, content)
        else:
            res = await GitHubService.get_file_content(f"trips/{trip_name}/{doc}.json")
            sha = res["sha"] if res else None
            await GitHubService.update_file(f"trips/{trip_name}/{doc}.json", content, message, sha)

    @staticmethod
    async def list_trips() -> List[str]:
        gh_trips = await GitHubService.list_trips()
        mongo_trips = await MongoService.get_all_trips_meta()
        all_trips = set(gh_trips + [t["trip_name"] for t in mongo_trips])
        return sorted(list(all_trips))

    @staticmethod
    async def get_all_trips_status() -> List[Dict[str, Any]]:
        trips = await TripService.list_trips()
        mongo_meta_list = await MongoService.get_all_trips_meta()
        mongo_lookup = {t["trip_name"]: t["is_active"] for t in mongo_meta_list}
        return [{"name": t, "is_active": mongo_lookup.get(t, False)} for t in trips]

    @staticmethod
    async def create_trip(trip_name: str):
        payload = {"people": [], "expenses": [], "balances": [], "requests": [], "settlements": []}
        await MongoService.set_trip_active(trip_name, payload)

    @staticmethod
    async def get_people(trip_name: str) -> List[Dict[str, Any]]:
        return await TripService._get_bundle(trip_name, "people")

    @staticmethod
    async def add_person(trip_name: str, person: Dict[str, Any]):
        people = await TripService.get_people(trip_name)
        if any(p["email"] == person["email"] for p in people):
            return people
        people.append(person)
        await TripService._save_bundle(trip_name, "people", people, f"Add {person['name']} to {trip_name}")
        return people

    @staticmethod
    async def add_people_bulk(trip_name: str, new_people: List[Dict[str, Any]]):
        people = await TripService.get_people(trip_name)
        existing_emails = {p["email"] for p in people}
        added = []
        for person in new_people:
            if person["email"] not in existing_emails:
                people.append(person)
                existing_emails.add(person["email"])
                added.append(person)
        if added:
            await TripService._save_bundle(trip_name, "people", people, f"Bulk add {len(added)} people to {trip_name}")
        return people

    @staticmethod
    async def get_expenses(trip_name: str) -> List[Dict[str, Any]]:
        return await TripService._get_bundle(trip_name, "expenses")

    @staticmethod
    async def add_expense(trip_name: str, expense: Dict[str, Any]):
        expenses = await TripService.get_expenses(trip_name)
        if "id" not in expense or not expense["id"]:
            expense["id"] = str(uuid.uuid4())
        expenses.append(expense)
        await TripService._save_bundle(trip_name, "expenses", expenses, f"Add expense to {trip_name}")
        return expenses

    @staticmethod
    async def update_expense(trip_name: str, expense_id: str, updates: Dict[str, Any]):
        expenses = await TripService.get_expenses(trip_name)
        idx = next((i for i, e in enumerate(expenses) if e.get("id") == expense_id), None)
        if idx is None:
            return None
        expenses[idx] = {**expenses[idx], **{k: v for k, v in updates.items() if v is not None}}
        await TripService._save_bundle(trip_name, "expenses", expenses, f"Update expense {expense_id} in {trip_name}")
        return expenses[idx]

    @staticmethod
    async def remove_expense(trip_name: str, expense_id: str):
        expenses = await TripService.get_expenses(trip_name)
        new_expenses = [e for e in expenses if e.get("id") != expense_id]
        if len(new_expenses) == len(expenses):
            return None
        await TripService._save_bundle(trip_name, "expenses", new_expenses, f"Remove expense {expense_id} from {trip_name}")
        return new_expenses

    @staticmethod
    async def get_requests(trip_name: str) -> List[Dict[str, Any]]:
        return await TripService._get_bundle(trip_name, "requests")

    @staticmethod
    async def add_request(trip_name: str, user: Dict[str, Any]):
        requests = await TripService.get_requests(trip_name)
        if any(r["email"] == user["email"] for r in requests):
            return requests
        requests.append({"name": user["name"], "email": user["email"], "requested_at": datetime.now().isoformat()})
        await TripService._save_bundle(trip_name, "requests", requests, f"New join request from {user['email']} for {trip_name}")
        return requests

    @staticmethod
    async def approve_request(trip_name: str, email: str):
        requests = await TripService.get_requests(trip_name)
        user = next((r for r in requests if r["email"] == email), None)
        if not user:
            return
        requests = [r for r in requests if r["email"] != email]
        await TripService._save_bundle(trip_name, "requests", requests, f"Approve {email} request")
        await TripService.add_person(trip_name, {"name": user["name"], "email": user["email"]})

    @staticmethod
    async def reject_request(trip_name: str, email: str):
        requests = await TripService.get_requests(trip_name)
        requests = [r for r in requests if r["email"] != email]
        await TripService._save_bundle(trip_name, "requests", requests, f"Reject {email} request")

    @staticmethod
    async def get_balances(trip_name: str) -> List[Dict[str, Any]]:
        return await TripService._get_bundle(trip_name, "balances")

    @staticmethod
    async def update_balances(trip_name: str, balances: List[Dict[str, Any]]):
        await TripService._save_bundle(trip_name, "balances", balances, f"Update balances for {trip_name}")

    @staticmethod
    async def get_settlements(trip_name: str) -> List[Dict[str, Any]]:
        return await TripService._get_bundle(trip_name, "settlements")

    @staticmethod
    async def add_settlement(trip_name: str, settlement: Dict[str, Any]):
        settlements = await TripService.get_settlements(trip_name)
        if "id" not in settlement or not settlement["id"]:
            settlement["id"] = str(uuid.uuid4())
        if "settled_at" not in settlement or not settlement["settled_at"]:
            settlement["settled_at"] = datetime.now().isoformat()
        settlements.append(settlement)
        await TripService._save_bundle(trip_name, "settlements", settlements, f"Add settlement in {trip_name}")
        return settlements

    @staticmethod
    async def remove_settlement(trip_name: str, settlement_id: str):
        settlements = await TripService.get_settlements(trip_name)
        new_settlements = [s for s in settlements if s.get("id") != settlement_id]
        if len(new_settlements) == len(settlements):
            return None
        await TripService._save_bundle(trip_name, "settlements", new_settlements, f"Remove settlement {settlement_id} from {trip_name}")
        return new_settlements
