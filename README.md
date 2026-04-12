# Chale Ham

A Splitwise-style expense sharing app built for a closed group of friends. Track shared expenses across trips, calculate who owes whom, and settle up — all with a clean light/dark UI.

## Features

- **Google OAuth Login** — secure, no passwords
- **Trip Management** — create trips, request to join, admin approvals
- **Expense Tracking** — add/edit/delete expenses with categories, notes, and split control; any trip member can add expenses
- **Settlement Tracking** — record payments between people, balances auto-update
- **Trip Stats** — total spend, per-person breakdown, per-category breakdown
- **Search & Filter** — filter expenses by keyword, category, or person
- **Bulk Add Members** — add multiple people to a trip at once
- **CSV Export** — download expenses, balances, and settlements
- **Storage Status** — trip storage tier (MongoDB / GitHub Archive) shown on Dashboard and TripDetail
- **Light / Dark Mode** — persisted per browser
- **Responsive** — works on mobile
- **How to Use Guide** — built-in usage guide accessible from the header

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Axios, React Router v6, React Toastify, @react-oauth/google |
| Backend | FastAPI, Uvicorn, Motor (async MongoDB), Google Auth |
| Primary DB | MongoDB Atlas (active trips) |
| Archive | GitHub repository via GitHub API (inactive trips) |
| Container | Docker & Docker Compose |

## Hybrid Storage Architecture

Active trips live entirely in **MongoDB** for speed. When a trip is archived by an admin, all data migrates to a **GitHub repository** as JSON files. Reactivating pulls it back into MongoDB. This avoids GitHub API rate limits for active use while keeping storage costs at zero.

Storage tier is visible on trip cards (Dashboard) and in the TripDetail header. Admins can toggle it directly from inside a trip — no need to visit the Admin panel.

## Prerequisites

- Docker & Docker Compose
- Google OAuth Client ID
- GitHub Personal Access Token (PAT) + a repo to use as the data store
- MongoDB Atlas connection string

## Quick Start

1. Clone the repo
2. Create `.env` in the root (see below)
3. Run:
   ```bash
   docker compose up --build
   ```
4. Open `http://localhost:3000`

## Environment Variables

```env
GITHUB_PAT=
GITHUB_USERNAME=
GITHUB_REPO_NAME=
GOOGLE_CLIENT_ID=
ADMIN_EMAIL=
MONGO_URI=
```

The `ADMIN_EMAIL` address gets `is_admin: true` automatically on first login. The frontend also needs `REACT_APP_GOOGLE_CLIENT_ID` and `REACT_APP_API_URL` set if not using Docker Compose defaults.

## Directory Structure

```
backend/      FastAPI app, models, services
frontend/     React app — each page/component has its own folder + 5 CSS files
docker-compose.yml
.env
```
