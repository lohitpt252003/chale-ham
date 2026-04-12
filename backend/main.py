from fastapi import FastAPI, Depends, Header, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from typing import List, Optional
import os
import csv
import io
from dotenv import load_dotenv

from models.models import Person, Expense, ExpenseUpdate, Settlement, Trip
from services.trip_service import TripService
from services.auth_service import AuthService
from services.mongo_service import MongoService

load_dotenv()

app = FastAPI(title="Chale-Ham Expense Sharing API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        return JSONResponse(status_code=401, content={"error": "Missing or invalid token"})
    token = authorization.split(" ")[1]
    user = await AuthService.verify_token(token)
    if not user:
        return JSONResponse(status_code=401, content={"error": "Invalid token"})
    if "error" in user:
        return JSONResponse(status_code=403, content={"error": user["error"]})
    return user


async def get_admin_user(user=Depends(get_current_user)):
    if isinstance(user, JSONResponse):
        return user
    if not user.get("is_admin"):
        return JSONResponse(status_code=403, content={"error": "Admin access required"})
    return user


def is_error(dep_result) -> bool:
    return isinstance(dep_result, JSONResponse)


# ── Auth ─────────────────────────────────────────────────────────────────────

@app.get("/me")
async def get_me(user=Depends(get_current_user)):
    if is_error(user):
        return user
    return user


# ── Users ────────────────────────────────────────────────────────────────────

@app.get("/users")
async def list_users(admin=Depends(get_admin_user)):
    if is_error(admin):
        return admin
    return await MongoService.list_users()


@app.put("/users/{email}/status")
async def update_user_status(email: str, is_active: bool, admin=Depends(get_admin_user)):
    if is_error(admin):
        return admin
    updated_user = await MongoService.set_user_status(email, is_active)
    if not updated_user:
        return JSONResponse(status_code=404, content={"error": "User not found"})
    return updated_user


# ── Trips ────────────────────────────────────────────────────────────────────

@app.get("/trips")
async def list_trips(user=Depends(get_current_user)):
    if is_error(user):
        return user
    return await TripService.list_trips()


@app.get("/trips/status")
async def get_trips_status(admin=Depends(get_admin_user)):
    if is_error(admin):
        return admin
    return await TripService.get_all_trips_status()


@app.post("/trips")
async def create_trip(trip_name: str, admin=Depends(get_admin_user)):
    if is_error(admin):
        return admin
    await TripService.create_trip(trip_name)
    await TripService.add_person(trip_name, {"name": admin["name"], "email": admin["email"]})
    return {"message": f"Trip '{trip_name}' created successfully"}


@app.put("/trips/{trip_name}/status")
async def update_trip_status(trip_name: str, is_active: bool, admin=Depends(get_admin_user)):
    if is_error(admin):
        return admin
    return await TripService.toggle_status(trip_name, is_active)


@app.get("/my-trips")
async def list_my_trips(user=Depends(get_current_user)):
    if is_error(user):
        return user
    trips = await TripService.list_trips()
    if user["is_admin"]:
        return trips
    user_trips = []
    for trip_name in trips:
        people = await TripService.get_people(trip_name)
        if any(p["email"] == user["email"] for p in people):
            user_trips.append(trip_name)
    return user_trips


@app.get("/my-requests")
async def list_my_requests(user=Depends(get_current_user)):
    if is_error(user):
        return user
    trips = await TripService.list_trips()
    my_requests = []
    for trip_name in trips:
        requests = await TripService.get_requests(trip_name)
        if any(r["email"] == user["email"] for r in requests):
            my_requests.append(trip_name)
    return my_requests


# ── Trip Join Requests ────────────────────────────────────────────────────────

@app.post("/trips/{trip_name}/join")
async def join_trip_request(trip_name: str, user=Depends(get_current_user)):
    if is_error(user):
        return user
    people = await TripService.get_people(trip_name)
    if any(p["email"] == user["email"] for p in people):
        return {"message": "Already a member of this trip"}
    requests = await TripService.get_requests(trip_name)
    if any(r["email"] == user["email"] for r in requests):
        return {"message": "Join request already pending"}
    await TripService.add_request(trip_name, user)
    return {"message": "Join request sent to admin"}


@app.get("/trips/{trip_name}/requests")
async def list_trip_requests(trip_name: str, admin=Depends(get_admin_user)):
    if is_error(admin):
        return admin
    return await TripService.get_requests(trip_name)


@app.post("/trips/{trip_name}/requests/{email}/approve")
async def approve_trip_request(trip_name: str, email: str, admin=Depends(get_admin_user)):
    if is_error(admin):
        return admin
    await TripService.approve_request(trip_name, email)
    return {"message": f"Approved {email} for {trip_name}"}


@app.post("/trips/{trip_name}/requests/{email}/reject")
async def reject_trip_request(trip_name: str, email: str, admin=Depends(get_admin_user)):
    if is_error(admin):
        return admin
    await TripService.reject_request(trip_name, email)
    return {"message": f"Rejected {email} for {trip_name}"}


# ── People ────────────────────────────────────────────────────────────────────

@app.get("/trips/{trip_name}/people")
async def get_trip_people(trip_name: str, user=Depends(get_current_user)):
    if is_error(user):
        return user
    people = await TripService.get_people(trip_name)
    if not user["is_admin"] and not any(p["email"] == user["email"] for p in people):
        return JSONResponse(status_code=403, content={"error": "Not a member of this trip"})
    return people


@app.post("/trips/{trip_name}/people")
async def add_person_to_trip(trip_name: str, person: Person, admin=Depends(get_admin_user)):
    if is_error(admin):
        return admin
    return await TripService.add_person(trip_name, person.dict())


@app.post("/trips/{trip_name}/people/bulk")
async def bulk_add_people(trip_name: str, people: List[Person], admin=Depends(get_admin_user)):
    if is_error(admin):
        return admin
    return await TripService.add_people_bulk(trip_name, [p.dict() for p in people])


# ── Expenses ──────────────────────────────────────────────────────────────────

@app.get("/trips/{trip_name}/expenses")
async def get_trip_expenses(trip_name: str, user=Depends(get_current_user)):
    if is_error(user):
        return user
    people = await TripService.get_people(trip_name)
    if not user["is_admin"] and not any(p["email"] == user["email"] for p in people):
        return JSONResponse(status_code=403, content={"error": "Not a member of this trip"})
    return await TripService.get_expenses(trip_name)


@app.post("/trips/{trip_name}/expenses")
async def add_expense_to_trip(trip_name: str, expense: Expense, user=Depends(get_current_user)):
    if is_error(user):
        return user
    people = await TripService.get_people(trip_name)
    if not user["is_admin"] and not any(p["email"] == user["email"] for p in people):
        return JSONResponse(status_code=403, content={"error": "Not a member of this trip"})
    member_emails = {p["email"] for p in people}
    if not expense.split_among:
        return JSONResponse(status_code=400, content={"error": "split_among cannot be empty"})
    if expense.paid_by not in member_emails:
        return JSONResponse(status_code=400, content={"error": f"paid_by '{expense.paid_by}' is not a trip member"})
    invalid = [e for e in expense.split_among if e not in member_emails]
    if invalid:
        return JSONResponse(status_code=400, content={"error": f"split_among contains non-members: {invalid}"})
    updated_expenses = await TripService.add_expense(trip_name, expense.dict())
    settlements = await TripService.get_settlements(trip_name)
    balances = calculate_balances(updated_expenses, people, settlements)
    await TripService.update_balances(trip_name, balances)
    return {"expenses": updated_expenses, "balances": balances}


@app.put("/trips/{trip_name}/expenses/{expense_id}")
async def edit_expense(trip_name: str, expense_id: str, updates: ExpenseUpdate, admin=Depends(get_admin_user)):
    if is_error(admin):
        return admin
    updated = await TripService.update_expense(trip_name, expense_id, updates.dict(exclude_none=True))
    if updated is None:
        return JSONResponse(status_code=404, content={"error": "Expense not found"})
    people = await TripService.get_people(trip_name)
    expenses = await TripService.get_expenses(trip_name)
    settlements = await TripService.get_settlements(trip_name)
    balances = calculate_balances(expenses, people, settlements)
    await TripService.update_balances(trip_name, balances)
    return {"expense": updated, "balances": balances}


@app.delete("/trips/{trip_name}/expenses/{expense_id}")
async def delete_expense(trip_name: str, expense_id: str, admin=Depends(get_admin_user)):
    if is_error(admin):
        return admin
    updated_expenses = await TripService.remove_expense(trip_name, expense_id)
    if updated_expenses is None:
        return JSONResponse(status_code=404, content={"error": "Expense not found"})
    people = await TripService.get_people(trip_name)
    settlements = await TripService.get_settlements(trip_name)
    balances = calculate_balances(updated_expenses, people, settlements)
    await TripService.update_balances(trip_name, balances)
    return {"expenses": updated_expenses, "balances": balances}


# ── Balances ──────────────────────────────────────────────────────────────────

@app.get("/trips/{trip_name}/balances")
async def get_trip_balances(trip_name: str, user=Depends(get_current_user)):
    if is_error(user):
        return user
    people = await TripService.get_people(trip_name)
    if not user["is_admin"] and not any(p["email"] == user["email"] for p in people):
        return JSONResponse(status_code=403, content={"error": "Not a member of this trip"})
    return await TripService.get_balances(trip_name)


# ── Settlements ───────────────────────────────────────────────────────────────

@app.get("/trips/{trip_name}/settlements")
async def get_trip_settlements(trip_name: str, user=Depends(get_current_user)):
    if is_error(user):
        return user
    people = await TripService.get_people(trip_name)
    if not user["is_admin"] and not any(p["email"] == user["email"] for p in people):
        return JSONResponse(status_code=403, content={"error": "Not a member of this trip"})
    return await TripService.get_settlements(trip_name)


@app.post("/trips/{trip_name}/settlements")
async def add_settlement(trip_name: str, settlement: Settlement, admin=Depends(get_admin_user)):
    if is_error(admin):
        return admin
    settlements = await TripService.add_settlement(trip_name, settlement.dict())
    people = await TripService.get_people(trip_name)
    expenses = await TripService.get_expenses(trip_name)
    balances = calculate_balances(expenses, people, settlements)
    await TripService.update_balances(trip_name, balances)
    return {"settlements": settlements, "balances": balances}


@app.delete("/trips/{trip_name}/settlements/{settlement_id}")
async def delete_settlement(trip_name: str, settlement_id: str, admin=Depends(get_admin_user)):
    if is_error(admin):
        return admin
    updated = await TripService.remove_settlement(trip_name, settlement_id)
    if updated is None:
        return JSONResponse(status_code=404, content={"error": "Settlement not found"})
    people = await TripService.get_people(trip_name)
    expenses = await TripService.get_expenses(trip_name)
    balances = calculate_balances(expenses, people, updated)
    await TripService.update_balances(trip_name, balances)
    return {"settlements": updated, "balances": balances}


# ── Export ────────────────────────────────────────────────────────────────────

@app.get("/trips/{trip_name}/export")
async def export_trip_csv(trip_name: str, user=Depends(get_current_user)):
    if is_error(user):
        return user
    people = await TripService.get_people(trip_name)
    if not user["is_admin"] and not any(p["email"] == user["email"] for p in people):
        return JSONResponse(status_code=403, content={"error": "Not a member of this trip"})

    expenses    = await TripService.get_expenses(trip_name)
    balances    = await TripService.get_balances(trip_name)
    settlements = await TripService.get_settlements(trip_name)

    email_to_name = {p["email"]: p["name"] for p in people}

    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow(["=== EXPENSES ==="])
    writer.writerow(["Date", "Description", "Category", "Amount (INR)", "Paid By", "Split Among", "Notes"])
    for exp in expenses:
        split_names = ", ".join(email_to_name.get(e, e) for e in exp.get("split_among", []))
        writer.writerow([
            exp.get("date", "")[:10],
            exp.get("description", ""),
            exp.get("category", "general"),
            f"{exp.get('amount', 0):.2f}",
            email_to_name.get(exp.get("paid_by", ""), exp.get("paid_by", "")),
            split_names,
            exp.get("notes", ""),
        ])

    writer.writerow([])
    writer.writerow(["=== BALANCES ==="])
    writer.writerow(["From", "To", "Amount (INR)"])
    for b in balances:
        writer.writerow([
            email_to_name.get(b.get("from", ""), b.get("from", "")),
            email_to_name.get(b.get("to", ""), b.get("to", "")),
            f"{b.get('amount', 0):.2f}",
        ])

    writer.writerow([])
    writer.writerow(["=== SETTLEMENTS ==="])
    writer.writerow(["Date", "From", "To", "Amount (INR)", "Note"])
    for s in settlements:
        writer.writerow([
            s.get("settled_at", "")[:10],
            email_to_name.get(s.get("from_email", ""), s.get("from_email", "")),
            email_to_name.get(s.get("to_email", ""), s.get("to_email", "")),
            f"{s.get('amount', 0):.2f}",
            s.get("note", ""),
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={trip_name}_export.csv"}
    )


# ── Balance Calculation ───────────────────────────────────────────────────────

def calculate_balances(expenses, people, settlements=None):
    net_balances = {p["email"]: 0.0 for p in people}

    for exp in expenses:
        paid_by     = exp.get("paid_by")
        amount      = exp.get("amount", 0)
        split_among = exp.get("split_among", [])
        if not split_among:
            continue
        share = amount / len(split_among)
        if paid_by in net_balances:
            net_balances[paid_by] += amount
        for email in split_among:
            if email in net_balances:
                net_balances[email] -= share

    if settlements:
        for s in settlements:
            from_e = s.get("from_email")
            to_e   = s.get("to_email")
            amt    = s.get("amount", 0)
            if from_e in net_balances:
                net_balances[from_e] += amt
            if to_e in net_balances:
                net_balances[to_e] -= amt

    debtors   = [{"email": e, "balance": b} for e, b in net_balances.items() if b < -0.01]
    creditors = [{"email": e, "balance": b} for e, b in net_balances.items() if b > 0.01]
    debtors.sort(key=lambda x: x["balance"])
    creditors.sort(key=lambda x: x["balance"], reverse=True)

    debts = []
    i, j = 0, 0
    while i < len(debtors) and j < len(creditors):
        debtor   = debtors[i]
        creditor = creditors[j]
        amount   = min(-debtor["balance"], creditor["balance"])
        debts.append({"from": debtor["email"], "to": creditor["email"], "amount": round(amount, 2)})
        debtor["balance"]   += amount
        creditor["balance"] -= amount
        if abs(debtor["balance"]) < 0.01:
            i += 1
        if abs(creditor["balance"]) < 0.01:
            j += 1

    return debts


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
