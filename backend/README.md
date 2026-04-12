# Chale Ham — Backend

FastAPI application serving as the API layer for trip management, expense tracking, settlements, and user administration.

## Features

- Google OAuth token verification via `google-auth`
- Hybrid MongoDB / GitHub storage routing (see Architecture below)
- Expense categories, notes, edit, and deletion
- Any trip member can add expenses; edit/delete restricted to admins
- Settlement tracking with balance recalculation
- Bulk member addition
- CSV export endpoint
- Admin-gated routes via dependency injection

## Setup

Uses the root `.env` file (or create `backend/.env`):

```bash
pip install -r requirements.txt
uvicorn main:app --reload
```

API runs at `http://localhost:8000`. Interactive docs at `/docs`.

## Key Modules

| File | Responsibility |
|------|---------------|
| `main.py` | All FastAPI routes + `calculate_balances()` |
| `models/models.py` | Pydantic models: `User`, `Person`, `Expense`, `ExpenseUpdate`, `Settlement`, `Trip` |
| `services/auth_service.py` | Google token verification, user upsert into MongoDB |
| `services/trip_service.py` | **Single routing layer** — transparently reads/writes to Mongo or GitHub based on `is_active` flag |
| `services/mongo_service.py` | MongoDB CRUD for users and active trip bundles |
| `services/github_service.py` | GitHub API CRUD for archived trip JSON files |

## Error Handling

Routes return `JSONResponse` for errors instead of raising `HTTPException`. Auth dependencies (`get_current_user`, `get_admin_user`) also return `JSONResponse` on failure; routes check with `is_error()` and pass the response through. No try/except boilerplate in route handlers.

## API Overview

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/me` | User | Current user profile with `is_admin` |
| GET | `/trips` | User | List all trip names |
| GET | `/trips/status` | Admin | List all trips with `is_active` flag |
| POST | `/trips` | Admin | Create trip |
| GET | `/my-trips` | User | Trips the user belongs to |
| GET | `/my-requests` | User | Trips where user has a pending join request |
| POST | `/trips/{name}/join` | User | Request to join |
| POST | `/trips/{name}/requests/{email}/approve` | Admin | Approve join request |
| POST | `/trips/{name}/requests/{email}/reject` | Admin | Reject join request |
| GET | `/trips/{name}/expenses` | Member | List expenses |
| POST | `/trips/{name}/expenses` | Member | Add expense |
| PUT | `/trips/{name}/expenses/{id}` | Admin | Edit expense |
| DELETE | `/trips/{name}/expenses/{id}` | Admin | Delete expense |
| GET | `/trips/{name}/balances` | Member | Current balances |
| GET | `/trips/{name}/settlements` | Member | Settlement history |
| POST | `/trips/{name}/settlements` | Admin | Record settlement |
| DELETE | `/trips/{name}/settlements/{id}` | Admin | Remove settlement |
| POST | `/trips/{name}/people/bulk` | Admin | Bulk add members |
| GET | `/trips/{name}/export` | Member | CSV export |
| PUT | `/trips/{name}/status` | Admin | Toggle MongoDB ↔ GitHub |
| GET | `/users` | Admin | List all users |
| PUT | `/users/{email}/status` | Admin | Activate/deactivate user |

## Balance Calculation

`calculate_balances(expenses, people, settlements)` runs on every mutation:
1. Computes net balance per person from expenses
2. Subtracts settled amounts to reduce remaining debt
3. Greedy creditor/debtor matching produces minimal `{from, to, amount}` list
