import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, X, Calendar, DollarSign, Building, Filter } from 'lucide-react';
import './ExtraExpense.css';

const ExtraExpense = () => {
  const [search, setSearch] = useState('');
  const [monthFilter, setMonthFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [userBranch, setUserBranch] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const itemsPerPage = 10;

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setUserRole(user.role);
      setUserBranch(user.branch);
    }
  }, []);

  const [expenses, setExpenses] = useState([
    { id: 1, description: 'Tea for staff', amount: 500, branch: 1, date: '2026-03-01' },
    { id: 2, description: 'Pens and stationary', amount: 300, branch: 1, date: '2026-03-02' },
    { id: 3, description: 'Cleaning supplies', amount: 700, branch: 1, date: '2026-03-03' },
    { id: 4, description: 'Printer ink', amount: 1200, branch: 1, date: '2026-04-04' },
    { id: 5, description: 'Office snacks', amount: 450, branch: 1, date: '2026-04-05' },
    { id: 6, description: 'Water bottles', amount: 300, branch: 1, date: '2026-05-06' },
    { id: 7, description: 'Broom and dustpan', amount: 250, branch: 1, date: '2026-05-07' },
    { id: 8, description: 'Notebooks', amount: 600, branch: 1, date: '2026-06-08' },
    { id: 9, description: 'Printer paper', amount: 800, branch: 1, date: '2026-06-10' },
    { id: 10, description: 'Coffee supplies', amount: 350, branch: 1, date: '2026-06-12' },
    { id: 11, description: 'Desk lamp', amount: 450, branch: 1, date: '2026-07-01' },
    { id: 12, description: 'Extension board', amount: 200, branch: 1, date: '2026-07-03' },
    { id: 13, description: 'Tea for staff B2', amount: 400, branch: 2, date: '2026-03-01' },
    { id: 14, description: 'Stationary B2', amount: 250, branch: 2, date: '2026-03-05' },
    { id: 15, description: 'Cleaning B2', amount: 600, branch: 2, date: '2026-04-02' },
    { id: 16, description: 'Printer ink B2', amount: 1000, branch: 2, date: '2026-04-10' },
    { id: 17, description: 'Snacks B2', amount: 350, branch: 2, date: '2026-05-03' },
    { id: 18, description: 'Water B2', amount: 200, branch: 2, date: '2026-05-08' },
    { id: 19, description: 'Notebooks B2', amount: 500, branch: 2, date: '2026-06-05' },
    { id: 20, description: 'Paper B2', amount: 700, branch: 2, date: '2026-06-12' },
  ]);

  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    branch: 1,
    date: '',
  });

  const getUniqueMonths = () => {
    const months = new Set();
    const filteredExpenses = userBranch ? expenses.filter(e => e.branch === parseInt(userBranch)) : expenses;
    filteredExpenses.forEach(exp => {
      const month = exp.date.substring(0, 7);
      months.add(month);
    });
    return Array.from(months).sort();
  };

  const getMonthName = (monthStr) => {
    if (monthStr === 'all') return 'All Months';
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const filtered = expenses.filter(e => {
    const searchMatch = e.description.toLowerCase().includes(search.toLowerCase()) ||
      e.amount.toString().includes(search);
    
    let branchMatch = true;
    if (userBranch) {
      branchMatch = e.branch === parseInt(userBranch);
    }
    
    let monthMatch = true;
    if (monthFilter !== 'all') {
      const expMonth = e.date.substring(0, 7);
      monthMatch = expMonth === monthFilter;
    }
    
    return searchMatch && branchMatch && monthMatch;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filtered.slice(startIndex, startIndex + itemsPerPage);

  const getCurrentDate = () => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  };

  const handleAddExpense = () => {
    if (!newExpense.description || !newExpense.amount) {
      alert('Please fill all required fields');
      return;
    }

    const branch = userBranch ? parseInt(userBranch) : parseInt(newExpense.branch);
    const newId = expenses.length > 0 ? Math.max(...expenses.map(e => e.id)) + 1 : 1;
    const date = newExpense.date || getCurrentDate();

    setExpenses([...expenses, {
      id: newId,
      description: newExpense.description,
      amount: parseInt(newExpense.amount),
      branch: branch,
      date: date,
    }]);

    setNewExpense({ description: '', amount: '', branch: 1, date: '' });
    setShowModal(false);
  };

  const handleEditExpense = () => {
    if (!newExpense.description || !newExpense.amount) {
      alert('Please fill all required fields');
      return;
    }

    setExpenses(expenses.map(e => {
      if (e.id === editingExpense.id) {
        return {
          ...e,
          description: newExpense.description,
          amount: parseInt(newExpense.amount),
          branch: userBranch ? parseInt(userBranch) : parseInt(newExpense.branch),
          date: newExpense.date || e.date,
        };
      }
      return e;
    }));

    setNewExpense({ description: '', amount: '', branch: 1, date: '' });
    setShowModal(false);
    setEditingExpense(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      setExpenses(expenses.filter(e => e.id !== id));
    }
  };

  const openAddModal = () => {
    setEditingExpense(null);
    setNewExpense({ 
      description: '', 
      amount: '', 
      branch: userBranch ? parseInt(userBranch) : 1, 
      date: getCurrentDate() 
    });
    setShowModal(true);
  };

  const openEditModal = (expense) => {
    setEditingExpense(expense);
    setNewExpense({
      description: expense.description,
      amount: expense.amount.toString(),
      branch: expense.branch,
      date: expense.date,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingExpense(null);
    setNewExpense({ description: '', amount: '', branch: 1, date: '' });
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getBranchTotal = (branch) => {
    return filtered
      .filter(e => e.branch === branch)
      .reduce((sum, e) => sum + e.amount, 0);
  };

  const getMonthTotal = (month) => {
    return filtered
      .filter(e => {
        const expMonth = e.date.substring(0, 7);
        return expMonth === month;
      })
      .reduce((sum, e) => sum + e.amount, 0);
  };

  const uniqueMonths = getUniqueMonths();

  const totalExpenses = filtered.length;
  const totalAmount = filtered.reduce((sum, e) => sum + e.amount, 0);

  const branch1Total = getBranchTotal(1);
  const branch2Total = getBranchTotal(2);

  const branchLabel = userBranch ? `Branch ${userBranch}` : 'All Branches';

  return (
    <div className="extra-expense-container">
      <div className="extra-header">
        <div className="header-left">
          <div className="header-title-group">
            <h3>Extra Expenses</h3>
            <span className="live-badge">
              <Calendar size={12} /> Active
            </span>
          </div>
          <div className="branch-label">
            <Building size={14} />
            <span>{branchLabel}</span>
          </div>
          <div className="header-stats">
            <span className="stat-chip">
              <Building size={14} />
              {totalExpenses} Expenses
            </span>
            <span className="stat-chip total-stat">
              <DollarSign size={14} />
              PKR {totalAmount.toLocaleString()}
            </span>
          </div>
        </div>
        <button className="btn-accent" onClick={openAddModal}>
          <Plus size={18} />
          Add Expense
        </button>
      </div>

      {/* ===== BRANCH TOTALS CARDS ===== */}
      {userRole === 'admin' && !userBranch && (
        <div className="branch-totals">
          <div className="branch-total-card branch-1-card">
            <div className="branch-card-header">
              <Building size={16} />
              <h4>Branch 1</h4>
            </div>
            <div className="branch-total-row">
              <span>Total: PKR {branch1Total.toLocaleString()}</span>
            </div>
          </div>
          <div className="branch-total-card branch-2-card">
            <div className="branch-card-header">
              <Building size={16} />
              <h4>Branch 2</h4>
            </div>
            <div className="branch-total-row">
              <span>Total: PKR {branch2Total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      <div className="extra-controls">
        <div className="extra-search">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search expenses..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="filter-group">
          <span className="filter-label">Month:</span>
          <div className="month-filters">
            <button 
              className={`filter-btn month-btn ${monthFilter === 'all' ? 'active' : ''}`}
              onClick={() => { setMonthFilter('all'); setCurrentPage(1); }}
            >
              All
            </button>
            {uniqueMonths.map(month => (
              <button 
                key={month}
                className={`filter-btn month-btn ${monthFilter === month ? 'active' : ''}`}
                onClick={() => { setMonthFilter(month); setCurrentPage(1); }}
              >
                {getMonthName(month)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="totals-container">
        <div className="total-box total-all">
          <span>Total {branchLabel}</span>
          <strong>PKR {totalAmount.toLocaleString()}</strong>
        </div>
        {userRole === 'admin' && !userBranch && (
          <>
            <div className="total-box total-branch-1">
              <span>Branch 1</span>
              <strong>PKR {branch1Total.toLocaleString()}</strong>
            </div>
            <div className="total-box total-branch-2">
              <span>Branch 2</span>
              <strong>PKR {branch2Total.toLocaleString()}</strong>
            </div>
          </>
        )}
      </div>

      {uniqueMonths.length > 0 && (
        <div className="monthly-totals">
          {uniqueMonths.map(month => (
            <div key={month} className="month-total-box">
              <span>{getMonthName(month)}</span>
              <strong>PKR {getMonthTotal(month).toLocaleString()}</strong>
            </div>
          ))}
        </div>
      )}

      <div className="extra-table-wrap">
        <table className="extra-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Description</th>
              <th>Amount (PKR)</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length === 0 ? (
              <tr>
                <td colSpan="5" className="no-data">No expenses found for {branchLabel}</td>
              </tr>
            ) : (
              currentItems.map((exp, index) => (
                <tr key={exp.id}>
                  <td className="text-gray">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                  <td className="expense-desc">{exp.description}</td>
                  <td className="amount-cell">PKR {exp.amount.toLocaleString()}</td>
                  <td>{formatDate(exp.date)}</td>
                  <td>
                    <div className="action-group">
                      <button 
                        className="btn-edit" 
                        onClick={() => openEditModal(exp)}
                        title="Edit"
                      >
                        <Edit size={15} />
                      </button>
                      <button 
                        className="btn-delete" 
                        onClick={() => handleDelete(exp.id)}
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <span>Page {currentPage} of {totalPages || 1}</span>
        <button
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages || totalPages === 0}
        >
          Next
        </button>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-left">
                <Filter size={20} className="modal-icon" />
                <h3>{editingExpense ? 'Edit Extra Expense' : 'Add Extra Expense'}</h3>
              </div>
              <button className="modal-close" onClick={closeModal}>
                <X size={24} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Description *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter expense description"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Amount (PKR) *</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Enter amount"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Branch *</label>
                  <select
                    className="form-input"
                    value={newExpense.branch}
                    onChange={(e) => setNewExpense({ ...newExpense, branch: parseInt(e.target.value) })}
                    disabled={!!userBranch}
                    style={userBranch ? { opacity: 0.7, cursor: 'not-allowed' } : {}}
                  >
                    <option value={1}>Branch 1</option>
                    <option value={2}>Branch 2</option>
                  </select>
                  {userBranch && (
                    <small className="field-hint">Branch locked to {branchLabel}</small>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={newExpense.date}
                  onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                />
                <small className="field-hint">Leave empty to use today's date</small>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={closeModal}>Cancel</button>
              <button className="btn-save" onClick={editingExpense ? handleEditExpense : handleAddExpense}>
                {editingExpense ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExtraExpense;