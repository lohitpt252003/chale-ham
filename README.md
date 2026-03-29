# Chale-Ham Expense Sharing Application

Chale-Ham is a lightweight expense-sharing web application built for a specific group of friends. It allows users to track expenses across different trips, calculate simplified debts, and manage users.

## Features
- **Google OAuth Login**: Secure authentication via Google.
- **Trip Discovery & Join Requests**: Users can discover trips and request to join. Admins must approve requests before users can view trip details.
- **Trip Management**: Create and view different trips.
- **Expense Tracking**: Add and delete (admin only) expenses; automatically calculate who owes whom.
- **User Management**: Admin can activate or deactivate users.
- **Multi-Theme Support**: Light and Dark mode toggle.
- **Responsive Design**: Mobile-friendly layout using Ubuntu font.

## Tech Stack & Architecture
This project uses a **Hybrid Database Architecture**:
- **MongoDB Atlas**: Used **exclusively** for user-related data (profile, admin status, active/inactive status).
- **GitHub Repository**: Used as the **primary database** for all application data, including:
  - Trip definitions
  - Expense records
  - Membership lists (`people.json`)
  - Pending join requests (`requests.json`)
- **Frontend**: React.js, Axios, React Router, Google OAuth Library
- **Backend**: FastAPI (Python), Uvicorn, Motor (Async MongoDB), Google Auth Library
- **Containerization**: Docker & Docker Compose

## Prerequisites
- Docker and Docker Compose installed.
- Google OAuth Client ID.
- GitHub Personal Access Token (PAT).
- MongoDB Atlas Connection String.

## Environment Variables
Create a `.env` file in the root directory with the following variables:
```env
GITHUB_PAT=your_github_pat
GITHUB_USERNAME=your_github_username
GITHUB_REPO_NAME=your_github_repo_name
GOOGLE_CLIENT_ID=your_google_client_id
ADMIN_EMAIL=your_email@gmail.com
MONGO_URI=your_mongodb_atlas_uri
```

## Getting Started
1. Clone the repository.
2. Configure the `.env` file.
3. Run the application using Docker Compose:
   ```bash
   docker compose up --build
   ```
4. Access the frontend at `http://localhost:3000` and the backend at `http://localhost:8000`.

## Directory Structure
- `backend/`: FastAPI application, models, and services.
- `frontend/`: React application, components, and pages.
- `DATA/`: (Optional) Local repository used by the GitHub API as a data store.
