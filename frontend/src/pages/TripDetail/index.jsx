import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import './index.css';
import './light.css';
import './dark.css';
import './mlight.css';
import './mdark.css';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

const CATEGORIES = ['general', 'food', 'transport', 'accommodation', 'activities', 'shopping', 'other'];
const CAT_ICONS  = { food: '🍔', transport: '🚗', accommodation: '🏨', activities: '🎡', shopping: '🛍️', other: '📦', general: '💰' };

// ── Expense Modal ─────────────────────────────────────────────────────────────
function ExpenseModal({ people, user, onClose, onSave, initial }) {
  const [description, setDescription] = useState(initial?.description || '');
  const [amount, setAmount]           = useState(initial?.amount || '');
  const [paidBy, setPaidBy]           = useState(initial?.paid_by || user.email);
  const [splitAmong, setSplitAmong]   = useState(initial?.split_among || people.map(p => p.email));
  const [category, setCategory]       = useState(initial?.category || 'general');
  const [notes, setNotes]             = useState(initial?.notes || '');
  const [date, setDate]               = useState(initial?.date ? initial.date.split('T')[0] : new Date().toISOString().split('T')[0]);
  const [saving, setSaving]           = useState(false);

  const toggleSplit = (email) =>
    setSplitAmong(prev => prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (splitAmong.length === 0) { toast.error('Select at least one person.'); return; }
    setSaving(true);
    await onSave({ description, amount: parseFloat(amount), paid_by: paidBy, split_among: splitAmong, category, notes, date: new Date(date).toISOString() });
    setSaving(false);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{initial ? 'Edit Expense' : 'Add Expense'}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Description</label>
            <input value={description} onChange={e => setDescription(e.target.value)} placeholder="What was this for?" required />
          </div>
          <div className="form-row">
            <div className="form-group" style={{ margin: 0 }}>
              <label>Amount (₹)</label>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" step="0.01" min="0.01" required />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{CAT_ICONS[c]} {c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Paid by</label>
            <select value={paidBy} onChange={e => setPaidBy(e.target.value)}>
              {people.map(p => <option key={p.email} value={p.email}>{p.name}{p.email === user.email ? ' (You)' : ''}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Split among ({splitAmong.length})</label>
            <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '4px 12px' }}>
              {people.map(p => (
                <label key={p.email} className="checkbox-row" onClick={() => toggleSplit(p.email)}>
                  <input type="checkbox" checked={splitAmong.includes(p.email)} onChange={() => toggleSplit(p.email)} onClick={e => e.stopPropagation()} />
                  {p.name}{p.email === user.email ? ' (You)' : ''}
                </label>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label>Notes (optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any extra details..." rows={2} />
          </div>
          <div className="form-group">
            <label>Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} max={new Date().toISOString().split('T')[0]} required />
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving} style={{ width: '100%', justifyContent: 'center' }}>
            {saving ? 'Saving...' : initial ? 'Update Expense' : 'Add Expense'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Settle Modal ──────────────────────────────────────────────────────────────
function SettleModal({ balances, people, user, onClose, onSave }) {
  const emailToName = Object.fromEntries(people.map(p => [p.email, p.name]));
  const [fromEmail, setFromEmail] = useState(user.email);
  const [toEmail, setToEmail]     = useState('');
  const [amount, setAmount]       = useState('');
  const [note, setNote]           = useState('');
  const [saving, setSaving]       = useState(false);

  const hint = useMemo(() =>
    toEmail ? balances.find(b => b.from === fromEmail && b.to === toEmail) : null,
    [fromEmail, toEmail, balances]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!toEmail) { toast.error('Select who you are paying.'); return; }
    setSaving(true);
    await onSave({ from_email: fromEmail, to_email: toEmail, amount: parseFloat(amount), note });
    setSaving(false);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>Record Settlement</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>From (who paid)</label>
            <select value={fromEmail} onChange={e => setFromEmail(e.target.value)}>
              {people.map(p => <option key={p.email} value={p.email}>{p.name}{p.email === user.email ? ' (You)' : ''}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>To (who received)</label>
            <select value={toEmail} onChange={e => setToEmail(e.target.value)} required>
              <option value="">Select person...</option>
              {people.filter(p => p.email !== fromEmail).map(p => <option key={p.email} value={p.email}>{p.name}</option>)}
            </select>
          </div>
          {hint && (
            <div className="trip-detail-settle-hint">
              Outstanding: ₹{hint.amount.toFixed(2)}
              <button type="button" className="btn btn-sm btn-primary" onClick={() => setAmount(hint.amount.toString())}>Use this</button>
            </div>
          )}
          <div className="form-group">
            <label>Amount (₹)</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" step="0.01" min="0.01" required />
          </div>
          <div className="form-group">
            <label>Note (optional)</label>
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Paid via GPay" />
          </div>
          <button type="submit" className="btn btn-success" disabled={saving} style={{ width: '100%', justifyContent: 'center' }}>
            {saving ? 'Recording...' : 'Record Settlement'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Bulk Add Modal ────────────────────────────────────────────────────────────
function BulkAddModal({ onClose, onSave }) {
  const [rows, setRows]     = useState([{ name: '', email: '' }]);
  const [saving, setSaving] = useState(false);

  const updateRow = (i, field, val) => setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: val } : r));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const valid = rows.filter(r => r.name.trim() && r.email.trim());
    if (valid.length === 0) { toast.error('Add at least one person.'); return; }
    setSaving(true);
    await onSave(valid);
    setSaving(false);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`modal trip-detail-modal-bulk`}>
        <div className="modal-header">
          <h3>Bulk Add Members</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          {rows.map((row, i) => (
            <div key={i} className="trip-detail-bulk-row">
              <input placeholder="Name" value={row.name} onChange={e => updateRow(i, 'name', e.target.value)} required />
              <input type="email" placeholder="Email" value={row.email} onChange={e => updateRow(i, 'email', e.target.value)} required />
              {rows.length > 1 && (
                <button type="button" className="btn-icon color-red" onClick={() => setRows(prev => prev.filter((_, idx) => idx !== i))}>×</button>
              )}
            </div>
          ))}
          <button type="button" className="btn btn-ghost btn-sm" style={{ marginBottom: '16px' }}
            onClick={() => setRows(prev => [...prev, { name: '', email: '' }])}>+ Add row</button>
          <button type="submit" className="btn btn-primary" disabled={saving} style={{ width: '100%', justifyContent: 'center' }}>
            {saving ? 'Adding...' : 'Add Members'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Stats Tab ─────────────────────────────────────────────────────────────────
function StatsTab({ expenses, people }) {
  const emailToName = Object.fromEntries(people.map(p => [p.email, p.name]));

  const [statPerson,   setStatPerson]   = useState('all');
  const [statCategory, setStatCategory] = useState('all');

  const filtered = useMemo(() => expenses.filter(exp => {
    const matchPerson   = statPerson   === 'all' || exp.paid_by === statPerson || exp.split_among.includes(statPerson);
    const matchCategory = statCategory === 'all' || (exp.category || 'general') === statCategory;
    return matchPerson && matchCategory;
  }), [expenses, statPerson, statCategory]);

  const total = filtered.reduce((s, e) => s + e.amount, 0);

  const byPerson = useMemo(() => {
    const map = {};
    people.forEach(p => { map[p.email] = 0; });
    filtered.forEach(exp => { if (map[exp.paid_by] !== undefined) map[exp.paid_by] += exp.amount; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filtered, people]);

  const byCategory = useMemo(() => {
    const map = {};
    filtered.forEach(exp => { const c = exp.category || 'general'; map[c] = (map[c] || 0) + exp.amount; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  if (expenses.length === 0)
    return <div className="empty-state"><div style={{ fontSize: '2rem' }}>📊</div><p>No expenses yet.</p></div>;

  const catMax = byCategory[0]?.[1] || 1;

  return (
    <div className="trip-detail-stats-grid">
      <div className="trip-detail-filter-bar">
        <select className="trip-detail-filter-select" value={statPerson} onChange={e => setStatPerson(e.target.value)}>
          <option value="all">All people</option>
          {people.map(p => <option key={p.email} value={p.email}>{p.name} ({p.email})</option>)}
        </select>
        <select className="trip-detail-filter-select" value={statCategory} onChange={e => setStatCategory(e.target.value)}>
          <option value="all">All categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{CAT_ICONS[c]} {c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
        </select>
      </div>

      <div className="trip-detail-stat-summary">
        <div className="trip-detail-stat-label">Total Spent</div>
        <div className="trip-detail-stat-total">₹{total.toFixed(2)}</div>
        <div className="trip-detail-stat-sub">{filtered.length} expenses · {people.length} people</div>
      </div>

      <div className="trip-detail-stat-card">
        <h3>Paid per person</h3>
        {byPerson.map(([email, amt]) => (
          <div key={email} className="trip-detail-stat-row">
            <div className="trip-detail-stat-row-header">
              <span className="trip-detail-stat-row-name">{emailToName[email] || email}</span>
              <span className="trip-detail-stat-row-amount">₹{amt.toFixed(2)}</span>
            </div>
            <div className="trip-detail-stat-bar-bg">
              <div className="trip-detail-stat-bar-fill accent" style={{ width: `${total > 0 ? (amt / total) * 100 : 0}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="trip-detail-stat-card">
        <h3>By category</h3>
        {byCategory.map(([cat, amt]) => (
          <div key={cat} className="trip-detail-stat-row">
            <div className="trip-detail-stat-row-header">
              <span className="trip-detail-stat-row-name">{CAT_ICONS[cat] || '📦'} {cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
              <span className="trip-detail-stat-row-amount">₹{amt.toFixed(2)}</span>
            </div>
            <div className="trip-detail-stat-bar-bg">
              <div className="trip-detail-stat-bar-fill green" style={{ width: `${(amt / catMax) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
function TripDetail({ user }) {
  const { tripName } = useParams();
  const [people, setPeople]           = useState([]);
  const [expenses, setExpenses]       = useState([]);
  const [balances, setBalances]       = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [tab, setTab]                 = useState('expenses');

  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense]     = useState(null);
  const [showSettleModal, setShowSettleModal]   = useState(false);
  const [showBulkModal, setShowBulkModal]       = useState(false);

  const [search, setSearch]                 = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPerson, setFilterPerson]     = useState('all');
  const [memberSearch, setMemberSearch]     = useState('');
  const [isActive, setIsActive]             = useState(null);
  const [togglingStorage, setTogglingStorage] = useState(false);

  useEffect(() => {
    setSearch('');
    setFilterCategory('all');
    setFilterPerson('all');
    setMemberSearch('');
    fetchData();
  }, [tripName]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const requests = [
        axios.get(`${API}/trips/${tripName}/people`,      { headers: authHeader() }),
        axios.get(`${API}/trips/${tripName}/expenses`,    { headers: authHeader() }),
        axios.get(`${API}/trips/${tripName}/balances`,    { headers: authHeader() }),
        axios.get(`${API}/trips/${tripName}/settlements`, { headers: authHeader() }),
      ];
      if (user.isAdmin) {
        requests.push(axios.get(`${API}/trips/status`, { headers: authHeader() }));
      }
      const results = await Promise.all(requests);
      setPeople(results[0].data);
      setExpenses([...results[1].data].reverse());
      setBalances(results[2].data);
      setSettlements(results[3].data);
      if (user.isAdmin && results[4]) {
        const meta = results[4].data.find(t => t.name === tripName);
        setIsActive(meta ? meta.is_active : null);
      }
    } catch { toast.error('Failed to load trip data.'); }
    finally { setLoading(false); }
  };

  const handleToggleStorage = async () => {
    if (!window.confirm(isActive
      ? `Archive "${tripName}" to GitHub? It will still be accessible but reads/writes will be slower.`
      : `Restore "${tripName}" to MongoDB? This will make it fully active again.`
    )) return;
    setTogglingStorage(true);
    try {
      const res = await axios.put(`${API}/trips/${tripName}/status?is_active=${!isActive}`, {}, { headers: authHeader() });
      setIsActive(res.data.is_active);
      toast.success(isActive ? 'Trip archived to GitHub.' : 'Trip restored to MongoDB.');
    } catch { toast.error('Failed to change storage tier.'); }
    finally { setTogglingStorage(false); }
  };

  const handleAddExpense = async (data) => {
    try {
      await axios.post(`${API}/trips/${tripName}/expenses`, data, { headers: authHeader() });
      toast.success('Expense added!');
      setShowExpenseModal(false);
      fetchData();
    } catch { toast.error('Failed to add expense.'); }
  };

  const handleEditExpense = async (data) => {
    try {
      await axios.put(`${API}/trips/${tripName}/expenses/${editingExpense.id}`, data, { headers: authHeader() });
      toast.success('Expense updated!');
      setEditingExpense(null);
      fetchData();
    } catch { toast.error('Failed to update expense.'); }
  };

  const handleDeleteExpense = async (expId) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await axios.delete(`${API}/trips/${tripName}/expenses/${expId}`, { headers: authHeader() });
      toast.info('Expense deleted.');
      fetchData();
    } catch { toast.error('Failed to delete expense.'); }
  };

  const handleSettle = async (data) => {
    try {
      await axios.post(`${API}/trips/${tripName}/settlements`, data, { headers: authHeader() });
      toast.success('Settlement recorded!');
      setShowSettleModal(false);
      fetchData();
    } catch { toast.error('Failed to record settlement.'); }
  };

  const handleDeleteSettlement = async (id) => {
    if (!window.confirm('Remove this settlement?')) return;
    try {
      await axios.delete(`${API}/trips/${tripName}/settlements/${id}`, { headers: authHeader() });
      toast.info('Settlement removed.');
      fetchData();
    } catch { toast.error('Failed to remove settlement.'); }
  };

  const handleBulkAdd = async (data) => {
    try {
      await axios.post(`${API}/trips/${tripName}/people/bulk`, data, { headers: authHeader() });
      toast.success(`Added ${data.length} member(s)!`);
      setShowBulkModal(false);
      fetchData();
    } catch { toast.error('Failed to add members.'); }
  };

  const handleExport = () => {
    axios.get(`${API}/trips/${tripName}/export`, { headers: authHeader(), responseType: 'blob' })
      .then(res => {
        const url = URL.createObjectURL(res.data);
        const a   = document.createElement('a');
        a.href    = url;
        a.download = `${tripName}_export.csv`;
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch(() => toast.error('Export failed.'));
  };

  const filteredExpenses = useMemo(() =>
    expenses.filter(exp => {
      const matchSearch = !search || exp.description.toLowerCase().includes(search.toLowerCase()) || (exp.notes || '').toLowerCase().includes(search.toLowerCase());
      const matchCat    = filterCategory === 'all' || (exp.category || 'general') === filterCategory;
      const matchPerson = filterPerson === 'all' || exp.paid_by === filterPerson || exp.split_among.includes(filterPerson);
      return matchSearch && matchCat && matchPerson;
    }),
    [expenses, search, filterCategory, filterPerson]
  );

  const emailToName = Object.fromEntries(people.map(p => [p.email, p.name]));

  if (loading) return <div className="loading-screen">Loading trip...</div>;

  return (
    <div>
      {/* Header */}
      <div className="trip-detail-header-bar">
        <Link to="/dashboard" className="trip-detail-back">← Back</Link>
        <div className="trip-detail-title-group">
          <h1 className="trip-detail-title">{tripName}</h1>
          {user.isAdmin && isActive !== null && (
            <span className={`badge ${isActive ? 'badge-green' : 'badge-accent'} trip-detail-storage-badge`}>
              {isActive ? '⚡ MongoDB' : '📦 Archived'}
            </span>
          )}
        </div>
        <div className="trip-detail-actions">
          <button className="btn btn-ghost btn-sm" onClick={handleExport}>⬇ Export</button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowExpenseModal(true)}>+ Expense</button>
          {user.isAdmin && (
            <>
              <button className="btn btn-success btn-sm" onClick={() => setShowSettleModal(true)}>✓ Settle</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowBulkModal(true)}>+ Bulk Add</button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={handleToggleStorage}
                disabled={togglingStorage || isActive === null}
                title={isActive ? 'Archive to GitHub' : 'Restore to MongoDB'}
              >
                {togglingStorage ? '...' : isActive ? '📦 Archive' : '⚡ Restore'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {[['expenses', '🧾 Expenses'], ['balances', '⚖️ Balances'], ['stats', '📊 Stats'], ['members', '👥 Members']].map(([key, label]) => (
          <button key={key} className={`tab-btn${tab === key ? ' active' : ''}`} onClick={() => setTab(key)}>{label}</button>
        ))}
      </div>

      {/* ── Expenses ── */}
      {tab === 'expenses' && (
        <>
          <div className="trip-detail-filter-bar">
            <input className="trip-detail-filter-search" placeholder="Search expenses..." value={search} onChange={e => setSearch(e.target.value)} />
            <select className="trip-detail-filter-select" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
              <option value="all">All categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{CAT_ICONS[c]} {c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
            <select className="trip-detail-filter-select" value={filterPerson} onChange={e => setFilterPerson(e.target.value)}>
              <option value="all">All people</option>
              {people.map(p => <option key={p.email} value={p.email}>{p.name} ({p.email})</option>)}
            </select>
          </div>

          {filteredExpenses.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: '2rem' }}>🧾</div>
              <p>{expenses.length > 0 ? 'No expenses match your filters.' : 'No expenses yet.'}</p>
            </div>
          ) : (
            <div className="trip-detail-expense-list">
              {filteredExpenses.map(exp => (
                <div key={exp.id} className="trip-detail-expense-item">
                  <div className="trip-detail-expense-icon">
                    <div className="trip-detail-expense-cat-icon">{CAT_ICONS[exp.category] || '💰'}</div>
                    <div className="trip-detail-expense-date">
                      {new Date(exp.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                  <div className="trip-detail-expense-body">
                    <div className="trip-detail-expense-title">{exp.description}</div>
                    <div className="trip-detail-expense-meta">
                      {emailToName[exp.paid_by] || exp.paid_by} paid · split {exp.split_among.length} ways
                    </div>
                    {exp.notes && <div className="trip-detail-expense-notes">{exp.notes}</div>}
                    <span className="badge badge-accent trip-detail-expense-badge">{exp.category || 'general'}</span>
                  </div>
                  <div className="trip-detail-expense-right">
                    <div className={`trip-detail-expense-amount${exp.paid_by === user.email ? ' paid-by-me' : ''}`}>
                      ₹{parseFloat(exp.amount).toFixed(2)}
                    </div>
                    {user.isAdmin && (
                      <div className="trip-detail-expense-item-actions">
                        <button className="btn-icon" title="Edit" onClick={() => setEditingExpense(exp)}>✏️</button>
                        <button className="btn-icon color-red" title="Delete" onClick={() => handleDeleteExpense(exp.id)}>🗑</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Balances ── */}
      {tab === 'balances' && (
        <div className="trip-detail-balance-list">
          {balances.length === 0 ? (
            <div className="empty-state"><div style={{ fontSize: '2rem' }}>✅</div><p>All settled up!</p></div>
          ) : balances.map((b, i) => (
            <div key={i} className="trip-detail-balance-item">
              <div className="trip-detail-balance-label">
                {b.from === user.email
                  ? <span>You owe <strong>{emailToName[b.to] || b.to}</strong></span>
                  : b.to === user.email
                    ? <span><strong>{emailToName[b.from] || b.from}</strong> owes you</span>
                    : <span>{emailToName[b.from] || b.from} owes {emailToName[b.to] || b.to}</span>
                }
              </div>
              <div className={`trip-detail-balance-amount ${b.from === user.email ? 'owe' : b.to === user.email ? 'owed' : 'other'}`}>
                ₹{parseFloat(b.amount).toFixed(2)}
              </div>
            </div>
          ))}

          {settlements.length > 0 && (
            <>
              <div className="trip-detail-settlement-title">Settlement History</div>
              {settlements.map(s => (
                <div key={s.id} className="trip-detail-settlement-item">
                  <span className="badge badge-green">Settled</span>
                  <div className="trip-detail-settlement-info">
                    {emailToName[s.from_email] || s.from_email} paid {emailToName[s.to_email] || s.to_email}
                    {s.note && <span className="trip-detail-settlement-note"> · {s.note}</span>}
                  </div>
                  <div className="trip-detail-settlement-amount">₹{parseFloat(s.amount).toFixed(2)}</div>
                  <div className="trip-detail-settlement-date">{s.settled_at ? new Date(s.settled_at).toLocaleDateString('en-IN') : ''}</div>
                  {user.isAdmin && (
                    <button className="btn-icon color-red" onClick={() => handleDeleteSettlement(s.id)}>×</button>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* ── Stats ── */}
      {tab === 'stats' && <StatsTab expenses={expenses} people={people} />}

      {/* ── Members ── */}
      {tab === 'members' && (
        <div className="trip-detail-members-card">
          <div className="trip-detail-members-header">
            <h3>Members ({people.length})</h3>
            {user.isAdmin && <button className="btn btn-ghost btn-sm" onClick={() => setShowBulkModal(true)}>+ Bulk Add</button>}
          </div>

          <input
            className="trip-detail-filter-search"
            placeholder="Search members..."
            value={memberSearch}
            onChange={e => setMemberSearch(e.target.value)}
            style={{ marginBottom: '8px' }}
          />

          {people.filter(p =>
            !memberSearch ||
            p.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
            p.email.toLowerCase().includes(memberSearch.toLowerCase())
          ).map(p => (
            <div key={p.email} className="trip-detail-member-item">
              <div className="avatar-initials">{p.name.charAt(0).toUpperCase()}</div>
              <div className="trip-detail-member-info">
                <div className="trip-detail-member-name">{p.name}</div>
                <div className="trip-detail-member-email">{p.email}</div>
              </div>
              {p.email === user.email && <span className="badge badge-accent trip-detail-member-you">You</span>}
            </div>
          ))}

          {user.isAdmin && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const fd = new FormData(e.target);
                try {
                  await axios.post(`${API}/trips/${tripName}/people`, { name: fd.get('name'), email: fd.get('email') }, { headers: authHeader() });
                  toast.success('Member added!');
                  e.target.reset();
                  fetchData();
                } catch { toast.error('Failed to add member.'); }
              }}
              className="trip-detail-add-form"
            >
              <input name="name" className="trip-detail-add-name" placeholder="Name" required />
              <input name="email" type="email" className="trip-detail-add-email" placeholder="Email" required />
              <button type="submit" className="btn btn-primary btn-sm">+ Add</button>
            </form>
          )}
        </div>
      )}

      {/* Modals */}
      {showExpenseModal && (
        <ExpenseModal people={people} user={user} initial={null}
          onClose={() => setShowExpenseModal(false)} onSave={handleAddExpense} />
      )}
      {editingExpense && (
        <ExpenseModal people={people} user={user} initial={editingExpense}
          onClose={() => setEditingExpense(null)} onSave={handleEditExpense} />
      )}
      {showSettleModal && (
        <SettleModal balances={balances} people={people} user={user}
          onClose={() => setShowSettleModal(false)} onSave={handleSettle} />
      )}
      {showBulkModal && (
        <BulkAddModal onClose={() => setShowBulkModal(false)} onSave={handleBulkAdd} />
      )}
    </div>
  );
}

export default TripDetail;
