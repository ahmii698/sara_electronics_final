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
      setUserBranch(user.branch_id || user.branch);
      setUserId(user.id);
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
          
          // Get current month's installment balance for Mirror column
          const currentMonthStr = getCurrentMonthStr();
          const installments = acc.installments || [];
          const currentMonthInstallment = installments.find(p => p.month === currentMonthStr);
          const mirrorAmount = currentMonthInstallment ? parseFloat(currentMonthInstallment.balance || 0) : 0;
          
          // Sort installments by month
          const sortedInstallments = [...installments].sort((a, b) => (a.month || '').localeCompare(b.month || ''));
          
          // Get the first unpaid installment for due date
          const firstUnpaid = sortedInstallments.find(p => parseFloat(p.balance || 0) > 0);
          
          // Get the due date from the unpaid installment's due_date field if available, otherwise from month
          let dueDate = null;
          if (firstUnpaid) {
            dueDate = firstUnpaid.due_date || firstUnpaid.month || null;
          } else if (sortedInstallments.length > 0) {
            dueDate = sortedInstallments[0].due_date || sortedInstallments[0].month || null;
          }
          
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
            openingDate: acc.created_at ? acc.created_at : null,
            dueDate: dueDate,
            branch: acc.branch_id || 1,
            employeeId: employee.id || acc.created_by || null,
            employeeName: employee.name || 'N/A',
            guarantors: acc.customer?.guarantors || [],
            installments: acc.installments || [],
            mirror: mirrorAmount // Current month installment balance
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

  // ✅ NEW: work out the real due date of an installment using the account's
  // opening day (e.g. account opened on 24th -> every installment is due on the 24th)
  const getInstallmentDueDate = (account, installmentMonth) => {
    if (!installmentMonth) return null;
    const [y, m] = installmentMonth.split('-').map(Number);
    if (!y || !m) return null;

    let day = 1;
    if (account?.openingDate) {
      day = new Date(account.openingDate).getDate();
    }
    return new Date(y, m - 1, day);
  };

  // ✅ UPDATED: overdue is now based on the actual due date (day-wise),
  // not just "month has arrived". So if account opened 24-Jul, the Aug
  // installment only becomes overdue after 24-Aug, not on 1-Aug.
  const isAccountOverdue = (account) => {
    const list = Array.isArray(account.installments) ? account.installments : [];
    if (list.length === 0) return account.balance > 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueUnpaid = list.filter(p => {
      if (parseFloat(p.balance || 0) <= 0 || !p.month) return false;

      const dueDate = p.due_date ? new Date(p.due_date) : getInstallmentDueDate(account, p.month);
      if (!dueDate) return false;
      dueDate.setHours(0, 0, 0, 0);

      return dueDate <= today;
    });

    return dueUnpaid.length > 0;
  };

  // ✅ NEW: gives the actual remaining (unpaid) amount for the installment(s)
  // that are currently overdue — e.g. installment is 5,800 but customer paid
  // 300, so this returns 5,500 instead of the account's total balance.
  const getOverdueAmount = (account) => {
    const list = Array.isArray(account.installments) ? account.installments : [];
    if (list.length === 0) return account.balance > 0 ? account.balance : 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueUnpaid = list.filter(p => {
      if (parseFloat(p.balance || 0) <= 0 || !p.month) return false;

      const dueDate = p.due_date ? new Date(p.due_date) : getInstallmentDueDate(account, p.month);
      if (!dueDate) return false;
      dueDate.setHours(0, 0, 0, 0);

      return dueDate <= today;
    });

    return dueUnpaid.reduce((sum, p) => sum + parseFloat(p.balance || 0), 0);
  };

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

  const getBranchScopedAccounts = () => {
    if (userBranch) {
      return accounts.filter(acc => parseInt(acc.branch) === parseInt(userBranch));
    }
    return accounts;
  };

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
      if (!acc.openingDate) return false;
      const accDate = new Date(acc.openingDate);
      return accDate.getMonth() === currentMonth && accDate.getFullYear() === currentYear;
    });

    const recoveryDue = empAccounts.reduce((sum, acc) => sum + getThisMonthDue(acc), 0);
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

  // ✅ Full date formatter with day number
  const formatFullDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-PK', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // ✅ Format due date from month string or full date
  const formatDueDate = (dueDate) => {
    if (!dueDate) return '-';
    
    // If it's already a full date with day
    if (dueDate.includes('-') && dueDate.split('-').length === 3) {
      return new Date(dueDate).toLocaleDateString('en-PK', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    }
    
    // If it's just month string like "2026-07"
    if (dueDate.includes('-') && dueDate.split('-').length === 2) {
      const date = new Date(dueDate + '-01');
      return date.toLocaleDateString('en-PK', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    }
    
    return '-';
  };

  const cards = isEmployee ? [
    {
      key: 'new',
      label: 'New Accounts (This Month)',
      value: selectedEmployeeData.newAccountsList.length,
      icon: TrendingUp,
      color: '#2563eb',
      bg: 'rgba(37, 99, 235, 0.12)',
      className: 'epr-new-accounts-card'
    },
    {
      key: 'recovery',
      label: 'Recovery Due (This Month)',
      value: `PKR ${selectedEmployeeData.recoveryDue.toLocaleString()}`,
      icon: DollarSign,
      color: '#C9A84C',
      bg: 'rgba(201, 168, 76, 0.15)',
      className: 'epr-recovery-card'
    },
    {
      key: 'overdue',
      label: 'Overdue',
      value: selectedEmployeeData.overdueList.length,
      icon: AlertTriangle,
      color: '#dc2626',
      bg: 'rgba(220, 38, 38, 0.12)',
      className: 'epr-overdue-card-main'
    },
  ] : [
    {
      key: 'total',
      label: 'Total Accounts',
      value: selectedEmployeeData.totalAccounts,
      icon: Users,
      color: '#1E1B4B',
      bg: 'rgba(30, 27, 75, 0.08)',
      className: 'epr-total-accounts-card'
    },
    {
      key: 'new',
      label: 'New Accounts (This Month)',
      value: selectedEmployeeData.newAccountsList.length,
      icon: TrendingUp,
      color: '#2563eb',
      bg: 'rgba(37, 99, 235, 0.12)',
      className: 'epr-new-accounts-card'
    },
    {
      key: 'recovery',
      label: 'Recovery Due (This Month)',
      value: `PKR ${selectedEmployeeData.recoveryDue.toLocaleString()}`,
      icon: DollarSign,
      color: '#C9A84C',
      bg: 'rgba(201, 168, 76, 0.15)',
      className: 'epr-recovery-card'
    },
    {
      key: 'overdue',
      label: 'Overdue',
      value: selectedEmployeeData.overdueList.length,
      icon: AlertTriangle,
      color: '#dc2626',
      bg: 'rgba(220, 38, 38, 0.12)',
      className: 'epr-overdue-card-main'
    },
  ];

  // ✅ UPDATED: no more "pending" state - either paid (balance cleared, or
  // due date hasn't arrived yet) or overdue (due date passed and unpaid)
  const getStatusForAccount = (account) => {
    if (account.balance <= 0) return 'paid';
    if (isAccountOverdue(account)) return 'overdue';
    return 'paid';
  };

  const renderTable = () => {
    if (activeTab === 'total' && !isEmployee) {
      return (
        <div className="epr-table-container">
          <div className="epr-table-header">
            <div className="epr-table-header-left">
              <FileText size={18} style={{ color: '#1E1B4B' }} />
              <h3>All Accounts</h3>
              <span className="epr-record-count">{filteredAccounts.length} accounts</span>
            </div>
          </div>
          <div className="epr-table-scroll">
            <table className="epr-accounts-table">
              <thead>
                <tr>
                  <th>Case #</th>
                  <th>Customer</th>
                  <th>Product</th>
                  <th>Amount (PKR)</th>
                  <th>Paid (PKR)</th>
                  <th>Balance (PKR)</th>
                  <th>Installment</th>
                  <th>Mirror</th>
                  <th>Account Opening</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.length === 0 ? (
                  <tr><td colSpan="12" className="epr-no-data">No accounts found</td></tr>
                ) : (
                  filteredAccounts.map((item, index) => {
                    const status = getStatusForAccount(item);
                    return (
                      <tr key={item.id} className={`${status === 'overdue' ? 'epr-overdue-row' : ''} ${index % 2 === 0 ? 'epr-even-row' : 'epr-odd-row'}`}>
                        <td className="epr-case-number">{item.caseNo}</td>
                        <td>
                          <div className="epr-customer-info">
                            <div className="epr-customer-avatar" style={{ background: status === 'paid' ? '#d1fae5' : status === 'overdue' ? '#fee2e2' : '#fef3c7', color: status === 'paid' ? '#065f46' : status === 'overdue' ? '#991b1b' : '#92400e' }}>
                              {item.customer.charAt(0)}
                            </div>
                            {item.customer}
                          </div>
                        </td>
                        <td>{item.product}</td>
                        <td className="epr-amount">PKR {item.amount.toLocaleString()}</td>
                        <td className="epr-paid-amount">PKR {item.paid.toLocaleString()}</td>
                        <td className={item.balance > 0 ? 'epr-balance-amount' : 'epr-paid-amount'}>
                          PKR {item.balance.toLocaleString()}
                        </td>
                        <td className="epr-amount">PKR {item.monthly.toLocaleString()}</td>
                        <td className={item.mirror > 0 ? 'epr-balance-amount' : 'epr-paid-amount'}>
                          PKR {item.mirror.toLocaleString()}
                        </td>
                        <td>
                          <div className="epr-date-info" style={{ color: '#2563eb', fontWeight: 500 }}>
                            <Calendar size={12} />
                            {formatFullDate(item.openingDate)}
                          </div>
                        </td>
                        <td>
                          <div className="epr-date-info" style={{ color: '#7c3aed', fontWeight: 500 }}>
                            <Calendar size={12} />
                            {formatDueDate(item.dueDate)}
                          </div>
                        </td>
                        <td>
                          <span className={`epr-status-badge epr-${status}`}>
                            {status === 'paid' ? 'Paid' : status === 'pending' ? 'Pending' : 'Overdue'}
                          </span>
                        </td>
                        <td>
                          <div className="epr-action-group">
                            <button className="epr-btn-view-account" onClick={() => openAccountModal(item)} title="View Account Details">
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
        <div className="epr-table-container">
          <div className="epr-table-header">
            <div className="epr-table-header-left">
              <FileText size={18} style={{ color: '#2563eb' }} />
              <h3>New Accounts (This Month)</h3>
              <span className="epr-record-count">{list.length} accounts</span>
            </div>
          </div>
          <div className="epr-table-scroll">
            <table className="epr-accounts-table">
              <thead>
                <tr>
                  <th>Case #</th>
                  <th>Customer</th>
                  <th>Product</th>
                  <th>Amount (PKR)</th>
                  <th>Installment</th>
                  <th>Mirror</th>
                  <th>Account Opening</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr><td colSpan="10" className="epr-no-data">No new accounts this month</td></tr>
                ) : (
                  list.map((item, index) => {
                    const status = getStatusForAccount(item);
                    return (
                      <tr key={item.id} className={index % 2 === 0 ? 'epr-even-row' : 'epr-odd-row'}>
                        <td className="epr-case-number">{item.caseNo}</td>
                        <td>
                          <div className="epr-customer-info">
                            <div className="epr-customer-avatar">{item.customer.charAt(0)}</div>
                            {item.customer}
                          </div>
                        </td>
                        <td>{item.product}</td>
                        <td className="epr-amount">PKR {item.amount.toLocaleString()}</td>
                        <td className="epr-amount">PKR {item.monthly.toLocaleString()}</td>
                        <td className={item.mirror > 0 ? 'epr-balance-amount' : 'epr-paid-amount'}>
                          PKR {item.mirror.toLocaleString()}
                        </td>
                        <td>
                          <div className="epr-date-info" style={{ color: '#2563eb', fontWeight: 500 }}>
                            <Calendar size={12} />
                            {formatFullDate(item.openingDate)}
                          </div>
                        </td>
                        <td>
                          <div className="epr-date-info" style={{ color: '#7c3aed', fontWeight: 500 }}>
                            <Calendar size={12} />
                            {formatDueDate(item.dueDate)}
                          </div>
                        </td>
                        <td>
                          <span className={`epr-status-badge epr-${status}`}>
                            {status === 'paid' ? 'Paid' : status === 'pending' ? 'Pending' : 'Overdue'}
                          </span>
                        </td>
                        <td>
                          <div className="epr-action-group">
                            <button className="epr-btn-view-account" onClick={() => openAccountModal(item)} title="View Account Details">
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
      const list = selectedEmployeeData.accounts.filter(acc => getThisMonthDue(acc) > 0);
      return (
        <div className="epr-table-container">
          <div className="epr-table-header">
            <div className="epr-table-header-left">
              <FileText size={18} style={{ color: '#C9A84C' }} />
              <h3>Recovery Due (This Month)</h3>
              <span className="epr-record-count">{list.length} customers</span>
            </div>
          </div>
          <div className="epr-table-scroll">
            <table className="epr-accounts-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Case #</th>
                  <th>Installment</th>
                  <th>Mirror</th>
                  <th>Balance</th>
                  <th>Account Opening</th>
                  <th>Due Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr><td colSpan="8" className="epr-no-data">No recovery due this month</td></tr>
                ) : (
                  list.map((item, index) => (
                    <tr key={item.id} className={`epr-overdue-row ${index % 2 === 0 ? 'epr-even-row' : 'epr-odd-row'}`}>
                      <td>
                        <div className="epr-customer-info">
                          <div className="epr-customer-avatar">{item.customer.charAt(0)}</div>
                          {item.customer}
                        </div>
                      </td>
                      <td className="epr-case-number">{item.caseNo}</td>
                      <td>{item.monthly > 0 ? `PKR ${item.monthly.toLocaleString()}` : '---'}</td>
                      <td className="epr-balance-amount">PKR {getThisMonthDue(item).toLocaleString()}</td>
                      <td className={item.balance > 0 ? 'epr-balance-amount' : 'epr-paid-amount'}>PKR {item.balance.toLocaleString()}</td>
                      <td>
                        <div className="epr-date-info" style={{ color: '#2563eb', fontWeight: 500 }}>
                          <Calendar size={12} />
                          {formatFullDate(item.openingDate)}
                        </div>
                      </td>
                      <td>
                        <div className="epr-date-info" style={{ color: '#7c3aed', fontWeight: 500 }}>
                          <Calendar size={12} />
                          {formatDueDate(item.dueDate)}
                        </div>
                      </td>
                      <td>
                        <div className="epr-action-group">
                          <button className="epr-btn-view-account" onClick={() => openAccountModal(item)} title="View Account Details">
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
        <div className="epr-table-container">
          <div className="epr-table-header">
            <div className="epr-table-header-left">
              <FileText size={18} style={{ color: '#dc2626' }} />
              <h3>Overdue Accounts</h3>
              <span className="epr-record-count">{list.length} customers</span>
            </div>
          </div>
          <div className="epr-table-scroll">
            <table className="epr-accounts-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Case #</th>
                  <th>Installment</th>
                  <th>Mirror</th>
                  <th>Balance</th>
                  <th>Account Opening</th>
                  <th>Due Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr><td colSpan="8" className="epr-no-data">No overdue accounts</td></tr>
                ) : (
                  list.map((item, index) => (
                    <tr key={item.id} className={`epr-overdue-row ${index % 2 === 0 ? 'epr-even-row' : 'epr-odd-row'}`}>
                      <td>
                        <div className="epr-customer-info">
                          <div className="epr-customer-avatar">{item.customer.charAt(0)}</div>
                          {item.customer}
                        </div>
                      </td>
                      <td className="epr-case-number">{item.caseNo}</td>
                      <td>{item.monthly > 0 ? `PKR ${item.monthly.toLocaleString()}` : '---'}</td>
                      <td className="epr-balance-amount">PKR {getOverdueAmount(item).toLocaleString()}</td>
                      <td className={item.balance > 0 ? 'epr-balance-amount' : 'epr-paid-amount'}>PKR {item.balance.toLocaleString()}</td>
                      <td>
                        <div className="epr-date-info" style={{ color: '#2563eb', fontWeight: 500 }}>
                          <Calendar size={12} />
                          {formatFullDate(item.openingDate)}
                        </div>
                      </td>
                      <td>
                        <div className="epr-date-info" style={{ color: '#7c3aed', fontWeight: 500 }}>
                          <Calendar size={12} />
                          {formatDueDate(item.dueDate)}
                        </div>
                      </td>
                      <td>
                        <div className="epr-action-group">
                          <button className="epr-btn-view-account" onClick={() => openAccountModal(item)} title="View Account Details">
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
      <div className="epr-container">
        <div className="epr-loading-state">
          <div className="epr-spinner"></div>
          <p>Loading performance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="epr-container">
      {/* HEADER */}
      <div className="epr-header">
        <div className="epr-header-left">
          <div className="epr-header-title-group">
            <h2>{isEmployee ? 'My Performance' : 'Employee Performance'}</h2>
            <span className="epr-live-badge">
              <Clock size={12} /> Live
            </span>
          </div>
          <p className="epr-subtitle">
            {isEmployee ? 'Your performance overview' : 'Employee performance overview'}
          </p>
        </div>

        {!isEmployee && (
          <div className="epr-header-actions">
            <div className="epr-employee-dropdown-wrapper">
              <div
                className={`epr-employee-dropdown-toggle ${showEmployeeDropdown ? 'epr-open' : ''}`}
                onClick={() => setShowEmployeeDropdown(!showEmployeeDropdown)}
              >
                <span>{selectedEmployee ? selectedEmployee.name : 'All Employees'}</span>
                <ChevronDown size={18} className="epr-chevron" />
              </div>
              {showEmployeeDropdown && (
                <div className="epr-employee-dropdown-list">
                  <div
                    className={`epr-dropdown-item ${!selectedEmployeeId ? 'epr-active' : ''}`}
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
                      className={`epr-dropdown-item ${selectedEmployeeId === emp.id ? 'epr-active' : ''}`}
                      onClick={() => {
                        setSelectedEmployeeId(emp.id);
                        setShowEmployeeDropdown(false);
                        setActiveTab('total');
                      }}
                    >
                      {emp.name}
                      <span className="epr-dropdown-role">{emp.role}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="epr-search-wrapper">
              <Search size={18} className="epr-search-icon" />
              <input
                type="text"
                placeholder="Search by customer, case or product..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {!isEmployee && selectedEmployee && (
        <div className="epr-selected-employee-info">
          <div className="epr-selected-employee-avatar">{selectedEmployee.name.charAt(0)}</div>
          <div className="epr-selected-employee-details">
            <span className="epr-selected-employee-name">{selectedEmployee.name}</span>
            <span className="epr-selected-employee-role">{selectedEmployee.role} • Branch {selectedEmployee.branch_id || selectedEmployee.branch}</span>
          </div>
        </div>
      )}

      <div className={`epr-stats-grid-4 ${isEmployee ? 'epr-employee-stats' : ''}`}>
        {cards.map((card) => (
          <div
            key={card.key}
            className={`epr-stat-card ${card.className} ${activeTab === card.key ? 'epr-active' : ''}`}
            onClick={() => setActiveTab(card.key)}
          >
            <div className="epr-stat-icon" style={{ background: card.bg, color: card.color }}>
              <card.icon size={20} />
            </div>
            <div className="epr-stat-info">
              <span className="epr-stat-label">{card.label}</span>
              <span className="epr-stat-value">{card.value}</span>
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
              <div className="epr-account-detail-header">
                <div className="epr-account-detail-avatar" style={{ background: '#1E1B4B' }}>
                  {selectedAccount.customer.charAt(0)}
                </div>
                <div className="epr-account-detail-info">
                  <h4 style={{ fontWeight: 700 }}>{selectedAccount.customer}</h4>
                  <span className="epr-account-detail-case" style={{ fontWeight: 600 }}>Case: {selectedAccount.caseNo}</span>
                  <span className="epr-account-detail-product" style={{ fontWeight: 500 }}>Product: {selectedAccount.product}</span>
                </div>
                <div className="epr-account-detail-status">
                  <span className={`epr-status-badge epr-${getStatusForAccount(selectedAccount)}`}>
                    {getStatusForAccount(selectedAccount) === 'paid' ? 'Paid' :
                     getStatusForAccount(selectedAccount) === 'pending' ? 'Pending' : 'Overdue'}
                  </span>
                </div>
              </div>

              <div className="epr-account-detail-grid">
                <div className="epr-account-detail-item">
                  <span style={{ fontWeight: 700 }}>CNIC</span>
                  <strong style={{ fontWeight: 700 }}>{selectedAccount.cnic}</strong>
                </div>
                <div className="epr-account-detail-item">
                  <span style={{ fontWeight: 700 }}>Phone</span>
                  <strong style={{ fontWeight: 700 }}>{selectedAccount.phone}</strong>
                </div>
                <div className="epr-account-detail-item">
                  <span style={{ fontWeight: 700 }}>Address</span>
                  <strong style={{ fontWeight: 700 }}>{selectedAccount.address}</strong>
                </div>
                <div className="epr-account-detail-item">
                  <span style={{ fontWeight: 700 }}>Total Amount</span>
                  <strong style={{ fontWeight: 800, color: '#1E1B4B' }}>PKR {selectedAccount.amount.toLocaleString()}</strong>
                </div>
                <div className="epr-account-detail-item">
                  <span style={{ fontWeight: 700 }}>Paid Amount</span>
                  <strong className="epr-paid-amount" style={{ fontWeight: 800 }}>PKR {selectedAccount.paid.toLocaleString()}</strong>
                </div>
                <div className="epr-account-detail-item">
                  <span style={{ fontWeight: 700 }}>Balance</span>
                  <strong className={selectedAccount.balance > 0 ? 'epr-balance-amount' : 'epr-paid-amount'} style={{ fontWeight: 800 }}>
                    PKR {selectedAccount.balance.toLocaleString()}
                  </strong>
                </div>
                <div className="epr-account-detail-item">
                  <span style={{ fontWeight: 700 }}>Account Opening</span>
                  <strong style={{ fontWeight: 600, color: '#2563eb' }}>
                    {formatFullDate(selectedAccount.openingDate)}
                  </strong>
                </div>
                <div className="epr-account-detail-item">
                  <span style={{ fontWeight: 700 }}>Due Date</span>
                  <strong style={{ fontWeight: 600, color: '#7c3aed' }}>
                    {formatDueDate(selectedAccount.dueDate)}
                  </strong>
                </div>
              </div>

              {selectedAccount.guarantors && selectedAccount.guarantors.length > 0 && (
                <div className="epr-guarantors-section">
                  <h4 style={{ fontWeight: 700 }}>Guarantors</h4>
                  {selectedAccount.guarantors.map((g, index) => (
                    <div key={index} className="epr-guarantor-item">
                      <div className="epr-guarantor-info">
                        <span style={{ fontWeight: 600 }}>Name: {g.name}</span>
                        <span style={{ fontWeight: 600 }}>CNIC: {g.cnic}</span>
                        <span style={{ fontWeight: 600 }}>Phone: {g.phone}</span>
                        <span style={{ fontWeight: 600 }}>Address: {g.address}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="epr-installment-details-section">
                <div className="epr-section-header">
                  <h4 style={{ fontWeight: 700 }}>Installment Payment History</h4>
                </div>

                <div className="epr-table-scroll">
                  <table className="epr-installment-history-table">
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
                        selectedAccount.installments.map((inst, index) => {
                          const dueAmount = parseFloat(inst.due_amount || 0);
                          const paidAmount = parseFloat(inst.paid_amount || 0);
                          const balanceAmount = parseFloat(inst.balance || 0);
                          return (
                            <tr key={inst.id} className={`${balanceAmount > 0 ? 'epr-overdue-row' : ''} ${index % 2 === 0 ? 'epr-even-row' : 'epr-odd-row'}`}>
                              <td style={{ fontWeight: 700 }}>{index + 1}</td>
                              <td style={{ fontWeight: 600 }}>{inst.month ? new Date(inst.month + '-01').toLocaleDateString('en-PK', { month: 'short', year: 'numeric' }) : '-'}</td>
                              <td style={{ fontWeight: 600 }}>PKR {dueAmount.toLocaleString()}</td>
                              <td className="epr-paid-amount" style={{ fontWeight: 700 }}>PKR {paidAmount.toLocaleString()}</td>
                              <td className={balanceAmount > 0 ? 'epr-balance-amount' : 'epr-paid-amount'} style={{ fontWeight: 700 }}>
                                PKR {balanceAmount.toLocaleString()}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr><td colSpan="5" className="epr-no-data">No installment records found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="epr-modal-footer">
              <button className="epr-btn-cancel" onClick={() => setShowAccountModal(false)} style={{ fontWeight: 700 }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeePerformanceReport;