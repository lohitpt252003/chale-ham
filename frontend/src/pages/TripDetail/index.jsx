import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './index.css';
import './light.css';
import './dark.css';
import './mlight.css';
import './mdark.css';

function TripDetail({ user, theme }) {
  const { tripName } = useParams();
  const [people, setPeople] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // New Expense form
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [splitAmong, setSplitAmong] = useState([]);
  
  // New Person form
  const [newPersonName, setNewPersonName] = useState('');
  const [newPersonEmail, setNewPersonEmail] = useState('');

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchData();
  }, [tripName]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, eRes, bRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/trips/${tripName}/people`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/trips/${tripName}/expenses`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/trips/${tripName}/balances`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setPeople(pRes.data);
      setExpenses(eRes.data);
      setBalances(bRes.data);
      setSplitAmong(pRes.data.map(p => p.email));
    } catch (err) {
      console.error(err);
      alert("Failed to fetch trip data.");
    } finally {
      setLoading(false);
    }
  };

  const addExpense = async (e) => {
    e.preventDefault();
    try {
      const expenseData = {
        id: Date.now().toString(),
        paid_by: user.email,
        amount: parseFloat(amount),
        description,
        date: new Date().toISOString(),
        split_among: splitAmong
      };
      await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/trips/${tripName}/expenses`, expenseData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDescription('');
      setAmount('');
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to add expense.");
    }
  };

  const addPerson = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/trips/${tripName}/people`, {
        name: newPersonName,
        email: newPersonEmail
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewPersonName('');
      setNewPersonEmail('');
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to add person.");
    }
  };

  const toggleSplit = (email) => {
    if (splitAmong.includes(email)) {
      setSplitAmong(splitAmong.filter(e => e !== email));
    } else {
      setSplitAmong([...splitAmong, email]);
    }
  };

  if (loading) return <div className={`loading-container ${theme}`}>Loading...</div>;

  return (
    <div className={`trip-detail-container ${theme}`}>
      <h1>Trip: {tripName}</h1>
      
      <div className="trip-content">
        <div className="trip-left-column">
          <h3>People ({people.length})</h3>
          <ul className="people-list">
            {people.map(p => (
              <li key={p.email}>{p.name} ({p.email})</li>
            ))}
          </ul>

          <div className="expense-form-container">
            <h3>Add Expense</h3>
            <form onSubmit={addExpense} className="expense-form">
              <input type="text" placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} required />
              <input type="number" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} required />
              <div className="split-selection">
                <p>Split among:</p>
                {people.map(p => (
                  <label key={p.email} className="checkbox-label">
                    <input type="checkbox" checked={splitAmong.includes(p.email)} onChange={() => toggleSplit(p.email)} />
                    {p.name}
                  </label>
                ))}
              </div>
              <button type="submit" className="submit-btn">Add Expense</button>
            </form>
          </div>

          <h3>Expenses</h3>
          <div className="expenses-list">
            {expenses.map(exp => (
              <div key={exp.id} className="expense-item">
                <div className="expense-header">
                  <strong>{exp.description}</strong>: ${exp.amount}
                </div>
                <small>Paid by {exp.paid_by} on {new Date(exp.date).toLocaleDateString()}</small>
              </div>
            ))}
          </div>
        </div>

        <div className="trip-right-column">
          <h3>Simplified Balances (Who owes whom)</h3>
          {balances.length === 0 ? <p>No debts yet.</p> : (
            <ul className="balances-list">
              {balances.map((b, idx) => (
                <li key={idx}><strong>{b.from}</strong> owes <strong>{b.to}</strong>: ${b.amount}</li>
              ))}
            </ul>
          )}

          {user.isAdmin && (
            <div className="admin-add-person">
              <h3>Admin Panel: Add Person</h3>
              <form onSubmit={addPerson} className="person-form">
                <input type="text" placeholder="Name" value={newPersonName} onChange={e => setNewPersonName(e.target.value)} required />
                <input type="email" placeholder="Email" value={newPersonEmail} onChange={e => setNewPersonEmail(e.target.value)} required />
                <button type="submit" className="submit-btn">Add Person to Trip</button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TripDetail;
