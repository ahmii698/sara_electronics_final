// src/components/EmployeePerformanceReport/EmployeePerformanceReport.jsx

import React, { useState, useEffect } from 'react';
import { Search, User, DollarSign, Users, Calendar, Clock, AlertTriangle, FileText, Eye, X, TrendingUp, ChevronDown } from 'lucide-react';
import './EmployeePerformanceReport.css';
import { API_URL } from '../../../config';

const EmployeePerformanceReport = () => {
  const [search, setSearch] = useState('');
  const [userBranch, setUserBranch] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userId, setUserId] = useState(null);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [activeTab, setActiveTab] = useState('total');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);

  const [loading, setLoading] = useState(true);
  const [employeesList, setEmployeesList] = useState([]);
  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setUserRole(user.role);
      setUserBranch(user.branch);
      setUserId(user.id);
      // Employee khud apna hi data dekhta hai
      if (user.role === 'employee') {
        setSelectedEmployeeId(user.id);
      }
    }
    fetchEmployees();
    fetchAccounts();
  }, []);

  const isEmployee = userRole === 'employee';
  const isAdmin = userRole === 'admin';
  const isManager = userRole === 'manager';
  const canEditRemarks = isAdmin || isManager;

  // ============================================
  // ✅ REAL DATA FETCH
  // ============================================
  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        let list = Array.isArray(data.data) ? data.data
          : (data.data?.data && Array.isArray(data.data.data)) ? data.data.data
          : [];
        // Sirf employee/manager dikhane hain dropdown mein
        list = list.filter(u => u.role === 'employee' || u.role === 'manager');
        setEmployeesList(list);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/accounts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        const raw = data.data.data || data.data || [];
        const mapped = raw.map(acc => {
          const employeeAccount = acc.employee_account || {};
          const employee = employeeAccount.employee || {};
          return {
            id: acc.id,
            caseNo: acc.case_no || 'N/A',
            customer: acc.customer?.name || 'N/A',
            cnic: acc.customer?.cnic || '',
            phone: acc.customer?.phone || '',
            address: acc.customer?.address || '',
            product: acc.product_name || 'N/A',
            amount: parseFloat(acc.total_amount) || 0,
            paid: parseFloat(acc.paid_amount) || 0,
            balance: parseFloat(acc.balance) || 0,
            monthly: parseFloat(acc.monthly_installment) || 0,
            date: acc.created_at ? acc.created_at.split('T')[0] : null,
            branch: acc.branch_id || 1,
            // ✅ ye employee ne account khola tha (jiske hisaab se performance track karni hai)
            employeeId: employee.id || acc.created_by || null,
            employeeName: employee.name || 'N/A',
            guarantors: acc.customer?.guarantors || [],
            installments: acc.installments || []
          };
        });
        setAccounts(mapped);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // ✅ MONTH HELPERS (same logic as Installments.jsx / UsersManagement.jsx)
  // ============================================
  const monthsBetween = (fromMonth, toMonth) => {
    if (!fromMonth || !toMonth) return 0;
    const [fy, fm] = fromMonth.split('-').map(Number);
    const [ty, tm] = toMonth.split('-').map(Number);
    return (ty - fy) * 12 + (tm - fm);
  };

  const getCurrentMonthStr = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  // Ek account "overdue" hai ya nahi — sabse purani due-unpaid installment dekh kar
  const isAccountOverdue = (account) => {
    const list = Array.isArray(account.installments) ? account.installments : [];
    if (list.length === 0) return account.balance > 0; // fallback

    const currentMonthStr = getCurrentMonthStr();
    const dueUnpaid = list.filter(p =>
      parseFloat(p.balance || 0) > 0 &&
      p.month &&
      monthsBetween(p.month, currentMonthStr) >= 0
    );
    return dueUnpaid.length > 0;
  };

  // Is mahine ki installment ka balance (agar is mahine ka record mile)
  const getThisMonthDue = (account) => {
    const list = Array.isArray(account.installments) ? account.installments : [];
    const currentMonthStr = getCurrentMonthStr();
    const thisMonthRecord = list.find(p => p.month === currentMonthStr);
    if (thisMonthRecord) {
      return parseFloat(thisMonthRecord.balance || 0);
    }
    return 0;
  };

  const getFilteredEmployees = () => {
    if (userBranch) {
      return employeesList.filter(emp => parseInt(emp.branch_id || emp.branch) === parseInt(userBranch));
    }
    return employeesList;
  };

  const filteredEmployees = getFilteredEmployees();

  // ============================================
  // ✅ BRANCH SCOPING — sabse pehle sirf apni branch ke accounts nikalo.
  // Admin ho ya Manager, dono ka session-branch (login-time selected) hi
  // yahan decide karti hai konse accounts dikhne hain. Koi role exception
  // nahi — warna "All Employees" select karte hi doosri branch ka data
  // bhi mix ho jata tha.
  // ============================================
  const getBranchScopedAccounts = () => {
    if (userBranch) {
      return accounts.filter(acc => parseInt(acc.branch) === parseInt(userBranch));
    }
    return accounts;
  };

  // ============================================
  // ✅ PER-EMPLOYEE STATS — sirf usi employee ke (aur apni branch ke) accounts se calculate hote hain
  // ============================================
  const getEmployeeAccounts = (employeeId) => {
    const branchScoped = getBranchScopedAccounts();
    if (!employeeId) return branchScoped;
    return branchScoped.filter(acc => parseInt(acc.employeeId) === parseInt(employeeId));
  };

  const getEmployeeStats = (employeeId) => {
    const empAccounts = getEmployeeAccounts(employeeId);

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const totalAccounts = empAccounts.length;

    const newAccounts = empAccounts.filter(acc => {
      if (!acc.date) return false;
      const accDate = new Date(acc.date);
      return accDate.getMonth() === currentMonth && accDate.getFullYear() === currentYear;
    });

    // ✅ Recovery Due = is mahine ka jo paisa abhi tak nahi aaya, un sab accounts ka jama
    const recoveryDue = empAccounts.reduce((sum, acc) => sum + getThisMonthDue(acc), 0);

    // ✅ Overdue = jitne accounts ka koi purana due month abhi tak clear nahi
    const overdueAccounts = empAccounts.filter(acc => isAccountOverdue(acc));

    return {
      totalAccounts,
      newAccountsList: newAccounts,
      recoveryDue,
      overdueList: overdueAccounts,
      accounts: empAccounts
    };
  };

  const selectedEmployeeData = getEmployeeStats(selectedEmployeeId);
  const selectedEmployee = employeesList.find(emp => emp.id === selectedEmployeeId);

  const filteredAccounts = selectedEmployeeData.accounts.filter(item => {
    if (!isEmployee && search) {
      return item.customer.toLowerCase().includes(search.toLowerCase()) ||
        item.caseNo.toLowerCase().includes(search.toLowerCase()) ||
        item.product.toLowerCase().includes(search.toLowerCase());
    }
    return true;
  });

  const openAccountModal = (account) => {
    setSelectedAccount(account);
    setShowAccountModal(true);
  };

  const getEmployeeName = (id) => {
    const emp = employeesList.find(e => e.id === id);
    return emp ? emp.name : 'All Employees';
  };

  // ===== COLORFUL CARDS =====
  const cards = isEmployee ? [
    { 
      key: 'new', 
      label: 'New Accounts (This Month)', 
      value: selectedEmployeeData.newAccountsList.length,
      icon: TrendingUp,
      color: '#2563eb',
      bg: 'rgba(37, 99, 235, 0.12)',
      className: 'new-accounts-card'
    },
    { 
      key: 'recovery', 
      label: 'Recovery Due (This Month)', 
      value: `PKR ${selectedEmployeeData.recoveryDue.toLocaleString()}`,
      icon: DollarSign,
      color: '#C9A84C',
      bg: 'rgba(201, 168, 76, 0.15)',
      className: 'recovery-card'
    },
    { 
      key: 'overdue', 
      label: 'Overdue', 
      value: selectedEmployeeData.overdueList.length,
      icon: AlertTriangle,
      color: '#dc2626',
      bg: 'rgba(220, 38, 38, 0.12)',
      className: 'overdue-card-main'
    },
  ] : [
    { 
      key: 'total', 
      label: 'Total Accounts', 
      value: selectedEmployeeData.totalAccounts,
      icon: Users,
      color: '#1E1B4B',
      bg: 'rgba(30, 27, 75, 0.08)',
      className: 'total-accounts-card'
    },
    { 
      key: 'new', 
      label: 'New Accounts (This Month)', 
      value: selectedEmployeeData.newAccountsList.length,
      icon: TrendingUp,
      color: '#2563eb',
      bg: 'rgba(37, 99, 235, 0.12)',
      className: 'new-accounts-card'
    },
    { 
      key: 'recovery', 
      label: 'Recovery Due (This Month)', 
      value: `PKR ${selectedEmployeeData.recoveryDue.toLocaleString()}`,
      icon: DollarSign,
      color: '#C9A84C',
      bg: 'rgba(201, 168, 76, 0.15)',
      className: 'recovery-card'
    },
    { 
      key: 'overdue', 
      label: 'Overdue', 
      value: selectedEmployeeData.overdueList.length,
      icon: AlertTriangle,
      color: '#dc2626',
      bg: 'rgba(220, 38, 38, 0.12)',
      className: 'overdue-card-main'
    },
  ];

  const getStatusForAccount = (account) => {
    if (account.balance <= 0) return 'paid';
    if (isAccountOverdue(account)) return 'overdue';
    return 'pending';
  };

  const renderTable = () => {
    if (activeTab === 'total' && !isEmployee) {
      return (
        <div className="table-container">
          <div className="table-header">
            <div className="table-header-left">
              <FileText size={18} style={{ color: '#1E1B4B' }} />
              <h3>All Accounts</h3>
              <span className="record-count">{filteredAccounts.length} accounts</span>
            </div>
          </div>
          <div className="table-scroll">
            <table className="accounts-table">
              <thead>
                <tr>
                  <th>Case #</th>
                  <th>Customer</th>
                  <th>Product</th>
                  <th>Amount (PKR)</th>
                  <th>Paid (PKR)</th>
                  <th>Balance (PKR)</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.length === 0 ? (
                  <tr><td colSpan="9" className="no-data">No accounts found</td></tr>
                ) : (
                  filteredAccounts.map((item, index) => {
                    const status = getStatusForAccount(item);
                    return (
                      <tr key={item.id} className={`${status === 'overdue' ? 'overdue-row' : ''} ${index % 2 === 0 ? 'even-row' : 'odd-row'}`}>
                        <td className="case-number">{item.caseNo}</td>
                        <td>
                          <div className="customer-info">
                            <div className="customer-avatar" style={{ background: status === 'paid' ? '#d1fae5' : status === 'overdue' ? '#fee2e2' : '#fef3c7', color: status === 'paid' ? '#065f46' : status === 'overdue' ? '#991b1b' : '#92400e' }}>
                              {item.customer.charAt(0)}
                            </div>
                            {item.customer}
                          </div>
                        </td>
                        <td>{item.product}</td>
                        <td className="amount">PKR {item.amount.toLocaleString()}</td>
                        <td className="paid-amount">PKR {item.paid.toLocaleString()}</td>
                        <td className={item.balance > 0 ? 'balance-amount' : 'paid-amount'}>
                          PKR {item.balance.toLocaleString()}
                        </td>
                        <td>
                          <div className="date-info">
                            <Calendar size={12} />
                            {item.date || '-'}
                          </div>
                        </td>
                        <td>
                          <span className={`status-badge ${status}`}>
                            {status === 'paid' ? 'Paid' : status === 'pending' ? 'Pending' : 'Overdue'}
                          </span>
                        </td>
                        <td>
                          <div className="action-group">
                            <button className="btn-view-account" onClick={() => openAccountModal(item)} title="View Account Details">
                              <Eye size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (activeTab === 'new') {
      const list = selectedEmployeeData.newAccountsList;
      return (
        <div className="table-container">
          <div className="table-header">
            <div className="table-header-left">
              <FileText size={18} style={{ color: '#2563eb' }} />
              <h3>New Accounts (This Month)</h3>
              <span className="record-count">{list.length} accounts</span>
            </div>
          </div>
          <div className="table-scroll">
            <table className="accounts-table">
              <thead>
                <tr>
                  <th>Case #</th>
                  <th>Customer</th>
                  <th>Product</th>
                  <th>Amount (PKR)</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr><td colSpan="7" className="no-data">No new accounts this month</td></tr>
                ) : (
                  list.map((item, index) => {
                    const status = getStatusForAccount(item);
                    return (
                      <tr key={item.id} className={index % 2 === 0 ? 'even-row' : 'odd-row'}>
                        <td className="case-number">{item.caseNo}</td>
                        <td>
                          <div className="customer-info">
                            <div className="customer-avatar">{item.customer.charAt(0)}</div>
                            {item.customer}
                          </div>
                        </td>
                        <td>{item.product}</td>
                        <td className="amount">PKR {item.amount.toLocaleString()}</td>
                        <td>
                          <div className="date-info">
                            <Calendar size={12} />
                            {item.date || '-'}
                          </div>
                        </td>
                        <td>
                          <span className={`status-badge ${status}`}>
                            {status === 'paid' ? 'Paid' : status === 'pending' ? 'Pending' : 'Overdue'}
                          </span>
                        </td>
                        <td>
                          <div className="action-group">
                            <button className="btn-view-account" onClick={() => openAccountModal(item)} title="View Account Details">
                              <Eye size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (activeTab === 'recovery') {
      // ✅ Sirf wo accounts jinka is mahine ka due amount abhi bhi baaki hai
      const list = selectedEmployeeData.accounts.filter(acc => getThisMonthDue(acc) > 0);
      return (
        <div className="table-container">
          <div className="table-header">
            <div className="table-header-left">
              <FileText size={18} style={{ color: '#C9A84C' }} />
              <h3>Recovery Due (This Month)</h3>
              <span className="record-count">{list.length} customers</span>
            </div>
          </div>
          <div className="table-scroll">
            <table className="accounts-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Case #</th>
                  <th>Installment</th>
                  <th>This Month Due (PKR)</th>
                  <th>Total Balance (PKR)</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr><td colSpan="6" className="no-data">No recovery due this month</td></tr>
                ) : (
                  list.map((item, index) => (
                    <tr key={item.id} className={`overdue-row ${index % 2 === 0 ? 'even-row' : 'odd-row'}`}>
                      <td>
                        <div className="customer-info">
                          <div className="customer-avatar">{item.customer.charAt(0)}</div>
                          {item.customer}
                        </div>
                      </td>
                      <td className="case-number">{item.caseNo}</td>
                      <td>{item.monthly > 0 ? `PKR ${item.monthly.toLocaleString()}` : '---'}</td>
                      <td className="balance-amount">PKR {getThisMonthDue(item).toLocaleString()}</td>
                      <td className={item.balance > 0 ? 'balance-amount' : 'paid-amount'}>PKR {item.balance.toLocaleString()}</td>
                      <td>
                        <div className="action-group">
                          <button className="btn-view-account" onClick={() => openAccountModal(item)} title="View Account Details">
                            <Eye size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (activeTab === 'overdue') {
      const list = selectedEmployeeData.overdueList;
      return (
        <div className="table-container">
          <div className="table-header">
            <div className="table-header-left">
              <FileText size={18} style={{ color: '#dc2626' }} />
              <h3>Overdue Accounts</h3>
              <span className="record-count">{list.length} customers</span>
            </div>
          </div>
          <div className="table-scroll">
            <table className="accounts-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Case #</th>
                  <th>Installment</th>
                  <th>Balance (PKR)</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr><td colSpan="5" className="no-data">No overdue accounts</td></tr>
                ) : (
                  list.map((item, index) => (
                    <tr key={item.id} className={`overdue-row ${index % 2 === 0 ? 'even-row' : 'odd-row'}`}>
                      <td>
                        <div className="customer-info">
                          <div className="customer-avatar">{item.customer.charAt(0)}</div>
                          {item.customer}
                        </div>
                      </td>
                      <td className="case-number">{item.caseNo}</td>
                      <td>{item.monthly > 0 ? `PKR ${item.monthly.toLocaleString()}` : '---'}</td>
                      <td className="balance-amount">PKR {item.balance.toLocaleString()}</td>
                      <td>
                        <div className="action-group">
                          <button className="btn-view-account" onClick={() => openAccountModal(item)} title="View Account Details">
                            <Eye size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    return null;
  };

  useEffect(() => {
    if (isEmployee) {
      setActiveTab('recovery');
    } else {
      setActiveTab('total');
    }
  }, [isEmployee, selectedEmployeeId]);

  if (loading) {
    return (
      <div className="employee-performance-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading performance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="employee-performance-container">
      {/* HEADER */}
      <div className="performance-header">
        <div className="header-left">
          <div className="header-title-group">
            <h2>{isEmployee ? 'My Performance' : 'Employee Performance'}</h2>
            <span className="live-badge">
              <Clock size={12} /> Live
            </span>
          </div>
          <p className="subtitle">
            {isEmployee ? 'Your performance overview' : 'Employee performance overview'}
          </p>
        </div>

        {!isEmployee && (
          <div className="employee-dropdown-wrapper">
            <div 
              className="employee-dropdown-toggle"
              onClick={() => setShowEmployeeDropdown(!showEmployeeDropdown)}
            >
              <span>{selectedEmployee ? selectedEmployee.name : 'All Employees'}</span>
              <ChevronDown size={18} />
            </div>
            {showEmployeeDropdown && (
              <div className="employee-dropdown-list">
                <div 
                  className={`dropdown-item ${!selectedEmployeeId ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedEmployeeId(null);
                    setShowEmployeeDropdown(false);
                    setActiveTab('total');
                  }}
                >
                  All Employees
                </div>
                {filteredEmployees.map(emp => (
                  <div 
                    key={emp.id}
                    className={`dropdown-item ${selectedEmployeeId === emp.id ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedEmployeeId(emp.id);
                      setShowEmployeeDropdown(false);
                      setActiveTab('total');
                    }}
                  >
                    {emp.name}
                    <span className="dropdown-role">{emp.role}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!isEmployee && (
          <div className="search-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search by customer, case or product..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        )}
      </div>

      {!isEmployee && selectedEmployee && (
        <div className="selected-employee-info">
          <div className="selected-employee-avatar">{selectedEmployee.name.charAt(0)}</div>
          <div className="selected-employee-details">
            <span className="selected-employee-name">{selectedEmployee.name}</span>
            <span className="selected-employee-role">{selectedEmployee.role} • Branch {selectedEmployee.branch_id || selectedEmployee.branch}</span>
          </div>
        </div>
      )}

      <div className={`stats-grid-4 ${isEmployee ? 'employee-stats' : ''}`}>
        {cards.map((card) => (
          <div 
            key={card.key}
            className={`stat-card ${card.className} ${activeTab === card.key ? 'active' : ''}`}
            onClick={() => setActiveTab(card.key)}
            style={{ 
              borderLeft: `5px solid ${card.color}`,
              boxShadow: activeTab === card.key ? `0 4px 15px ${card.color}30` : '0 2px 4px rgba(0,0,0,0.04)'
            }}
          >
            <div className="stat-icon" style={{ background: card.bg, color: card.color }}>
              <card.icon size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-label" style={{ fontWeight: 700 }}>{card.label}</span>
              <span className="stat-value" style={{ fontWeight: 800, color: card.color }}>{card.value}</span>
            </div>
          </div>
        ))}
      </div>

      {renderTable()}

      {/* ===== ACCOUNT DETAIL MODAL ===== */}
      {showAccountModal && selectedAccount && (
        <div className="epr-modal-overlay" onClick={() => setShowAccountModal(false)}>
          <div className="epr-modal-content epr-modal-account" onClick={(e) => e.stopPropagation()}>
            <div className="epr-modal-header">
              <div className="epr-modal-header-left">
                <User size={20} className="epr-modal-icon" />
                <h3>Account Details - {selectedAccount.caseNo}</h3>
              </div>
              <button className="epr-modal-close" onClick={() => setShowAccountModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="epr-modal-body">
              <div className="account-detail-header">
                <div className="account-detail-avatar" style={{ background: '#1E1B4B' }}>
                  {selectedAccount.customer.charAt(0)}
                </div>
                <div className="account-detail-info">
                  <h4 style={{ fontWeight: 700 }}>{selectedAccount.customer}</h4>
                  <span className="account-detail-case" style={{ fontWeight: 600 }}>Case: {selectedAccount.caseNo}</span>
                  <span className="account-detail-product" style={{ fontWeight: 500 }}>Product: {selectedAccount.product}</span>
                </div>
                <div className="account-detail-status">
                  <span className={`status-badge ${getStatusForAccount(selectedAccount)}`}>
                    {getStatusForAccount(selectedAccount) === 'paid' ? 'Paid' :
                     getStatusForAccount(selectedAccount) === 'pending' ? 'Pending' : 'Overdue'}
                  </span>
                </div>
              </div>

              <div className="account-detail-grid">
                <div className="account-detail-item">
                  <span style={{ fontWeight: 700 }}>CNIC</span>
                  <strong style={{ fontWeight: 700 }}>{selectedAccount.cnic}</strong>
                </div>
                <div className="account-detail-item">
                  <span style={{ fontWeight: 700 }}>Phone</span>
                  <strong style={{ fontWeight: 700 }}>{selectedAccount.phone}</strong>
                </div>
                <div className="account-detail-item">
                  <span style={{ fontWeight: 700 }}>Address</span>
                  <strong style={{ fontWeight: 700 }}>{selectedAccount.address}</strong>
                </div>
                <div className="account-detail-item">
                  <span style={{ fontWeight: 700 }}>Total Amount</span>
                  <strong style={{ fontWeight: 800, color: '#1E1B4B' }}>PKR {selectedAccount.amount.toLocaleString()}</strong>
                </div>
                <div className="account-detail-item">
                  <span style={{ fontWeight: 700 }}>Paid Amount</span>
                  <strong className="paid-amount" style={{ fontWeight: 800 }}>PKR {selectedAccount.paid.toLocaleString()}</strong>
                </div>
                <div className="account-detail-item">
                  <span style={{ fontWeight: 700 }}>Balance</span>
                  <strong className={selectedAccount.balance > 0 ? 'balance-amount' : 'paid-amount'} style={{ fontWeight: 800 }}>
                    PKR {selectedAccount.balance.toLocaleString()}
                  </strong>
                </div>
              </div>

              {selectedAccount.guarantors && selectedAccount.guarantors.length > 0 && (
                <div className="guarantors-section">
                  <h4 style={{ fontWeight: 700 }}>Guarantors</h4>
                  {selectedAccount.guarantors.map((g, index) => (
                    <div key={index} className="guarantor-item">
                      <div className="guarantor-info">
                        <span style={{ fontWeight: 600 }}>Name: {g.name}</span>
                        <span style={{ fontWeight: 600 }}>CNIC: {g.cnic}</span>
                        <span style={{ fontWeight: 600 }}>Phone: {g.phone}</span>
                        <span style={{ fontWeight: 600 }}>Address: {g.address}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="installment-details-section">
                <div className="section-header">
                  <h4 style={{ fontWeight: 700 }}>Installment Payment History</h4>
                </div>

                <div className="table-scroll">
                  <table className="installment-history-table">
                    <thead>
                      <tr>
                        <th style={{ fontWeight: 800 }}>#</th>
                        <th style={{ fontWeight: 800 }}>Month</th>
                        <th style={{ fontWeight: 800 }}>Due Amount</th>
                        <th style={{ fontWeight: 800 }}>Paid</th>
                        <th style={{ fontWeight: 800 }}>Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedAccount.installments && selectedAccount.installments.length > 0 ? (
                        selectedAccount.installments.map((inst, index) => (
                          <tr key={inst.id} className={`${parseFloat(inst.balance || 0) > 0 ? 'overdue-row' : ''} ${index % 2 === 0 ? 'even-row' : 'odd-row'}`}>
                            <td style={{ fontWeight: 700 }}>{index + 1}</td>
                            <td style={{ fontWeight: 600 }}>{inst.month ? new Date(inst.month + '-01').toLocaleDateString('en-PK', { month: 'short', year: 'numeric' }) : '-'}</td>
                            <td style={{ fontWeight: 600 }}>PKR {parseFloat(inst.due_amount || 0).toLocaleString()}</td>
                            <td className="paid-amount" style={{ fontWeight: 700 }}>PKR {parseFloat(inst.paid_amount || 0).toLocaleString()}</td>
                            <td className={parseFloat(inst.balance || 0) > 0 ? 'balance-amount' : 'paid-amount'} style={{ fontWeight: 700 }}>
                              PKR {parseFloat(inst.balance || 0).toLocaleString()}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="5" className="no-data">No installment records found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="epr-modal-footer">
              <button className="btn-cancel" onClick={() => setShowAccountModal(false)} style={{ fontWeight: 700 }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeePerformanceReport;