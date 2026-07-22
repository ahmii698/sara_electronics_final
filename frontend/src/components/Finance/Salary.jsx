import React, { useState, useEffect } from 'react';
import { Search, Eye, Edit, DollarSign, RefreshCw, X, Wallet, Users, Calendar, Clock, Award, Building, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import './Salary.css';
import { API_URL } from '../../../config';

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
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [salaryData, setSalaryData] = useState([]);
  const [advanceData, setAdvanceData] = useState([]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setUserRole(user.role);
      setUserBranch(user.branch);
    }
    fetchAllData();
  }, []);

  // ============================================
  // ✅ FETCH ALL DATA FROM API
  // ============================================
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const empRes = await fetch(`${API_URL}/users?role=employee`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const empData = await empRes.json();
      
      const salRes = await fetch(`${API_URL}/salary`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const salData = await salRes.json();
      
      const advRes = await fetch(`${API_URL}/salary/advances`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const advData = await advRes.json();

      if (empData.success) {
        const mergedEmployees = empData.data.data.map(emp => {
          const salary = salData.success ? salData.data.find(s => s.user_id === emp.id) : null;
          const advances = advData.success ? advData.data.filter(a => a.user_id === emp.id) : [];
          
          const totalAdvances = advances
            .filter(a => !a.deducted)
            .reduce((sum, a) => sum + parseFloat(a.amount), 0);
          
          const deductedAdvances = advances
            .filter(a => a.deducted)
            .reduce((sum, a) => sum + parseFloat(a.amount), 0);

          return {
            id: emp.id,
            name: emp.name,
            branch: emp.branch_id,
            salary: parseFloat(emp.salary) || 0,
            commission: salary ? parseFloat(salary.commission) || 0 : 0,
            paid: salary ? salary.status === 'paid' : false,
            lastPaid: salary ? salary.paid_date : 'Never',
            totalAdvances: totalAdvances,
            deductedAdvances: deductedAdvances,
            accountCount: emp.accounts_count || 0,
            history: salary ? [{
              date: salary.paid_date || '2026-06-01',
              amount: salary.total_paid || 0,
              status: 'Paid',
              type: 'salary'
            }] : [],
            advances: advances.map(a => ({
              date: a.date,
              amount: a.amount,
              reason: a.reason,
              deducted: a.deducted
            })),
            salaryRecord: salary,
            currentMonth: new Date().toISOString().slice(0, 7)
          };
        });

        setEmployees(mergedEmployees);
        setSalaryData(salData.success ? salData.data : []);
        setAdvanceData(advData.success ? advData.data : []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setLoading(false);
  };

  const canManageSalary = () => {
    return userRole === 'admin' || userRole === 'manager';
  };

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

  // ✅ Format date to YYYY-MM-DD only
  const formatLastPaid = (dateStr) => {
    if (!dateStr) return 'Never';
    if (dateStr === 'Never') return 'Never';
    const parts = dateStr.split('T');
    if (parts.length > 1) {
      return parts[0];
    }
    return dateStr;
  };

  const handlePayNow = async (id) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const emp = employees.find(e => e.id === id);
      
      const month = new Date().toISOString().slice(0, 7);
      let salaryRecord = salaryData.find(s => s.user_id === id && s.month === month);
      
      let response;
      if (salaryRecord) {
        response = await fetch(`${API_URL}/salary/${salaryRecord.id}/pay`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      } else {
        const finalSalary = emp.salary - emp.totalAdvances;
        const totalPaid = finalSalary + emp.commission;
        
        response = await fetch(`${API_URL}/salary`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            user_id: id,
            month: month,
            salary_amount: emp.salary,
            commission: emp.commission,
            advances: emp.totalAdvances,
            total_paid: totalPaid,
            status: 'paid',
            paid_date: new Date().toISOString().slice(0, 10)
          })
        });
      }

      const data = await response.json();
      
      if (data.success) {
        const advancesToDeduct = advanceData.filter(a => a.user_id === id && !a.deducted);
        for (const adv of advancesToDeduct) {
          await fetch(`${API_URL}/salary/advances/${adv.id}/deduct`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
        }

        await fetchAllData();
        alert('✅ Salary paid successfully!');
      } else {
        alert(data.message || 'Failed to pay salary');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Network error. Please try again.');
    }
    setLoading(false);
  };

  const handleAddAdvance = async (id) => {
    if (!advanceAmount || parseInt(advanceAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    const amount = parseInt(advanceAmount);
    const reason = advanceReason.trim() || 'No reason provided';
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/salary/advances`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: id,
          amount: amount,
          reason: reason,
          date: new Date().toISOString().slice(0, 19).replace('T', ' ')
        })
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchAllData();
        setAdvanceAmount('');
        setAdvanceReason('');
        setShowAdvanceModal(false);
        alert('✅ Advance added successfully!');
      } else {
        alert(data.message || 'Failed to add advance');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Network error. Please try again.');
    }
    setLoading(false);
  };

  // ============================================
  // ✅ RESET SALARY - COMPLETE RESET FOR NEXT MONTH
  // ============================================
  const handleReset = async (id) => {
    if (!window.confirm('Reset this employee\'s salary for the current month?\n\nThis will:\n• Mark as Pending\n• Remove Paid Date\n• Reset Commission to 0\n• Reset Total Paid to 0')) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const month = new Date().toISOString().slice(0, 7);
      const salaryRecord = salaryData.find(s => s.user_id === id && s.month === month);
      
      if (salaryRecord) {
        // ✅ COMPLETE RESET - All fields reset
        const response = await fetch(`${API_URL}/salary/${salaryRecord.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: 'pending',
            paid_date: null,
            commission: 0,
            total_paid: 0,
            leave_count: 0,
            advances: 0
          })
        });
        
        const data = await response.json();
        if (data.success) {
          await fetchAllData();
          alert('✅ Salary reset successfully! Employee is now pending for the new month.');
        } else {
          alert(data.message || 'Failed to reset salary');
        }
      } else {
        alert('No salary record found for this month.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Network error. Please try again.');
    }
    setLoading(false);
  };

  const handleEditSalary = async (id, newSalary) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/users/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          salary: newSalary
        })
      });

      const data = await response.json();
      if (data.success) {
        await fetchAllData();
        alert('✅ Salary updated successfully!');
      } else {
        alert(data.message || 'Failed to update salary');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Network error. Please try again.');
    }
    setLoading(false);
    setShowEditModal(false);
    setEditingEmployee(null);
  };

  const handleEditCommission = async (id, newCommission) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const month = new Date().toISOString().slice(0, 7);
      
      let salaryRecord = salaryData.find(s => s.user_id === id && s.month === month);
      
      let response;
      if (salaryRecord) {
        response = await fetch(`${API_URL}/salary/${salaryRecord.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            commission: newCommission
          })
        });
      } else {
        const emp = employees.find(e => e.id === id);
        response = await fetch(`${API_URL}/salary`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            user_id: id,
            month: month,
            salary_amount: emp.salary,
            commission: newCommission,
            advances: 0,
            total_paid: 0,
            status: 'pending'
          })
        });
      }

      const data = await response.json();
      if (data.success) {
        await fetchAllData();
        alert('✅ Commission updated successfully!');
      } else {
        alert(data.message || 'Failed to update commission');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Network error. Please try again.');
    }
    setLoading(false);
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
    if (!dateStr) return '';
    return dateStr.split(' ')[0];
  };

  const getTimeOnly = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split(' ');
    return parts.slice(1).join(' ');
  };

  const getMonthName = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr.split(' ')[0]);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const totalSalary = filtered.reduce((sum, e) => sum + e.salary, 0);
  const totalCommission = filtered.reduce((sum, e) => sum + e.commission, 0);
  const totalPaid = filtered.filter(e => e.paid).length;
  const totalPending = filtered.filter(e => !e.paid).length;
  const totalEmployees = filtered.length;

  const branchLabel = userBranch ? `Branch ${userBranch}` : 'All Branches';

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
              <th>Balance (PKR)</th>
              <th>Status</th>
              <th>Last Paid</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="9" className="no-data">No employees found for {branchLabel}</td>
              </tr>
            ) : (
              filtered.map(emp => {
                const balance = emp.salary + emp.commission - emp.totalAdvances;
                
                return (
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
                        {emp.accountCount || 0}
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
                    <td className="balance-amount" style={{ fontWeight: 800, color: balance > 0 ? '#1E1B4B' : '#dc2626' }}>
                      PKR {balance.toLocaleString()}
                    </td>
                    <td>
                      <span className={emp.paid ? 'badge-active' : 'badge-pending'} style={{ fontWeight: 700 }}>
                        {emp.paid ? 'Paid' : 'Pending'}
                      </span>
                    </td>
                    <td className="last-paid" style={{ fontWeight: 600 }}>
                      {formatLastPaid(emp.lastPaid)}
                    </td>
                    <td>
                      <div className="action-group">
                        <button className="btn-view" onClick={() => handleViewHistory(emp)} title="View History">
                          <Eye size={15} />
                        </button>
                        {canManageSalary() && (
                          <>
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
                              <button className="btn-pay" onClick={() => handlePayNow(emp.id)} title="Pay Now" disabled={loading}>
                                <DollarSign size={15} />
                                Pay
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ===== HISTORY MODAL ===== */}
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
                  <strong style={{ fontSize: '1.1rem', color: '#22c55e' }}>
                    PKR {(
                      selectedEmployee.salary + 
                      selectedEmployee.commission - 
                      selectedEmployee.totalAdvances
                    ).toLocaleString()}
                  </strong>
                </div>
              </div>

              {selectedEmployee.advances.filter(a => !a.deducted).length > 0 && (
                <div className="advances-section">
                  <div className="advances-header">
                    <Wallet size={16} style={{ color: '#92400e' }} />
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#92400e' }}>Salary Advances</h4>
                    <span className="advances-total" style={{ fontWeight: 700 }}>
                      Total: PKR {selectedEmployee.totalAdvances.toLocaleString()}
                    </span>
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
                        {selectedEmployee.advances.filter(a => !a.deducted).map((item, index) => (
                          <tr key={index}>
                            <td>
                              <div className="advance-date-time">
                                <span className="adv-date" style={{ fontWeight: 600 }}>{getDateOnly(item.date)}</span>
                                <span className="adv-time" style={{ fontSize: '0.6rem' }}>{getTimeOnly(item.date)}</span>
                              </div>
                            </td>
                            <td className="advance-amount-cell" style={{ color: '#dc2626', fontWeight: 700 }}>
                              -PKR {item.amount.toLocaleString()}
                            </td>
                            <td className="advance-reason-cell" style={{ fontWeight: 500 }}>{item.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="remaining-salary" style={{ fontWeight: 700 }}>
                    <span style={{ fontSize: '0.9rem' }}>Remaining Salary </span>
                    <strong style={{ fontSize: '1.1rem', color: '#1E1B4B' }}>
                      PKR {(selectedEmployee.salary - selectedEmployee.totalAdvances).toLocaleString()}
                    </strong>
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
                        <span className="history-amount" style={{ fontWeight: 800, fontSize: '1rem' }}>
                          PKR {item.amount.toLocaleString()}
                        </span>
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

      {/* ===== ADVANCE MODAL ===== */}
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
                  <strong className="commission-highlight" style={{ color: '#8B5CF6' }}>
                    PKR {selectedEmployee.commission.toLocaleString()}
                  </strong>
                </div>
                <div className="advance-info-row" style={{ fontWeight: 600 }}>
                  <span>Advances Taken</span>
                  <strong className="advance-taken" style={{ color: '#dc2626' }}>
                    PKR {selectedEmployee.totalAdvances.toLocaleString()}
                  </strong>
                </div>
                <div className="advance-info-row highlight" style={{ fontWeight: 700, borderTop: '2px solid #1E1B4B', paddingTop: '0.5rem' }}>
                  <span style={{ fontSize: '1rem' }}>Remaining</span>
                  <strong className="remaining-amount" style={{ fontSize: '1.2rem', color: '#1E1B4B' }}>
                    PKR {(selectedEmployee.salary - selectedEmployee.totalAdvances).toLocaleString()}
                  </strong>
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
                <small className="field-hint" style={{ fontWeight: 600 }}>
                  Max: PKR {(selectedEmployee.salary - selectedEmployee.totalAdvances).toLocaleString()}
                </small>
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
              <button className="btn-advance-save" onClick={() => handleAddAdvance(selectedEmployee.id)} disabled={loading}>
                {loading ? 'Saving...' : 'Give Advance'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== EDIT MODAL ===== */}
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
                <small className="field-hint" style={{ fontWeight: 600 }}>
                  {editingEmployee.accountCount} accounts × 2,000 = {editingEmployee.accountCount * 2000}
                </small>
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
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Salary;