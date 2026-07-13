import React, { useState, useEffect } from 'react';
import { Search, Eye, Edit, DollarSign, RefreshCw, X, Wallet, Users, Calendar, Clock, Award, Building, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import './Salary.css';

const Salary = () => {
  const [search, setSearch] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [advanceReason, setAdvanceReason] = useState('');
  const [userBranch, setUserBranch] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setUserRole(user.role);
      setUserBranch(user.branch);
    }
  }, []);

  const [employees, setEmployees] = useState([
    { 
      id: 1, 
      name: 'Ahmed Khan', 
      branch: 1, 
      salary: 45000, 
      commission: 12000,
      paid: true,
      lastPaid: '2026-06-01',
      totalAdvances: 13000,
      accountCount: 6,
      history: [
        { date: '2026-06-01 10:30 AM', amount: 45000, status: 'Paid', type: 'salary' },
        { date: '2026-06-01 10:30 AM', amount: 12000, status: 'Paid', type: 'commission' },
        { date: '2026-05-01 09:15 AM', amount: 45000, status: 'Paid', type: 'salary' },
        { date: '2026-04-01 11:00 AM', amount: 45000, status: 'Paid', type: 'salary' },
      ],
      advances: [
        { date: '2026-06-15 02:30 PM', amount: 5000, reason: 'Emergency' },
        { date: '2026-06-10 11:20 AM', amount: 3000, reason: 'Medical' },
        { date: '2026-05-25 03:45 PM', amount: 5000, reason: 'Home Repair' },
      ]
    },
    { 
      id: 2, 
      name: 'Sara Ali', 
      branch: 2, 
      salary: 38000, 
      commission: 4000,
      paid: false,
      lastPaid: '2026-05-01',
      totalAdvances: 2000,
      accountCount: 2,
      history: [
        { date: '2026-05-01 09:30 AM', amount: 38000, status: 'Paid', type: 'salary' },
        { date: '2026-04-01 10:45 AM', amount: 38000, status: 'Paid', type: 'salary' },
      ],
      advances: [
        { date: '2026-06-10 03:45 PM', amount: 2000, reason: 'Personal' },
      ]
    },
    { 
      id: 3, 
      name: 'Usman Malik', 
      branch: 1, 
      salary: 52000, 
      commission: 0,
      paid: true,
      lastPaid: '2026-06-01',
      totalAdvances: 0,
      accountCount: 0,
      history: [
        { date: '2026-06-01 08:45 AM', amount: 52000, status: 'Paid', type: 'salary' },
        { date: '2026-05-01 09:20 AM', amount: 52000, status: 'Paid', type: 'salary' },
        { date: '2026-04-01 10:10 AM', amount: 52000, status: 'Paid', type: 'salary' },
        { date: '2026-03-01 11:30 AM', amount: 52000, status: 'Paid', type: 'salary' },
      ],
      advances: []
    },
    { 
      id: 4, 
      name: 'Fatima Noor', 
      branch: 2, 
      salary: 41000, 
      commission: 2000,
      paid: false,
      lastPaid: '2026-04-01',
      totalAdvances: 500,
      accountCount: 1,
      history: [
        { date: '2026-04-01 09:00 AM', amount: 41000, status: 'Paid', type: 'salary' },
      ],
      advances: [
        { date: '2026-06-05 11:20 AM', amount: 500, reason: 'Transport' },
      ]
    },
  ]);

  const filtered = employees.filter(e => {
    const searchMatch = e.name.toLowerCase().includes(search.toLowerCase());
    let branchMatch = true;
    if (userBranch) {
      branchMatch = e.branch === parseInt(userBranch);
    }
    return searchMatch && branchMatch;
  });

  const getCurrentDateTime = () => {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return `${date} ${time}`;
  };

  const handlePayNow = (id) => {
    const dateTime = getCurrentDateTime();
    setEmployees(employees.map(emp => {
      if (emp.id === id) {
        const finalSalary = emp.salary - emp.totalAdvances;
        const finalTotal = finalSalary + emp.commission;
        const newHistory = [
          { date: dateTime, amount: finalSalary, status: 'Paid', type: 'salary', advanceDeducted: emp.totalAdvances },
          ...(emp.commission > 0 ? [{ date: dateTime, amount: emp.commission, status: 'Paid', type: 'commission' }] : []),
          ...emp.history
        ];
        return { 
          ...emp, 
          paid: true, 
          lastPaid: dateTime,
          history: newHistory,
          totalAdvances: 0
        };
      }
      return emp;
    }));
  };

  const handleAddAdvance = (id) => {
    if (!advanceAmount || parseInt(advanceAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    const amount = parseInt(advanceAmount);
    const dateTime = getCurrentDateTime();
    const reason = advanceReason.trim() || 'No reason provided';

    setEmployees(employees.map(emp => {
      if (emp.id === id) {
        const newAdvances = [
          { date: dateTime, amount: amount, reason: reason },
          ...emp.advances
        ];
        return { 
          ...emp, 
          totalAdvances: emp.totalAdvances + amount,
          advances: newAdvances
        };
      }
      return emp;
    }));

    setAdvanceAmount('');
    setAdvanceReason('');
    setShowAdvanceModal(false);
  };

  const handleReset = (id) => {
    if (window.confirm('Reset this employee\'s salary for this month?')) {
      setEmployees(employees.map(emp => {
        if (emp.id === id) {
          return { ...emp, paid: false };
        }
        return emp;
      }));
    }
  };

  const handleEditSalary = (id, newSalary) => {
    setEmployees(employees.map(emp => {
      if (emp.id === id) {
        return { ...emp, salary: parseInt(newSalary) };
      }
      return emp;
    }));
    setShowEditModal(false);
    setEditingEmployee(null);
  };

  const handleEditCommission = (id, newCommission) => {
    setEmployees(employees.map(emp => {
      if (emp.id === id) {
        return { ...emp, commission: parseInt(newCommission) };
      }
      return emp;
    }));
    setShowEditModal(false);
    setEditingEmployee(null);
  };

  const handleViewHistory = (emp) => {
    setSelectedEmployee(emp);
    setShowHistoryModal(true);
  };

  const openEditModal = (emp) => {
    setEditingEmployee(emp);
    setShowEditModal(true);
  };

  const openAdvanceModal = (emp) => {
    setSelectedEmployee(emp);
    setAdvanceAmount('');
    setAdvanceReason('');
    setShowAdvanceModal(true);
  };

  const getDateOnly = (dateStr) => {
    return dateStr.split(' ')[0];
  };

  const getTimeOnly = (dateStr) => {
    const parts = dateStr.split(' ');
    return parts.slice(1).join(' ');
  };

  const getMonthName = (dateStr) => {
    const date = new Date(dateStr.split(' ')[0]);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const totalSalary = filtered.reduce((sum, e) => sum + e.salary, 0);
  const totalCommission = filtered.reduce((sum, e) => sum + e.commission, 0);
  const totalPaid = filtered.filter(e => e.paid).length;
  const totalPending = filtered.filter(e => !e.paid).length;
  const totalEmployees = filtered.length;

  const branchLabel = userBranch ? `Branch ${userBranch}` : 'All Branches';

  // Colorful stat chips
  const statChips = [
    { 
      label: `${totalEmployees} Employees`, 
      icon: Users,
      color: '#2563eb',
      bg: 'rgba(37, 99, 235, 0.1)',
      className: 'stat-employees'
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
      label: `PKR ${totalSalary.toLocaleString()}`, 
      icon: DollarSign,
      color: '#1E1B4B',
      bg: 'rgba(30, 27, 75, 0.08)',
      className: 'stat-salary'
    },
    { 
      label: `PKR ${totalCommission.toLocaleString()}`, 
      icon: Award,
      color: '#8B5CF6',
      bg: 'rgba(139, 92, 246, 0.1)',
      className: 'stat-commission'
    },
  ];

  return (
    <div className="salary-container">
      <div className="salary-header">
        <div className="header-left">
          <div className="header-title-group">
            <h3>Employee Salary Management</h3>
            <span className="live-badge">
              <TrendingUp size={12} /> Active
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
                borderColor: chip.color + '30'
              }}
            >
              <chip.icon size={14} style={{ color: chip.color }} />
              {chip.label}
            </span>
          ))}
        </div>
      </div>

      <div className="salary-search">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          placeholder="Search employee..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="salary-table-wrap">
        <table className="salary-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Salary</th>
              <th>Commission</th>
              <th>Accounts</th>
              <th>Advances</th>
              <th>Status</th>
              <th>Last Paid</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="8" className="no-data">No employees found for {branchLabel}</td>
              </tr>
            ) : (
              filtered.map(emp => (
                <tr key={emp.id} className={emp.paid ? 'paid-row' : 'pending-row'}>
                  <td>
                    <div className="employee-name-cell">
                      <div className="emp-avatar" style={{ background: emp.paid ? '#d1fae5' : '#fef3c7', color: emp.paid ? '#065f46' : '#92400e' }}>
                        {emp.name.charAt(0)}
                      </div>
                      {emp.name}
                    </div>
                  </td>
                  <td className="salary-amount" style={{ color: '#1E1B4B', fontWeight: 800 }}>
                    PKR {emp.salary.toLocaleString()}
                  </td>
                  <td>
                    {emp.commission > 0 ? (
                      <span className="commission-badge" style={{ background: '#dbeafe', color: '#1e40af', fontWeight: 700 }}>
                        PKR {emp.commission.toLocaleString()}
                      </span>
                    ) : (
                      <span className="no-value">—</span>
                    )}
                  </td>
                  <td>
                    <span className="account-badge" style={{ background: '#f3e8ff', color: '#6b21a8', fontWeight: 700 }}>
                      {emp.accountCount}
                    </span>
                  </td>
                  <td>
                    {emp.totalAdvances > 0 ? (
                      <span className="advance-badge" style={{ background: '#fef3c7', color: '#92400e', fontWeight: 700 }}>
                        PKR {emp.totalAdvances.toLocaleString()}
                      </span>
                    ) : (
                      <span className="no-value">—</span>
                    )}
                  </td>
                  <td>
                    <span className={emp.paid ? 'badge-active' : 'badge-pending'} style={{ fontWeight: 700 }}>
                      {emp.paid ? 'Paid' : 'Pending'}
                    </span>
                  </td>
                  <td className="last-paid" style={{ fontWeight: 600 }}>{emp.lastPaid || 'Never'}</td>
                  <td>
                    <div className="action-group">
                      <button className="btn-view" onClick={() => handleViewHistory(emp)} title="View History">
                        <Eye size={15} />
                      </button>
                      <button className="btn-edit" onClick={() => openEditModal(emp)} title="Edit Salary">
                        <Edit size={15} />
                      </button>
                      <button className="btn-advance" onClick={() => openAdvanceModal(emp)} title="Give Advance">
                        <Wallet size={15} />
                      </button>
                      {emp.paid ? (
                        <button className="btn-reset" onClick={() => handleReset(emp.id)} title="Reset">
                          <RefreshCw size={15} />
                        </button>
                      ) : (
                        <button className="btn-pay" onClick={() => handlePayNow(emp.id)} title="Pay Now">
                          <DollarSign size={15} />
                          Pay
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ===== HISTORY MODAL (full screen) ===== */}
      {showHistoryModal && selectedEmployee && (
        <div className="salary-modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="salary-modal-content salary-modal-history" onClick={(e) => e.stopPropagation()}>
            <div className="salary-modal-header">
              <div className="salary-modal-header-left">
                <Clock size={20} className="salary-modal-icon" />
                <h3 style={{ fontSize: '1.3rem' }}>Salary History</h3>
              </div>
              <button className="salary-modal-close" onClick={() => setShowHistoryModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="salary-modal-body">
              <div className="employee-detail-header">
                <div className="emp-detail-avatar" style={{ background: '#1E1B4B', fontSize: '1.1rem' }}>
                  {selectedEmployee.name.charAt(0)}
                </div>
                <div className="emp-detail-info">
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{selectedEmployee.name}</h4>
                  <span className="emp-detail-branch" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                    Branch {selectedEmployee.branch} • {selectedEmployee.accountCount} Accounts
                  </span>
                </div>
              </div>

              <div className="history-summary">
                <div className="summary-item" style={{ background: 'rgba(30, 27, 75, 0.06)', borderRadius: '0.75rem' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>Salary</span>
                  <strong style={{ fontSize: '1.1rem', color: '#1E1B4B' }}>PKR {selectedEmployee.salary.toLocaleString()}</strong>
                </div>
                <div className="summary-item" style={{ background: 'rgba(139, 92, 246, 0.08)', borderRadius: '0.75rem' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>Commission</span>
                  <strong style={{ fontSize: '1.1rem', color: '#8B5CF6' }}>PKR {selectedEmployee.commission.toLocaleString()}</strong>
                </div>
                <div className="summary-item" style={{ background: 'rgba(34, 197, 94, 0.08)', borderRadius: '0.75rem' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>Total Paid</span>
                  <strong style={{ fontSize: '1.1rem', color: '#22c55e' }}>PKR {selectedEmployee.history.reduce((sum, h) => sum + h.amount, 0).toLocaleString()}</strong>
                </div>
              </div>

              {selectedEmployee.advances.length > 0 && (
                <div className="advances-section">
                  <div className="advances-header">
                    <Wallet size={16} style={{ color: '#92400e' }} />
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#92400e' }}>Salary Advances</h4>
                    <span className="advances-total" style={{ fontWeight: 700 }}>Total: PKR {selectedEmployee.totalAdvances.toLocaleString()}</span>
                  </div>
                  <div className="advances-table-wrap">
                    <table className="advances-table">
                      <thead>
                        <tr>
                          <th style={{ fontSize: '0.7rem', fontWeight: 700 }}>Date & Time</th>
                          <th style={{ fontSize: '0.7rem', fontWeight: 700 }}>Amount</th>
                          <th style={{ fontSize: '0.7rem', fontWeight: 700 }}>Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedEmployee.advances.map((item, index) => (
                          <tr key={index}>
                            <td>
                              <div className="advance-date-time">
                                <span className="adv-date" style={{ fontWeight: 600 }}>{getDateOnly(item.date)}</span>
                                <span className="adv-time" style={{ fontSize: '0.6rem' }}>{getTimeOnly(item.date)}</span>
                              </div>
                            </td>
                            <td className="advance-amount-cell" style={{ color: '#dc2626', fontWeight: 700 }}>-PKR {item.amount.toLocaleString()}</td>
                            <td className="advance-reason-cell" style={{ fontWeight: 500 }}>{item.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="remaining-salary" style={{ fontWeight: 700 }}>
                    <span style={{ fontSize: '0.9rem' }}>Remaining Salary </span>
                    <strong style={{ fontSize: '1.1rem', color: '#1E1B4B' }}>PKR {(selectedEmployee.salary - selectedEmployee.totalAdvances).toLocaleString()}</strong>
                  </div>
                </div>
              )}

              <div className="history-list">
                <div className="history-list-header">
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Payment History</h4>
                  <span className="history-count" style={{ fontWeight: 600 }}>{selectedEmployee.history.length} entries</span>
                </div>
                {selectedEmployee.history.length === 0 ? (
                  <p className="no-history">No payment history found</p>
                ) : (
                  selectedEmployee.history.map((item, index) => (
                    <div key={index} className="history-item">
                      <div className="history-left">
                        <span className="history-date" style={{ fontWeight: 700 }}>{getMonthName(item.date)}</span>
                        <span className="history-date-full">{getDateOnly(item.date)} • {getTimeOnly(item.date)}</span>
                      </div>
                      <div className="history-center">
                        <span className="history-amount" style={{ fontWeight: 800, fontSize: '1rem' }}>PKR {item.amount.toLocaleString()}</span>
                        {item.advanceDeducted && item.advanceDeducted > 0 && (
                          <span className="deducted-badge" style={{ fontWeight: 700 }}>-PKR {item.advanceDeducted} advance</span>
                        )}
                      </div>
                      <div className="history-right">
                        <span className={`history-status ${item.type === 'commission' ? 'commission' : 'paid'}`} style={{ fontWeight: 700 }}>
                          {item.type === 'commission' ? 'Commission' : 'Paid'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="salary-modal-footer">
              <button className="btn-cancel" onClick={() => setShowHistoryModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== ADVANCE MODAL (full screen) ===== */}
      {showAdvanceModal && selectedEmployee && (
        <div className="salary-modal-overlay" onClick={() => setShowAdvanceModal(false)}>
          <div className="salary-modal-content salary-modal-advance" onClick={(e) => e.stopPropagation()}>
            <div className="salary-modal-header">
              <div className="salary-modal-header-left">
                <Wallet size={20} className="salary-modal-icon" />
                <h3 style={{ fontSize: '1.3rem' }}>Give Advance</h3>
              </div>
              <button className="salary-modal-close" onClick={() => setShowAdvanceModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="salary-modal-body">
              <div className="employee-detail-header small">
                <div className="emp-detail-avatar small" style={{ background: '#1E1B4B' }}>
                  {selectedEmployee.name.charAt(0)}
                </div>
                <div className="emp-detail-info">
                  <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{selectedEmployee.name}</h4>
                  <span className="emp-detail-branch" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Branch {selectedEmployee.branch}</span>
                </div>
              </div>

              <div className="advance-info-box">
                <div className="advance-info-row" style={{ fontWeight: 600 }}>
                  <span>Salary</span>
                  <strong style={{ color: '#1E1B4B' }}>PKR {selectedEmployee.salary.toLocaleString()}</strong>
                </div>
                <div className="advance-info-row" style={{ fontWeight: 600 }}>
                  <span>Commission</span>
                  <strong className="commission-highlight" style={{ color: '#8B5CF6' }}>PKR {selectedEmployee.commission.toLocaleString()}</strong>
                </div>
                <div className="advance-info-row" style={{ fontWeight: 600 }}>
                  <span>Advances Taken</span>
                  <strong className="advance-taken" style={{ color: '#dc2626' }}>PKR {selectedEmployee.totalAdvances.toLocaleString()}</strong>
                </div>
                <div className="advance-info-row highlight" style={{ fontWeight: 700, borderTop: '2px solid #1E1B4B', paddingTop: '0.5rem' }}>
                  <span style={{ fontSize: '1rem' }}>Remaining</span>
                  <strong className="remaining-amount" style={{ fontSize: '1.2rem', color: '#1E1B4B' }}>PKR {(selectedEmployee.salary - selectedEmployee.totalAdvances).toLocaleString()}</strong>
                </div>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.9rem', fontWeight: 700 }}>Advance Amount (PKR) *</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="Enter amount"
                  value={advanceAmount}
                  onChange={(e) => setAdvanceAmount(e.target.value)}
                  min="1"
                  max={selectedEmployee.salary - selectedEmployee.totalAdvances}
                  style={{ fontSize: '1rem', fontWeight: 600 }}
                />
                <small className="field-hint" style={{ fontWeight: 600 }}>Max: PKR {(selectedEmployee.salary - selectedEmployee.totalAdvances).toLocaleString()}</small>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.9rem', fontWeight: 700 }}>Reason</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter reason..."
                  value={advanceReason}
                  onChange={(e) => setAdvanceReason(e.target.value)}
                  style={{ fontSize: '1rem', fontWeight: 500 }}
                />
                <small className="field-hint" style={{ fontWeight: 600 }}>e.g., Emergency, Medical, Home Repair</small>
              </div>

              <div className="advance-note-box">
                <Clock size={16} className="advance-icon" />
                <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>This amount will be deducted from next salary payment</p>
              </div>
            </div>

            <div className="salary-modal-footer">
              <button className="btn-cancel" onClick={() => setShowAdvanceModal(false)}>Cancel</button>
              <button className="btn-advance-save" onClick={() => handleAddAdvance(selectedEmployee.id)}>
                Give Advance
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== EDIT MODAL (full screen) ===== */}
      {showEditModal && editingEmployee && (
        <div className="salary-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="salary-modal-content salary-modal-edit" onClick={(e) => e.stopPropagation()}>
            <div className="salary-modal-header">
              <div className="salary-modal-header-left">
                <Edit size={20} className="salary-modal-icon" />
                <h3 style={{ fontSize: '1.3rem' }}>Edit Salary</h3>
              </div>
              <button className="salary-modal-close" onClick={() => setShowEditModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="salary-modal-body">
              <div className="employee-detail-header small">
                <div className="emp-detail-avatar small" style={{ background: '#1E1B4B' }}>
                  {editingEmployee.name.charAt(0)}
                </div>
                <div className="emp-detail-info">
                  <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{editingEmployee.name}</h4>
                  <span className="emp-detail-branch" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Branch {editingEmployee.branch}</span>
                </div>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.9rem', fontWeight: 700 }}>Salary (PKR)</label>
                <input
                  type="number"
                  className="form-input"
                  defaultValue={editingEmployee.salary}
                  id="editSalaryInput"
                  style={{ fontSize: '1rem', fontWeight: 600 }}
                />
              </div>
              <div className="form-group">
                <label style={{ fontSize: '0.9rem', fontWeight: 700 }}>Commission (PKR)</label>
                <input
                  type="number"
                  className="form-input"
                  defaultValue={editingEmployee.commission}
                  id="editCommissionInput"
                  style={{ fontSize: '1rem', fontWeight: 600 }}
                />
                <small className="field-hint" style={{ fontWeight: 600 }}>{editingEmployee.accountCount} accounts × 2,000 = {editingEmployee.accountCount * 2000}</small>
              </div>
            </div>

            <div className="salary-modal-footer">
              <button className="btn-cancel" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button 
                className="btn-save" 
                onClick={() => {
                  const salaryInput = document.getElementById('editSalaryInput');
                  const commissionInput = document.getElementById('editCommissionInput');
                  const newSalary = salaryInput.value;
                  const newCommission = commissionInput.value;
                  if (newSalary && parseInt(newSalary) > 0) {
                    handleEditSalary(editingEmployee.id, newSalary);
                  }
                  if (newCommission && parseInt(newCommission) >= 0) {
                    handleEditCommission(editingEmployee.id, newCommission);
                  }
                }}
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Salary;