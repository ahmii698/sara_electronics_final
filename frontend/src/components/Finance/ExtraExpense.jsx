// src/components/ExtraExpense/ExtraExpense.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit, Trash2, X, Calendar, DollarSign, Building, Filter, RefreshCw, ChevronDown } from 'lucide-react';
import './ExtraExpense.css';
import { API_URL } from '../../../config';

const ExtraExpense = () => {
  const [search, setSearch] = useState('');
  const [monthFilter, setMonthFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [userBranch, setUserBranch] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [expenses, setExpenses] = useState([]);
  const itemsPerPage = 10;

  // ✅ Get user data and fetch immediately
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setUserRole(user.role);
      setUserBranch(user.branch);
      fetchExpenses(user.branch);
    } else {
      fetchExpenses(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ useCallback - function memoize
  const fetchExpenses = useCallback(async (branch) => {
    setFetching(true);
    try {
      const token = localStorage.getItem('token');
      let url = `${API_URL}/expenses/extra`;
      const effectiveBranch = branch || userBranch;
      if (effectiveBranch) {
        url += `?branch_id=${effectiveBranch}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        const mapped = (data.data || []).map(exp => ({
          id: exp.id,
          description: exp.description,
          amount: parseFloat(exp.amount) || 0,
          branch: exp.branch_id,
          date: exp.date
        }));
        setExpenses(mapped);
      } else {
        setExpenses([]);
      }
    } catch (error) {
      console.error('Error fetching extra expenses:', error);
      setExpenses([]);
    }
    setFetching(false);
  }, [userBranch]);

  // ✅ Refresh function - no full loading state
  const handleRefresh = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      let url = `${API_URL}/expenses/extra`;
      if (userBranch) {
        url += `?branch_id=${userBranch}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        const mapped = (data.data || []).map(exp => ({
          id: exp.id,
          description: exp.description,
          amount: parseFloat(exp.amount) || 0,
          branch: exp.branch_id,
          date: exp.date
        }));
        setExpenses(mapped);
      }
    } catch (error) {
      console.error('Error refreshing expenses:', error);
    }
  }, [userBranch]);

  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    branch: 1,
    date: '',
  });

  // ✅ ALL YEARS - 2020 se current year tak
  const getAllYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = 2020; year <= currentYear; year++) {
      years.push(String(year));
    }
    return years;
  };

  // ✅ ALL MONTHS - January to December
  const getAllMonths = () => {
    return ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
  };

  const getMonthName = (monthStr) => {
    if (monthStr === 'all') return 'All Months';
    const date = new Date(2000, parseInt(monthStr) - 1);
    return date.toLocaleString('default', { month: 'long' });
  };

  const getYearName = (yearStr) => {
    if (yearStr === 'all') return 'All Years';
    return yearStr;
  };

  // ✅ Get available years from expenses (for showing which have data)
  const getAvailableYears = () => {
    const years = new Set();
    const filteredExpenses = userBranch ? expenses.filter(e => e.branch === parseInt(userBranch)) : expenses;
    filteredExpenses.forEach(exp => {
      const year = exp.date.substring(0, 4);
      years.add(year);
    });
    return Array.from(years).sort();
  };

  // ✅ Get available months from expenses (for showing which have data)
  const getAvailableMonths = () => {
    const months = new Set();
    const filteredExpenses = userBranch ? expenses.filter(e => e.branch === parseInt(userBranch)) : expenses;
    filteredExpenses.forEach(exp => {
      const month = exp.date.substring(5, 7);
      months.add(month);
    });
    return Array.from(months).sort();
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
      const expMonth = e.date.substring(5, 7);
      monthMatch = expMonth === monthFilter;
    }
    
    let yearMatch = true;
    if (yearFilter !== 'all') {
      const expYear = e.date.substring(0, 4);
      yearMatch = expYear === yearFilter;
    }
    
    return searchMatch && branchMatch && monthMatch && yearMatch;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filtered.slice(startIndex, startIndex + itemsPerPage);

  const getCurrentDate = () => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  };

  const canAddExpense = () => {
    return userRole === 'admin' || userRole === 'manager';
  };

  const handleAddExpense = async () => {
    if (!newExpense.description || !newExpense.amount) {
      alert('Please fill all required fields');
      return;
    }

    const branch = userBranch ? parseInt(userBranch) : parseInt(newExpense.branch);
    const date = newExpense.date || getCurrentDate();
    
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/expenses/extra`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: newExpense.description,
          amount: parseInt(newExpense.amount),
          branch_id: branch,
          date: date,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || 'Failed to add expense');
        setLoading(false);
        return;
      }

      if (data.success) {
        await handleRefresh();
        setNewExpense({ description: '', amount: '', branch: 1, date: '' });
        setShowModal(false);
        alert('✅ Expense added successfully!');
      } else {
        alert(data.message || 'Failed to add expense');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Network error. Please try again.');
    }

    setLoading(false);
  };

  const handleEditExpense = async () => {
    if (!newExpense.description || !newExpense.amount) {
      alert('Please fill all required fields');
      return;
    }

    const branch = userBranch ? parseInt(userBranch) : parseInt(newExpense.branch);
    
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/expenses/extra/${editingExpense.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: newExpense.description,
          amount: parseInt(newExpense.amount),
          branch_id: branch,
          date: newExpense.date || editingExpense.date,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || 'Failed to update expense');
        setLoading(false);
        return;
      }

      if (data.success) {
        await handleRefresh();
        setNewExpense({ description: '', amount: '', branch: 1, date: '' });
        setShowModal(false);
        setEditingExpense(null);
        alert('✅ Expense updated successfully!');
      } else {
        alert(data.message || 'Failed to update expense');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Network error. Please try again.');
    }

    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/expenses/extra/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || 'Failed to delete expense');
        setLoading(false);
        return;
      }

      if (data.success) {
        await handleRefresh();
        alert('✅ Expense deleted successfully!');
      } else {
        alert(data.message || 'Failed to delete expense');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Network error. Please try again.');
    }

    setLoading(false);
  };

  const openAddModal = () => {
    if (!canAddExpense()) {
      alert('Only managers and admins can add expenses');
      return;
    }

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
    if (!canAddExpense()) {
      alert('Only managers and admins can edit expenses');
      return;
    }

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

  const allYears = getAllYears();
  const allMonths = getAllMonths();
  const availableYears = getAvailableYears();
  const availableMonths = getAvailableMonths();

  const totalExpenses = filtered.length;
  const totalAmount = filtered.reduce((sum, e) => sum + e.amount, 0);

  const branch1Total = getBranchTotal(1);
  const branch2Total = getBranchTotal(2);

  const branchLabel = userBranch ? `Branch ${userBranch}` : 'All Branches';

  const statChips = [
    { 
      label: `${totalExpenses} Expenses`, 
      icon: Building,
      color: '#2563eb',
      bg: 'rgba(37, 99, 235, 0.1)',
      className: 'stat-expenses'
    },
    { 
      label: `PKR ${totalAmount.toLocaleString()}`, 
      icon: DollarSign,
      color: '#1E1B4B',
      bg: 'rgba(30, 27, 75, 0.08)',
      className: 'stat-total'
    },
  ];

  // ✅ FAST LOADING - Sirf pehli baar show karega
  if (fetching && expenses.length === 0) {
    return (
      <div className="extra-expense-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading extra expenses...</p>
        </div>
      </div>
    );
  }

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
        </div>

        <div className="header-stats">
          {statChips.map((chip, index) => (
            <span 
              key={index} 
              className={`stat-chip ${chip.className}`}
              style={{ 
                color: chip.color, 
                background: chip.bg,
                borderColor: chip.color + '40'
              }}
            >
              <chip.icon size={14} style={{ color: chip.color }} />
              {chip.label}
            </span>
          ))}
        </div>

        <div className="header-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {canAddExpense() && (
            <button className="btn-accent" onClick={openAddModal}>
              <Plus size={18} />
              Add Expense
            </button>
          )}
          <button className="btn-refresh-small" onClick={handleRefresh} title="Refresh" style={{
            padding: '8px 12px',
            background: '#f3f4f6',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            cursor: 'pointer',
            color: '#4b5563',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            fontWeight: 600
          }}>
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* ===== BRANCH TOTALS CARDS ===== */}
      {userRole === 'admin' && !userBranch && (
        <div className="branch-totals">
          <div className="branch-total-card branch-1-card">
            <div className="branch-card-header">
              <Building size={16} style={{ color: '#1E1B4B' }} />
              <h4 style={{ fontWeight: 700, fontSize: '0.95rem' }}>Branch 1</h4>
            </div>
            <div className="branch-total-row">
              <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1E1B4B' }}>
                PKR {branch1Total.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="branch-total-card branch-2-card">
            <div className="branch-card-header">
              <Building size={16} style={{ color: '#C9A84C' }} />
              <h4 style={{ fontWeight: 700, fontSize: '0.95rem' }}>Branch 2</h4>
            </div>
            <div className="branch-total-row">
              <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#C9A84C' }}>
                PKR {branch2Total.toLocaleString()}
              </span>
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
          {/* ✅ YEAR FILTER - All years 2020 to current */}
          <div className="filter-item">
            <span className="filter-label">Year:</span>
            <select
              className="filter-select"
              value={yearFilter}
              onChange={(e) => { setYearFilter(e.target.value); setCurrentPage(1); }}
              style={{ fontWeight: 500 }}
            >
              <option value="all">All Years</option>
              {allYears.map(year => {
                const hasData = availableYears.includes(year);
                return (
                  <option key={year} value={year}>
                    {year} {hasData ? '✓' : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* ✅ MONTH FILTER - All months January to December */}
          <div className="filter-item">
            <span className="filter-label">Month:</span>
            <select
              className="filter-select"
              value={monthFilter}
              onChange={(e) => { setMonthFilter(e.target.value); setCurrentPage(1); }}
              style={{ fontWeight: 500 }}
            >
              <option value="all">All Months</option>
              {allMonths.map(month => {
                const hasData = availableMonths.includes(month);
                return (
                  <option key={month} value={month}>
                    {getMonthName(month)} {hasData ? '✓' : ''}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {/* ✅ FILTER SUMMARY - Show current filter selection */}
      {(monthFilter !== 'all' || yearFilter !== 'all') && (
        <div className="filter-summary">
          <span style={{ fontWeight: 600 }}>
            Showing: 
            {yearFilter !== 'all' && ` Year ${yearFilter}`}
            {monthFilter !== 'all' && ` • ${getMonthName(monthFilter)}`}
            {yearFilter === 'all' && monthFilter === 'all' && ' All Expenses'}
          </span>
          <button 
            className="btn-clear-filters"
            onClick={() => { setMonthFilter('all'); setYearFilter('all'); setCurrentPage(1); }}
            style={{ fontWeight: 600 }}
          >
            Clear Filters
          </button>
        </div>
      )}

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

      {/* ✅ MONTHLY TOTALS - REMOVED (Extra Expenses mein nahi chahiye) */}

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
                <td colSpan="5" className="no-data">
                  {monthFilter !== 'all' || yearFilter !== 'all' 
                    ? `No expenses found for ${yearFilter !== 'all' ? yearFilter : ''} ${monthFilter !== 'all' ? getMonthName(monthFilter) : ''}`
                    : `No expenses found for ${branchLabel}`}
                </td>
              </tr>
            ) : (
              currentItems.map((exp, index) => (
                <tr key={exp.id} className={index % 2 === 0 ? 'even-row' : 'odd-row'}>
                  <td className="text-gray">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                  <td className="expense-desc">{exp.description}</td>
                  <td className="amount-cell">PKR {exp.amount.toLocaleString()}</td>
                  <td>
                    <span className="date-badge">
                      <Calendar size={12} />
                      {formatDate(exp.date)}
                    </span>
                  </td>
                  <td>
                    <div className="action-group">
                      <button 
                        className="btn-edit" 
                        onClick={() => openEditModal(exp)}
                        title="Edit"
                        disabled={!canAddExpense()}
                        style={!canAddExpense() ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                      >
                        <Edit size={15} />
                      </button>
                      <button 
                        className="btn-delete" 
                        onClick={() => handleDelete(exp.id)}
                        title="Delete"
                        disabled={!canAddExpense()}
                        style={!canAddExpense() ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
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

      {/* ===== ADD/EDIT MODAL ===== */}
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
                    style={userBranch ? { opacity: 0.7, cursor: 'not-allowed', fontWeight: 500 } : { fontWeight: 500 }}
                  >
                    <option value={1}>Branch 1</option>
                    <option value={2}>Branch 2</option>
                  </select>
                  {userBranch && (
                    <small className="field-hint" style={{ fontWeight: 500 }}>Branch locked to {branchLabel}</small>
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
                <small className="field-hint" style={{ fontWeight: 500 }}>Leave empty to use today's date</small>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={closeModal} style={{ fontWeight: 700 }}>
                Cancel
              </button>
              <button 
                className="btn-save" 
                onClick={editingExpense ? handleEditExpense : handleAddExpense}
                style={{ fontWeight: 700 }}
                disabled={loading}
              >
                {loading ? 'Saving...' : (editingExpense ? 'Update' : 'Add')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExtraExpense;