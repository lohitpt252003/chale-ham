# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Is

**Chale Ham** is a Splitwise-style group expense sharing app built for a closed group of friends. Users log in via Google OAuth, join trips, and track shared expenses with categories, notes, settlement tracking, and stats.

## Running the App

### Docker (recommended)
```bash
docker compose up --build
```
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`

### Local dev
```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend
cd frontend
npm install
npm start
```

## Environment Variables

Create a `.env` in the root directory:
```
GITHUB_PAT=
GITHUB_USERNAME=
GITHUB_REPO_NAME=
GOOGLE_CLIENT_ID=
ADMIN_EMAIL=
MONGO_URI=
```

## Architecture

### Hybrid Storage Model
Trips have two states — **active** and **inactive**:

- **Active trips** → data lives in **MongoDB Atlas** (`trips` collection). Each document holds 5 arrays: `people`, `expenses`, `balances`, `requests`, `settlements`. Fast reads/writes, no GitHub API rate limits.
- **Inactive trips** → data lives in a **GitHub repository** as JSON files (`trips/<name>/{people,expenses,balances,requests,settlements}.json`). Zero-cost long-term archive.

When an admin toggles a trip active, `TripService.toggle_status()` pulls all 5 JSON files from GitHub into Mongo and deletes the GitHub files. Toggling inactive does the reverse.

### Request Routing
`TripService` (`backend/services/trip_service.py`) is the single interface `main.py` uses — it transparently routes reads/writes to either Mongo or GitHub based on `is_active` flag. `GitHubService` and `MongoService` are lower-level and should not be called directly from routes.

### Auth Flow
1. Frontend gets a Google ID token via `@react-oauth/google`.
2. Login calls `GET /me` which validates the token and returns the user's real `is_admin` flag from MongoDB.
3. Admin is identified solely by `ADMIN_EMAIL` env var on first login.

### Error Handling
Routes return `JSONResponse` for errors — no `raise HTTPException` in route handlers. Auth dependencies (`get_current_user`, `get_admin_user`) also return `JSONResponse` on failure. Every route checks `is_error(dep_result)` at the top and passes the error response through if true.

### Balance Calculation
`calculate_balances(expenses, people, settlements)` in `main.py`:
- Computes net balances from expenses (who paid, who owes share)
- Applies settlements to reduce remaining balances
- Uses a greedy creditor/debtor matching algorithm to produce `{from, to, amount}` debt list
- Recalculates on every expense add/edit/delete and every settlement add/delete

### Key Backend Endpoints
- `GET /me` — current user profile with `is_admin`
- `GET /trips/status` — all trips with `is_active` flag (admin only)
- `POST /trips/{name}/expenses` — any trip member can add (not admin-only)
- `PUT /trips/{name}/expenses/{id}` — edit expense (admin only)
- `POST /trips/{name}/people/bulk` — bulk add members
- `GET/POST/DELETE /trips/{name}/settlements` — settlement tracking
- `GET /trips/{name}/export` — CSV export (expenses + balances + settlements)
- `PUT /trips/{name}/status` — toggle MongoDB ↔ GitHub archive

## Frontend CSS Structure

Every page and component has its own folder with **5 CSS files**:

| File | Purpose |
|------|---------|
| `index.css` | Layout and structure using CSS variables |
| `light.css` | `.light .classname { }` — explicit light theme colors |
| `dark.css` | `.dark .classname { }` — explicit dark theme colors |
| `mlight.css` | `@media (max-width: 640px) { .light .classname { } }` |
| `mdark.css` | `@media (max-width: 640px) { .dark .classname { } }` |

All 5 are imported in each component's JSX. Global CSS variables (--bg, --surface, --text, --accent, etc.) are defined in `App.css`. Global utility classes (`.btn`, `.card`, `.badge`, `.modal`, `.tabs`, `.avatar-initials`, etc.) also live in `App.css`.

## Frontend Pages

| Page | Route | Notes |
|------|-------|-------|
| `LoginPage` | `/login` | Hero landing page with Google OAuth; calls `/me` for real `is_admin` |
| `Dashboard` | `/dashboard` | Trip cards with storage tier badge (admin), create trip (admin), discover trips |
| `Trips` | `/trips` | Searchable trip browser — your trips + discover section |
| `TripDetail` | `/trip/:name` | Tabs: Expenses / Balances / Stats / Members; storage badge + toggle in header (admin) |
| `AdminDashboard` | `/admin` | Requests, storage tier toggle, user management |
| `Profile` | `/profile` | User info and role badges |
| `HowToUse` | `/how-to-use` | Sidebar-nav usage guide; accessible via "Guide" in header |
| `NotFound` | `*` | 404 fallback |

## Header Navigation

The header uses a 3-column grid: logo (left) / centred nav links / controls (right). Nav links: **Dashboard**, **Trips**, **Admin** (admin only), **Guide**. Active link gets accent highlight.

CSS classnames follow `componentname-descriptivename` convention (e.g. `dashboard-trip-card`, `trip-detail-expense-item`, `admin-dashboard-req-group`, `trips-card-tier`).

## Key Constraints

- Any trip member can add expenses. Only admins can edit/delete expenses, approve/reject join requests, record/delete settlements, bulk add members, and toggle trip storage tier.
- New trips are created directly in MongoDB as active (no GitHub interaction at creation time).
- `list_trips()` merges trip names from both GitHub and MongoDB to ensure nothing is missed.
- The `REACT_APP_GOOGLE_CLIENT_ID` env var must be set for Google OAuth to work in the frontend.
