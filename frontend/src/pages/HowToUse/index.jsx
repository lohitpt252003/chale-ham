import React, { useState } from 'react';
import './index.css';
import './light.css';
import './dark.css';
import './mlight.css';
import './mdark.css';

const sections = [
  {
    id: 'getting-started',
    icon: '🚀',
    title: 'Getting Started',
    steps: [
      {
        step: '1',
        heading: 'Sign in with Google',
        body: 'Click "Sign in with Google" on the login page. Your account is created automatically on first login.',
      },
      {
        step: '2',
        heading: 'Join or create a trip',
        body: 'On the Dashboard, admins can create new trips. Members can browse available trips and send a "Request to Join". An admin will approve the request.',
      },
      {
        step: '3',
        heading: 'Open a trip',
        body: 'Click any trip card on your Dashboard to open the trip detail view. Here you\'ll find four tabs: Expenses, Balances, Stats, and Members.',
      },
    ],
  },
  {
    id: 'expenses',
    icon: '💸',
    title: 'Tracking Expenses',
    steps: [
      {
        step: '1',
        heading: 'Add an expense (admin)',
        body: 'Click "+ Add Expense" in the Expenses tab. Fill in the title, amount, who paid, which members to split with, category, and an optional note. Submit to save.',
      },
      {
        step: '2',
        heading: 'Edit or delete (admin)',
        body: 'Each expense card shows ✏️ Edit and 🗑️ Delete buttons for admins. Balances recalculate instantly after any change.',
      },
      {
        step: '3',
        heading: 'Search & filter',
        body: 'Use the search bar to find expenses by title or note. Use the "Category" and "Person" dropdowns to narrow the list further.',
      },
      {
        step: '4',
        heading: 'Export to CSV',
        body: 'Click "Export CSV" to download a spreadsheet with all expenses, current balances, and settlement history.',
      },
    ],
  },
  {
    id: 'balances',
    icon: '⚖️',
    title: 'Balances & Settlements',
    steps: [
      {
        step: '1',
        heading: 'Reading balances',
        body: 'The Balances tab shows the minimum set of payments needed to settle all debts. Green = someone is owed money, Red = someone owes money.',
      },
      {
        step: '2',
        heading: 'Record a settlement (admin)',
        body: 'Click "+ Record Settlement" in the Balances tab. Choose who paid whom and the amount. The balance list updates immediately.',
      },
      {
        step: '3',
        heading: 'View settlement history',
        body: 'All past settlements appear below the balance list with the date, people involved, amount, and any note.',
      },
      {
        step: '4',
        heading: 'Delete a settlement (admin)',
        body: 'Click the 🗑️ button on any settlement to remove it. Balances recalculate automatically.',
      },
    ],
  },
  {
    id: 'stats',
    icon: '📊',
    title: 'Trip Stats',
    steps: [
      {
        step: '1',
        heading: 'Summary cards',
        body: 'The Stats tab shows total spend, number of expenses, and per-person average at the top.',
      },
      {
        step: '2',
        heading: 'Per-person breakdown',
        body: 'A bar chart ranks each member by total share of expenses, with exact amounts shown.',
      },
      {
        step: '3',
        heading: 'Per-category breakdown',
        body: 'A second bar chart shows spending by category (food, transport, stay, etc.) so you can see where the money went.',
      },
    ],
  },
  {
    id: 'members',
    icon: '👥',
    title: 'Managing Members',
    steps: [
      {
        step: '1',
        heading: 'View members',
        body: 'The Members tab lists everyone in the trip with their name and email.',
      },
      {
        step: '2',
        heading: 'Add a single member (admin)',
        body: 'Fill in the name and email fields at the bottom of the Members tab and click "Add".',
      },
      {
        step: '3',
        heading: 'Bulk add members (admin)',
        body: 'Click "Bulk Add" to open a form where you can add multiple people at once — useful when setting up a new trip.',
      },
    ],
  },
  {
    id: 'admin',
    icon: '🛡️',
    title: 'Admin Panel',
    steps: [
      {
        step: '1',
        heading: 'Join request approvals',
        body: 'The Admin panel shows all pending join requests grouped by trip. Click Approve or Reject for each.',
      },
      {
        step: '2',
        heading: 'Trip storage tier',
        body: 'Active trips live in MongoDB for fast access. Archive a trip to move it to GitHub storage (free, long-term). You can restore it to MongoDB at any time.',
      },
      {
        step: '3',
        heading: 'User management',
        body: 'View all users who have signed in. Deactivate a user to block their access; reactivate to restore it. You cannot deactivate your own account.',
      },
    ],
  },
  {
    id: 'tips',
    icon: '💡',
    title: 'Tips',
    steps: [
      {
        step: '★',
        heading: 'Light / Dark mode',
        body: 'Toggle the 🌙 / ☀️ button in the header to switch themes. Your preference is saved in the browser.',
      },
      {
        step: '★',
        heading: 'Categories',
        body: 'Use categories (Food, Stay, Transport, Activity, Shopping, Other) when adding expenses to make the Stats breakdown more useful.',
      },
      {
        step: '★',
        heading: 'Notes on expenses',
        body: 'Add a note to any expense for extra context — e.g. "Hotel checkout night 3" or "Petrol Delhi–Agra".',
      },
    ],
  },
];

function HowToUse() {
  const [active, setActive] = useState('getting-started');

  const current = sections.find(s => s.id === active);

  return (
    <div className="how-to-use">
      <div className="how-to-use-header">
        <h2>How to use Chale Ham</h2>
        <p className="how-to-use-subtitle">Everything you need to track shared expenses with friends.</p>
      </div>

      <div className="how-to-use-body">
        <nav className="how-to-use-nav">
          {sections.map(s => (
            <button
              key={s.id}
              className={`how-to-use-nav-btn${active === s.id ? ' active' : ''}`}
              onClick={() => setActive(s.id)}
            >
              <span className="how-to-use-nav-icon">{s.icon}</span>
              <span>{s.title}</span>
            </button>
          ))}
        </nav>

        <div className="how-to-use-content">
          <div className="how-to-use-section-title">
            <span className="how-to-use-section-icon">{current.icon}</span>
            <h3>{current.title}</h3>
          </div>

          <div className="how-to-use-steps">
            {current.steps.map((s, i) => (
              <div key={i} className="how-to-use-step">
                <div className="how-to-use-step-badge">{s.step}</div>
                <div className="how-to-use-step-body">
                  <div className="how-to-use-step-heading">{s.heading}</div>
                  <div className="how-to-use-step-text">{s.body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default HowToUse;
