from fastapi import FastAPI, Depends, HTTPException, Header, status
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import os
from dotenv import load_dotenv

from models.models import Person, Expense, Trip
from services.github_service import GitHubService
from services.auth_service import AuthService
from services.mongo_service import MongoService

load_dotenv()

app = FastAPI(title="Chale-Ham Expense Sharing API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authentication token",
        )
    
    token = authorization.split(" ")[1]
    user = await AuthService.verify_token(token)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
        )
    
    if "error" in user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=user["error"],
        )
        
    return user

async def get_admin_user(user = Depends(get_current_user)):
    if not user["is_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return user

@app.get("/users")
async def list_users(admin = Depends(get_admin_user)):
    return await MongoService.list_users()

@app.put("/users/{email}/status")
async def update_user_status(email: str, is_active: bool, admin = Depends(get_admin_user)):
    updated_user = await MongoService.set_user_status(email, is_active)
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")
    return updated_user

@app.get("/trips")
async def list_trips(user = Depends(get_current_user)):
    # Discovery: List all trips
    return await GitHubService.list_trips()

@app.get("/my-trips")
async def list_my_trips(user = Depends(get_current_user)):
    try:
        trips = await GitHubService.list_trips()
        if user["is_admin"]:
            return trips
        
        user_trips = []
        for trip_name in trips:
            people = await GitHubService.get_people(trip_name)
            if any(p["email"] == user["email"] for p in people):
                user_trips.append(trip_name)
        return user_trips
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/trips/{trip_name}/join")
async def join_trip_request(trip_name: str, user = Depends(get_current_user)):
    # Check if already a member
    people = await GitHubService.get_people(trip_name)
    if any(p["email"] == user["email"] for p in people):
        return {"message": "Already a member of this trip"}
    
    # Check if request already exists
    requests = await GitHubService.get_requests(trip_name)
    if any(r["email"] == user["email"] for r in requests):
        return {"message": "Join request already pending"}

    await GitHubService.add_request(trip_name, user)
    return {"message": "Join request sent to admin"}

@app.get("/trips/{trip_name}/requests")
async def list_trip_requests(trip_name: str, admin = Depends(get_admin_user)):
    return await GitHubService.get_requests(trip_name)

@app.post("/trips/{trip_name}/requests/{email}/approve")
async def approve_trip_request(trip_name: str, email: str, admin = Depends(get_admin_user)):
    await GitHubService.approve_request(trip_name, email)
    return {"message": f"Approved {email} for {trip_name}"}

@app.post("/trips/{trip_name}/requests/{email}/reject")
async def reject_trip_request(trip_name: str, email: str, admin = Depends(get_admin_user)):
    await GitHubService.reject_request(trip_name, email)
    return {"message": f"Rejected {email} for {trip_name}"}

@app.delete("/trips/{trip_name}/expenses/{expense_id}")
async def delete_expense(trip_name: str, expense_id: str, admin = Depends(get_admin_user)):
    try:
        updated_expenses = await GitHubService.remove_expense(trip_name, expense_id)
        if updated_expenses is None:
            raise HTTPException(status_code=404, detail="Expense not found")
            
        people = await GitHubService.get_people(trip_name)
        balances = calculate_balances(updated_expenses, people)
        await GitHubService.update_file(
            f"trips/{trip_name}/balances.json",
            balances,
            f"Update balances for {trip_name} after deleting expense {expense_id}"
        )
        
        return {"expenses": updated_expenses, "balances": balances}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/trips")
async def create_trip(trip_name: str, admin = Depends(get_admin_user)):
    try:
        await GitHubService.create_trip(trip_name)
        # Add admin to the trip by default
        await GitHubService.add_person(trip_name, {"name": admin["name"], "email": admin["email"]})
        return {"message": f"Trip '{trip_name}' created successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/trips/{trip_name}/people")
async def add_person_to_trip(trip_name: str, person: Person, admin = Depends(get_admin_user)):
    try:
        updated_people = await GitHubService.add_person(trip_name, person.dict())
        return updated_people
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/trips/{trip_name}/people")
async def get_trip_people(trip_name: str, user = Depends(get_current_user)):
    try:
        people = await GitHubService.get_people(trip_name)
        if not user["is_admin"] and not any(p["email"] == user["email"] for p in people):
            raise HTTPException(status_code=403, detail="Not a member of this trip")
        return people
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/trips/{trip_name}/expenses")
async def get_trip_expenses(trip_name: str, user = Depends(get_current_user)):
    try:
        # Check if member
        people = await GitHubService.get_people(trip_name)
        if not user["is_admin"] and not any(p["email"] == user["email"] for p in people):
            raise HTTPException(status_code=403, detail="Not a member of this trip")
            
        expenses = await GitHubService.get_expenses(trip_name)
        return expenses
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/trips/{trip_name}/expenses")
async def add_expense_to_trip(trip_name: str, expense: Expense, user = Depends(get_current_user)):
    try:
        # Check if member
        people = await GitHubService.get_people(trip_name)
        if not user["is_admin"] and not any(p["email"] == user["email"] for p in people):
            raise HTTPException(status_code=403, detail="Not a member of this trip")
            
        updated_expenses = await GitHubService.add_expense(trip_name, expense.dict())
        
        # Here we could calculate simplified debts and push them too, 
        # but the prompt says: "appends a new expense, calculates simplified debts (who owes whom), and pushes the updated file back to GitHub."
        # The prompt says expenses.json contains id, paid_by, amount, description, date, split_among.
        # It doesn't explicitly say where simplified debts are stored.
        # I'll assume they are stored in a separate file or within expenses.json.
        # Let's create a 'balances.json' file for simplified debts.
        
        balances = calculate_balances(updated_expenses, people)
        await GitHubService.update_file(
            f"trips/{trip_name}/balances.json",
            balances,
            f"Update balances for {trip_name}"
        )
        
        return {"expenses": updated_expenses, "balances": balances}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/trips/{trip_name}/balances")
async def get_trip_balances(trip_name: str, user = Depends(get_current_user)):
    try:
        # Check if member
        people = await GitHubService.get_people(trip_name)
        if not user["is_admin"] and not any(p["email"] == user["email"] for p in people):
            raise HTTPException(status_code=403, detail="Not a member of this trip")
            
        result = await GitHubService.get_file_content(f"trips/{trip_name}/balances.json")
        return result["content"] if result else []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def calculate_balances(expenses, people):
    # Very simple debt calculation:
    # Net balance for each person
    net_balances = {p["email"]: 0.0 for p in people}
    
    for exp in expenses:
        paid_by = exp["paid_by"]
        amount = exp["amount"]
        split_among = exp["split_among"]
        
        if not split_among:
            continue
            
        share = amount / len(split_among)
        
        if paid_by in net_balances:
            net_balances[paid_by] += amount
            
        for person_email in split_among:
            if person_email in net_balances:
                net_balances[person_email] -= share
                
    # Format into "who owes whom"
    # This is a simplified version (not optimal "minimal transactions")
    debtors = []
    creditors = []
    
    for email, balance in net_balances.items():
        if balance < -0.01:
            debtors.append({"email": email, "balance": balance})
        elif balance > 0.01:
            creditors.append({"email": email, "balance": balance})
            
    debts = []
    debtors.sort(key=lambda x: x["balance"])
    creditors.sort(key=lambda x: x["balance"], reverse=True)
    
    i = 0
    j = 0
    while i < len(debtors) and j < len(creditors):
        debtor = debtors[i]
        creditor = creditors[j]
        
        amount = min(-debtor["balance"], creditor["balance"])
        debts.append({
            "from": debtor["email"],
            "to": creditor["email"],
            "amount": round(amount, 2)
        })
        
        debtor["balance"] += amount
        creditor["balance"] -= amount
        
        if abs(debtor["balance"]) < 0.01:
            i += 1
        if abs(creditor["balance"]) < 0.01:
            j += 1
            
    return debts

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
