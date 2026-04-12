# Chale Ham — Frontend

React 18 application providing the UI for the Chale Ham expense sharing app.

## Setup

```bash
npm install
npm start     # dev server at http://localhost:3000
npm run build # production build
```

## Environment Variables

```env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
```

## Pages

| Page | Path | Description |
|------|------|-------------|
| `LoginPage` | `/login` | Hero landing page with Google OAuth. Calls `/me` for real `is_admin`. |
| `Dashboard` | `/dashboard` | Trip cards with storage tier badge (admin), create trip (admin), discover trips. |
| `Trips` | `/trips` | Searchable trip browser — your trips + discover section. |
| `TripDetail` | `/trip/:name` | Tabbed view: Expenses, Balances, Stats, Members. Storage tier badge + toggle in header (admin). |
| `AdminDashboard` | `/admin` | Join request approvals, trip storage migration, user management. |
| `Profile` | `/profile` | Current user info and role badges. |
| `HowToUse` | `/how-to-use` | Sidebar-nav usage guide. Accessible via "Guide" in header. |
| `NotFound` | `*` | 404 fallback. |

## Header Navigation

The header uses a 3-column grid layout (logo / centred nav / controls):

| Link | Visible to |
|------|-----------|
| Dashboard | All logged-in users |
| Trips | All logged-in users |
| Admin | Admin only |
| Guide | All logged-in users |

## CSS Structure

Every component and page folder contains **5 CSS files**:

| File | Contains |
|------|---------|
| `index.css` | Layout, structure, and CSS variable–based colors |
| `light.css` | `.light .classname { }` with explicit light-mode hex values |
| `dark.css` | `.dark .classname { }` with explicit dark-mode hex values |
| `mlight.css` | `@media (max-width: 640px) { .light .classname { } }` |
| `mdark.css` | `@media (max-width: 640px) { .dark .classname { } }` |

All 5 are imported in each component's JSX file.

CSS classnames follow the `componentname-descriptivename` convention (e.g. `dashboard-trip-card`, `trip-detail-expense-item`, `trips-card-tier`).

Global CSS variables (`--bg`, `--surface`, `--text`, `--accent`, etc.) and utility classes (`.btn`, `.card`, `.badge`, `.modal`, `.tabs`, `.avatar-initials`, etc.) live in `src/App.css`.

## Key Libraries

| Library | Use |
|---------|-----|
| `react-router-dom` v6 | Client-side routing |
| `axios` | API calls with Bearer token auth |
| `@react-oauth/google` | Google One Tap OAuth |
| `react-toastify` | Toast notifications |
