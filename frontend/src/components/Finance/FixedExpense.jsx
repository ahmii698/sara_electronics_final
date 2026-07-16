import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Eye, DollarSign, X, Calendar, Clock, Building, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import './FixedExpense.css';
import { API_URL } from '../../../config';

const FixedExpense = () => {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [userBranch, setUserBranch] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setUserRole(user.role);
      setUserBranch(user.branch);
    }
  }, []);

  const [expenses, setExpenses] = useState([
    { 
      id: 1, 
      name: 'Rent', 
      amount: 50000, 
      branch: 1, 
      dueDate: '1st of every month',
      paid: true,
      lastPaid: '2026-06-01',
      history: [
        { date: '2026-06-01 10:00 AM', amount: 50000, status: 'Paid' },
        { date: '2026-05-01 09:30 AM', amount: 50000, status: 'Paid' },
        { date: '2026-04-01 11:00 AM', amount: 50000, status: 'Paid' },
      ]
    },
    { 
      id: 2, 
      name: 'Electricity Bill', 
      amount: 15000, 
      branch: 1, 
      dueDate: '15th of every month',
      paid: false,
      lastPaid: '2026-05-15',
      history: [
        { date: '2026-05-15 02:30 PM', amount: 15000, status: 'Paid' },
        { date: '2026-04-15 10:15 AM', amount: 15000, status: 'Paid' },
      ]
    },
    { 
      id: 3, 
      name: 'Internet', 
      amount: 5000, 
      branch: 1, 
      dueDate: '20th of every month',
      paid: true,
      lastPaid: '2026-06-20',
      history: [
        { date: '2026-06-20 09:00 AM', amount: 5000, status: 'Paid' },
        { date: '2026-05-20 08:45 AM', amount: 5000, status: 'Paid' },
        { date: '2026-04-20 10:30 AM', amount: 5000, status: 'Paid' },
      ]
    },
    { 
      id: 4, 
      name: 'Rent', 
      amount: 35000, 
      branch: 2, 
      dueDate: '1st of every month',
      paid: true,
      lastPaid: '2026-06-01',
      history: [
        { date: '2026-06-01 09:00 AM', amount: 35000, status: 'Paid' },
        { date: '2026-05-01 10:00 AM', amount: 35000, status: 'Paid' },
      ]
    },
    { 
      id: 5, 
      name: 'Electricity Bill', 
      amount: 12000, 
      branch: 2, 
      dueDate: '15th of every month',
      paid: false,
      lastPaid: '2026-05-15',
      history: [
        { date: '2026-05-15 11:30 AM', amount: 12000, status: 'Paid' },
        { date: '2026-04-15 09:45 AM', amount: 12000, status: 'Paid' },
      ]
    },
    { 
      id: 6, 
      name: 'Internet', 
      amount: 4000, 
      branch: 2, 
      dueDate: '20th of every month',
      paid: false,
      lastPaid: '2026-05-20',
      history: [
        { date: '2026-05-20 10:15 AM', amount: 4000, status: 'Paid' },
        { date: '2026-04-20 11:30 AM', amount: 4000, status: 'Paid' },
      ]
    },
    { 
      id: 7, 
      name: 'Security', 
      amount: 8000, 
      branch: 1, 
      dueDate: '30th of every month',
      paid: false,
      lastPaid: '2026-05-30',
      history: [
        { date: '2026-05-30 05:00 PM', amount: 8000, status: 'Paid' },
      ]
    },
    { 
      id: 8, 
      name: 'Cleaning', 
      amount: 6000, 
      branch: 2, 
      dueDate: '25th of every month',
      paid: false,
      lastPaid: '2026-05-25',
      history: [
        { date: '2026-05-25 08:00 AM', amount: 6000, status: 'Paid' },
      ]
    },
  ]);

  const [newExpense, setNewExpense] = useState({
    name: '',
    amount: '',
    branch: 1,
    dueDate: '',
  });

  const [payAmount, setPayAmount] = useState('');

  const filtered = expenses.filter(e => {
    const searchMatch = e.name.toLowerCase().includes(search.toLowerCase());
    
    let branchMatch = true;
    if (userBranch) {
      branchMatch = e.branch === parseInt(userBranch);
    }
    
    return searchMatch && branchMatch;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filtered.slice(startIndex, startIndex + itemsPerPage);

  const getCurrentDateTime = () => {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return `${date} ${time}`;
  };

  // ============================================
  // ✅ CHECK IF USER CAN MANAGE EXPENSES
  // Only Manager or Admin can manage
  // ============================================
  const canManageExpenses = () => {
    return userRole === 'admin' || userRole === 'manager';
  };

  // ============================================
  // ✅ ADD EXPENSE - SEND TO API
  // ============================================
  const handleAddExpense = async () => {
    if (!newExpense.name || !newExpense.amount || !newExpense.dueDate) {
      alert('Please fill all fields');
      return;
    }

    const branch = userBranch ? parseInt(userBranch) : parseInt(newExpense.branch);
    
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/expenses/fixed`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newExpense.name,
          amount: parseInt(newExpense.amount),
          branch_id: branch,
          due_date: newExpense.dueDate,
          paid: false,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || 'Failed to add expense');
        setLoading(false);
        return;
      }

      if (data.success) {
        const newId = expenses.length > 0 ? Math.max(...expenses.map(e => e.id)) + 1 : 1;
        setExpenses([...expenses, {
          id: newId,
          name: newExpense.name,
          amount: parseInt(newExpense.amount),
          branch: branch,
          dueDate: newExpense.dueDate,
          paid: false,
          lastPaid: 'Never',
          history: []
        }]);

        setNewExpense({ name: '', amount: '', branch: 1, dueDate: '' });
        setShowModal(false);
        alert('✅ Fixed expense added successfully!');
      } else {
        alert(data.message || 'Failed to add expense');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Network error. Please try again.');
    }

    setLoading(false);
  };

  // ============================================
  // ✅ EDIT EXPENSE
  // ============================================
  const handleEditExpense = async () => {
    if (!newExpense.name || !newExpense.amount || !newExpense.dueDate) {
      alert('Please fill all fields');
      return;
    }

    const branch = userBranch ? parseInt(userBranch) : parseInt(newExpense.branch);
    
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/expenses/fixed/${editingExpense.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newExpense.name,
          amount: parseInt(newExpense.amount),
          branch_id: branch,
          due_date: newExpense.dueDate,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || 'Failed to update expense');
        setLoading(false);
        return;
      }

      if (data.success) {
        setExpenses(expenses.map(e => {
          if (e.id === editingExpense.id) {
            return {
              ...e,
              name: newExpense.name,
              amount: parseInt(newExpense.amount),
              branch: branch,
              dueDate: newExpense.dueDate,
            };
          }
          return e;
        }));

        setNewExpense({ name: '', amount: '', branch: 1, dueDate: '' });
        setShowModal(false);
        setEditingExpense(null);
        alert('✅ Fixed expense updated successfully!');
      } else {
        alert(data.message || 'Failed to update expense');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Network error. Please try again.');
    }

    setLoading(false);
  };

  // ============================================
  // ✅ PAY EXPENSE
  // ============================================
  const handlePayExpense = async () => {
    if (!payAmount || parseInt(payAmount) <= 0) {
      alert('Please enter valid amount');
      return;
    }

    const dateTime = getCurrentDateTime();
    const amount = parseInt(payAmount);
    
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/expenses/fixed/${selectedExpense.id}/pay`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || 'Failed to pay expense');
        setLoading(false);
        return;
      }

      if (data.success) {
        const newHistory = [
          { date: dateTime, amount: amount, status: 'Paid' },
          ...selectedExpense.history
        ];

        setExpenses(expenses.map(e => {
          if (e.id === selectedExpense.id) {
            return {
              ...e,
              paid: true,
              lastPaid: dateTime,
              history: newHistory,
              amount: amount
            };
          }
          return e;
        }));

        setPayAmount('');
        setShowPayModal(false);
        setSelectedExpense(null);
        alert('✅ Payment recorded successfully!');
      } else {
        alert(data.message || 'Failed to pay expense');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Network error. Please try again.');
    }

    setLoading(false);
  };

  // ============================================
  // ✅ DELETE EXPENSE
  // ============================================
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/expenses/fixed/${id}`, {
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
        setExpenses(expenses.filter(e => e.id !== id));
        alert('✅ Fixed expense deleted successfully!');
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
    if (!canManageExpenses()) {
      alert('Only managers and admins can add expenses');
      return;
    }

    setEditingExpense(null);
    setNewExpense({ 
      name: '', 
      amount: '', 
      branch: userBranch ? parseInt(userBranch) : 1, 
      dueDate: '' 
    });
    setShowModal(true);
  };

  const openEditModal = (expense) => {
    if (!canManageExpenses()) {
      alert('Only managers and admins can edit expenses');
      return;
    }

    setEditingExpense(expense);
    setNewExpense({
      name: expense.name,
      amount: expense.amount.toString(),
      branch: expense.branch,
      dueDate: expense.dueDate,
    });
    setShowModal(true);
  };

  const openPayModal = (expense) => {
    if (!canManageExpenses()) {
      alert('Only managers and admins can pay expenses');
      return;
    }

    setSelectedExpense(expense);
    setPayAmount(expense.amount.toString());
    setShowPayModal(true);
  };

  const openHistoryModal = (expense) => {
    setSelectedExpense(expense);
    setShowHistoryModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingExpense(null);
    setNewExpense({ name: '', amount: '', branch: 1, dueDate: '' });
  };

  const getMonthName = (dateStr) => {
    const date = new Date(dateStr.split(' ')[0]);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const getDateOnly = (dateStr) => {
    return dateStr.split(' ')[0];
  };

  const getTimeOnly = (dateStr) => {
    const parts = dateStr.split(' ');
    return parts.slice(1).join(' ');
  };

  const totalExpenses = filtered.length;
  const totalPaid = filtered.filter(e => e.paid).length;
  const totalPending = filtered.filter(e => !e.paid).length;
  const totalAmount = filtered.reduce((sum, e) => sum + e.amount, 0);

  const branchLabel = userBranch ? `Branch ${userBranch}` : 'All Branches';

  // Colorful stat chips
  const statChips = [
    { 
      label: `${totalExpenses} Expenses`, 
      icon: Building,
      color: '#2563eb',
      bg: 'rgba(37, 99, 235, 0.1)',
      className: 'stat-expenses'
    },
    { 
      label: `${totalPaid} Paid`, 
      icon: CheckCircle,
      color: '#22c55e',
      bg: 'rgba(34, 197, 94, 0.1)',
      className: 'stat-paid'
    },
    { 
      label: `${totalPending} Pending`, 
      icon: AlertCircle,
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.1)',
      className: 'stat-pending'
    },
    { 
      label: `PKR ${totalAmount.toLocaleString()}`, 
      icon: DollarSign,
      color: '#1E1B4B',
      bg: 'rgba(30, 27, 75, 0.08)',
      className: 'stat-total'
    },
  ];

  return (
    <div className="fixed-expense-container">
      <div className="expense-header">
        <div className="header-left">
          <div className="header-title-group">
            <h3>Fixed Expenses</h3>
            <span className="live-badge">
              <Clock size={12} /> Active
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

        {/* ✅ Only show Add button for Manager/Admin */}
        {canManageExpenses() && (
          <button className="btn-accent" onClick={openAddModal}>
            <Plus size={18} />
            Add Fixed Expense
          </button>
        )}
      </div>

      <div className="expense-controls">
        <div className="expense-search">
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
      </div>

      <div className="expense-table-wrap">
        <table className="expense-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Expense Name</th>
              <th>Amount (PKR)</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Last Paid</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length === 0 ? (
              <tr>
                <td colSpan="7" className="no-data">No expenses found for {branchLabel}</td>
              </tr>
            ) : (
              currentItems.map((exp, index) => (
                <tr key={exp.id} className={exp.paid ? 'paid-row' : 'pending-row'}>
                  <td className="text-gray">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                  <td className="expense-name">{exp.name}</td>
                  <td className="amount-cell">PKR {exp.amount.toLocaleString()}</td>
                  <td>
                    <span className="due-date-badge">
                      <Calendar size={12} />
                      {exp.dueDate}
                    </span>
                  </td>
                  <td>
                    <span className={exp.paid ? 'badge-active' : 'badge-pending'}>
                      {exp.paid ? 'Paid' : 'Pending'}
                    </span>
                  </td>
                  <td className="last-paid">{exp.lastPaid || 'Never'}</td>
                  <td>
                    <div className="action-group">
                      <button 
                        className="btn-view" 
                        onClick={() => openHistoryModal(exp)}
                        title="View History"
                      >
                        <Eye size={15} />
                      </button>
                      <button 
                        className="btn-edit" 
                        onClick={() => openEditModal(exp)}
                        title="Edit"
                        disabled={!canManageExpenses()}
                        style={!canManageExpenses() ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                      >
                        <Edit size={15} />
                      </button>
                      {!exp.paid && (
                        <button 
                          className="btn-pay" 
                          onClick={() => openPayModal(exp)}
                          title="Pay Now"
                          disabled={!canManageExpenses()}
                          style={!canManageExpenses() ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                        >
                          <DollarSign size={15} />
                        </button>
                      )}
                      <button 
                        className="btn-delete" 
                        onClick={() => handleDelete(exp.id)}
                        title="Delete"
                        disabled={!canManageExpenses()}
                        style={!canManageExpenses() ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
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
                <CreditCard size={20} className="modal-icon" />
                <h3>{editingExpense ? 'Edit Fixed Expense' : 'Add Fixed Expense'}</h3>
              </div>
              <button className="modal-close" onClick={closeModal}>
                <X size={24} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Expense Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter expense name"
                  value={newExpense.name}
                  onChange={(e) => setNewExpense({ ...newExpense, name: e.target.value })}
                />
              </div>

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

              <div className="form-row">
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

                <div className="form-group">
                  <label>Due Date *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g., 1st of every month"
                    value={newExpense.dueDate}
                    onChange={(e) => setNewExpense({ ...newExpense, dueDate: e.target.value })}
                  />
                </div>
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

      {/* ===== PAY MODAL ===== */}
      {showPayModal && selectedExpense && (
        <div className="modal-overlay" onClick={() => setShowPayModal(false)}>
          <div className="modal-content pay-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-left">
                <DollarSign size={20} className="modal-icon" />
                <h3>Pay - {selectedExpense.name}</h3>
              </div>
              <button className="modal-close" onClick={() => setShowPayModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="modal-body">
              <div className="pay-info">
                <div className="pay-info-row">
                  <span>Expense</span>
                  <strong>{selectedExpense.name}</strong>
                </div>
                <div className="pay-info-row">
                  <span>Original Amount</span>
                  <strong>PKR {selectedExpense.amount.toLocaleString()}</strong>
                </div>
                <div className="pay-info-row">
                  <span>Due Date</span>
                  <strong>{selectedExpense.dueDate}</strong>
                </div>
              </div>

              <div className="form-group">
                <label>Pay Amount (PKR) *</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="Enter amount"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  min="1"
                />
              </div>

              <div className="pay-note">
                <Clock size={16} className="pay-icon" />
                <p>This payment will be recorded with current date & time</p>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowPayModal(false)} style={{ fontWeight: 700 }}>
                Cancel
              </button>
              <button 
                className="btn-pay-save" 
                onClick={handlePayExpense}
                style={{ fontWeight: 700 }}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== HISTORY MODAL ===== */}
      {showHistoryModal && selectedExpense && (
        <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="modal-content history-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-left">
                <Clock size={20} className="modal-icon" />
                <h3>Payment History - {selectedExpense.name}</h3>
              </div>
              <button className="modal-close" onClick={() => setShowHistoryModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="modal-body">
              <div className="history-summary">
                <div className="summary-item" style={{ background: 'rgba(30, 27, 75, 0.06)', borderRadius: '0.75rem' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>Total Paid</span>
                  <strong style={{ fontSize: '1.1rem', color: '#1E1B4B' }}>
                    PKR {selectedExpense.history.reduce((sum, h) => sum + h.amount, 0).toLocaleString()}
                  </strong>
                </div>
                <div className="summary-item" style={{ background: 'rgba(37, 99, 235, 0.08)', borderRadius: '0.75rem' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>Total Payments</span>
                  <strong style={{ fontSize: '1.1rem', color: '#2563eb' }}>{selectedExpense.history.length}</strong>
                </div>
                <div className="summary-item" style={{ background: selectedExpense.paid ? 'rgba(34, 197, 94, 0.08)' : 'rgba(245, 158, 11, 0.08)', borderRadius: '0.75rem' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>Status</span>
                  <strong className={selectedExpense.paid ? 'text-green' : 'text-yellow'} style={{ fontSize: '1.1rem' }}>
                    {selectedExpense.paid ? 'Paid' : 'Pending'}
                  </strong>
                </div>
              </div>

              <div className="history-list">
                <div className="history-list-header">
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Payment History</h4>
                  <span className="history-count" style={{ fontWeight: 600 }}>{selectedExpense.history.length} entries</span>
                </div>
                {selectedExpense.history.length === 0 ? (
                  <p className="no-history">No payment history found</p>
                ) : (
                  selectedExpense.history.map((item, index) => (
                    <div key={index} className="history-item">
                      <div className="history-left">
                        <span className="history-date" style={{ fontWeight: 700 }}>{getMonthName(item.date)}</span>
                        <span className="history-date-full">
                          {getDateOnly(item.date)} • {getTimeOnly(item.date)}
                        </span>
                      </div>
                      <div className="history-center">
                        <span className="history-amount" style={{ fontWeight: 800, fontSize: '1rem' }}>
                          PKR {item.amount.toLocaleString()}
                        </span>
                      </div>
                      <div className="history-right">
                        <span className="history-status paid" style={{ fontWeight: 700 }}>
                          <CheckCircle size={12} />
                          Paid
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowHistoryModal(false)} style={{ fontWeight: 700 }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FixedExpense;