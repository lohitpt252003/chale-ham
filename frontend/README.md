# Chale-Ham Frontend

The frontend for Chale-Ham is a React.js application that provides a modern, responsive, and themed UI for managing shared expenses.

## Features
- **React.js**: Modern component-based architecture.
- **Google OAuth**: Easy login using Google.
- **Theming**: Toggle between Light and Dark modes.
- **Responsive**: Mobile-friendly layout using CSS media queries and the Ubuntu font.
- **Components/Pages**: Each component and page is housed in its own folder with theme-specific CSS files (`light.css`, `dark.css`, `mlight.css`, `mdark.css`).

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the application:
   ```bash
   npm start
   ```

## Directory Structure
- `src/components/`: Shared UI components like `Header` and `Footer`.
- `src/pages/`: Main application views like `Dashboard`, `TripDetail`, `Profile`, and `AdminDashboard`.
- `src/App.js`: Main routing and global state management (user, theme).
- `src/App.css`: Global styles and theme variable definitions.
