# Chale-Ham Backend

The backend for Chale-Ham is a FastAPI application that serves as the API layer for trip management, expense tracking, and user administration.

## Features
- **FastAPI Endpoints**: RESTful API for trips, expenses, and user management.
- **GitHub Integration**: Uses the GitHub API to store trip and expense data as JSON files.
- **MongoDB Atlas**: Manages user profiles, activity status, and admin rights.
- **Google OAuth**: Verifies identity tokens from the frontend.
- **Simplified Debts**: Calculates "who owes whom" and updates balance files.

## Setup
1. Create a `backend/.env` file or use the root `.env`.
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the application:
   ```bash
   uvicorn main:app --reload
   ```

## Key Modules
- `main.py`: The entry point with FastAPI routes.
- `models/`: Pydantic models for data validation.
- `services/`:
  - `auth_service.py`: Google token verification and user registration logic.
  - `github_service.py`: CRUD operations on the GitHub repository.
  - `mongo_service.py`: User data management in MongoDB Atlas.
