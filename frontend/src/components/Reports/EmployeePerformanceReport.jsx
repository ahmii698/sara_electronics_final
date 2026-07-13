import React, { useState, useEffect } from 'react';
import { Search, User, DollarSign, Users, Briefcase, Calendar, Clock, Award, Building, Download, Eye, X, TrendingUp, CheckCircle, AlertCircle, AlertTriangle, FileText, Filter, ChevronDown } from 'lucide-react';
import './EmployeePerformanceReport.css';

const EmployeePerformanceReport = () => {
  const [search, setSearch] = useState('');
  const [userBranch, setUserBranch] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [activeTab, setActiveTab] = useState('total');
  const [currentEmployeeId, setCurrentEmployeeId] = useState(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setUserRole(user.role);
      setUserBranch(user.branch);
      if (user.employeeId) {
        setCurrentEmployeeId(user.employeeId);
        setSelectedEmployeeId(user.employeeId);
      }
    }
  }, []);

  const isEmployee = userRole === 'employee';
  const isAdmin = userRole === 'admin';
  const isManager = userRole === 'manager';

  const employeesList = [
    { id: 1, name: 'Ahmed Khan', branch: 1, role: 'employee' },
    { id: 2, name: 'Sara Ali', branch: 2, role: 'manager' },
    { id: 3, name: 'Usman Malik', branch: 1, role: 'employee' },
    { id: 4, name: 'Fatima Noor', branch: 2, role: 'employee' },
    { id: 5, name: 'Bilal Ahmed', branch: 1, role: 'employee' },
    { id: 6, name: 'Hina Riaz', branch: 2, role: 'employee' },
    { id: 7, name: 'Imran Ali', branch: 1, role: 'employee' },
    { id: 8, name: 'Nadia Khan', branch: 2, role: 'employee' },
  ];

  const getFilteredEmployees = () => {
    if (userBranch) {
      return employeesList.filter(emp => emp.branch === parseInt(userBranch));
    }
    return employeesList;
  };

  const filteredEmployees = getFilteredEmployees();

  const [allData, setAllData] = useState({
    totalAccounts: 45,
    newAccounts: 8,
    totalRecovery: 320000,
    totalCommission: 178000,
    accounts: [
      { 
        id: 1, 
        customer: 'Ahmed Khan', 
        caseNo: 'SR-001', 
        amount: 60000, 
        paid: 25000, 
        balance: 35000,
        monthly: 5000,
        date: '2026-01-15',
        status: 'pending',
        cnic: '12345-6789012-3',
        phone: '0300-1234567',
        address: 'House #12, Street 5, Lahore',
        product: 'Samsung LED 55"',
        employeeId: 1,
        guarantors: [
          { name: 'Ali Raza', cnic: '12345-6789012-4', phone: '0300-7654321', address: 'House #34, Street 8' },
          { name: 'Zainab Khan', cnic: '12345-6789012-5', phone: '0300-9876543', address: 'House #56, Street 10' }
        ],
        installments: [
          { id: 1, month: 'Jan 2026', due: 5000, paid: 5000, status: 'paid', paymentDate: 'Jan 5, 2026', description: 'First installment payment' },
          { id: 2, month: 'Feb 2026', due: 5000, paid: 5000, status: 'paid', paymentDate: 'Feb 5, 2026', description: 'Second installment' },
          { id: 3, month: 'Mar 2026', due: 5000, paid: 5000, status: 'paid', paymentDate: 'Mar 5, 2026', description: 'Third installment' },
          { id: 4, month: 'Apr 2026', due: 5000, paid: 3000, status: 'partial', paymentDate: 'Apr 5, 2026', description: 'Partial payment received' },
          { id: 5, month: 'May 2026', due: 5000, paid: 0, status: 'unpaid', paymentDate: '-', description: 'Awaiting payment' },
          { id: 6, month: 'Jun 2026', due: 5000, paid: 0, status: 'unpaid', paymentDate: '-', description: 'Awaiting payment' },
        ]
      },
      { 
        id: 2, 
        customer: 'Usman Malik', 
        caseNo: 'SR-003', 
        amount: 40000, 
        paid: 15000, 
        balance: 25000,
        monthly: 4000,
        date: '2026-01-20',
        status: 'pending',
        cnic: '12345-6789012-6',
        phone: '0300-2345678',
        address: 'House #78, Street 12, Lahore',
        product: 'Dell Laptop',
        employeeId: 1,
        guarantors: [
          { name: 'Fatima Noor', cnic: '12345-6789012-7', phone: '0300-8765432', address: 'House #90, Street 15' }
        ],
        installments: [
          { id: 1, month: 'Jan 2026', due: 4000, paid: 4000, status: 'paid', paymentDate: 'Jan 20, 2026', description: 'First installment' },
          { id: 2, month: 'Feb 2026', due: 4000, paid: 4000, status: 'paid', paymentDate: 'Feb 20, 2026', description: 'Second installment' },
          { id: 3, month: 'Mar 2026', due: 4000, paid: 4000, status: 'paid', paymentDate: 'Mar 20, 2026', description: 'Third installment' },
          { id: 4, month: 'Apr 2026', due: 4000, paid: 2000, status: 'partial', paymentDate: 'Apr 20, 2026', description: 'Partial payment' },
          { id: 5, month: 'May 2026', due: 4000, paid: 0, status: 'unpaid', paymentDate: '-', description: 'Awaiting payment' },
          { id: 6, month: 'Jun 2026', due: 4000, paid: 0, status: 'unpaid', paymentDate: '-', description: 'Awaiting payment' },
          { id: 7, month: 'Jul 2026', due: 4000, paid: 0, status: 'unpaid', paymentDate: '-', description: 'Awaiting payment' },
        ]
      },
      { 
        id: 3, 
        customer: 'Bilal Ahmed', 
        caseNo: 'SR-007', 
        amount: 30000, 
        paid: 0, 
        balance: 30000,
        monthly: 3000,
        date: '2026-02-10',
        status: 'overdue',
        cnic: '12345-6789012-8',
        phone: '0300-3456789',
        address: 'House #12, Street 20, Lahore',
        product: 'Samsung Galaxy S24',
        employeeId: 1,
        guarantors: [
          { name: 'Hina Riaz', cnic: '12345-6789012-9', phone: '0300-6543210', address: 'House #34, Street 25' }
        ],
        installments: [
          { id: 1, month: 'Feb 2026', due: 3000, paid: 0, status: 'unpaid', paymentDate: '-', description: 'Awaiting payment' },
          { id: 2, month: 'Mar 2026', due: 3000, paid: 0, status: 'unpaid', paymentDate: '-', description: 'Awaiting payment' },
          { id: 3, month: 'Apr 2026', due: 3000, paid: 0, status: 'unpaid', paymentDate: '-', description: 'Awaiting payment' },
          { id: 4, month: 'May 2026', due: 3000, paid: 0, status: 'unpaid', paymentDate: '-', description: 'Awaiting payment' },
        ]
      },
      { 
        id: 4, 
        customer: 'Ali Raza', 
        caseNo: 'SR-005', 
        amount: 50000, 
        paid: 50000, 
        balance: 0,
        monthly: 0,
        date: '2026-01-05',
        status: 'paid',
        cnic: '12345-6789012-0',
        phone: '0300-4567890',
        address: 'House #56, Street 30, Lahore',
        product: 'Apple iPhone 15',
        employeeId: 2,
        guarantors: [],
        installments: [
          { id: 1, month: 'Jan 2026', due: 5000, paid: 5000, status: 'paid', paymentDate: 'Jan 5, 2026', description: 'First installment' },
          { id: 2, month: 'Feb 2026', due: 5000, paid: 5000, status: 'paid', paymentDate: 'Feb 5, 2026', description: 'Second installment' },
          { id: 3, month: 'Mar 2026', due: 5000, paid: 5000, status: 'paid', paymentDate: 'Mar 5, 2026', description: 'Third installment' },
          { id: 4, month: 'Apr 2026', due: 5000, paid: 5000, status: 'paid', paymentDate: 'Apr 5, 2026', description: 'Fourth installment' },
          { id: 5, month: 'May 2026', due: 5000, paid: 5000, status: 'paid', paymentDate: 'May 5, 2026', description: 'Fifth installment' },
          { id: 6, month: 'Jun 2026', due: 5000, paid: 5000, status: 'paid', paymentDate: 'Jun 5, 2026', description: 'Sixth installment' },
          { id: 7, month: 'Jul 2026', due: 5000, paid: 5000, status: 'paid', paymentDate: 'Jul 5, 2026', description: 'Seventh installment' },
          { id: 8, month: 'Aug 2026', due: 5000, paid: 5000, status: 'paid', paymentDate: 'Aug 5, 2026', description: 'Eighth installment' },
          { id: 9, month: 'Sep 2026', due: 5000, paid: 5000, status: 'paid', paymentDate: 'Sep 5, 2026', description: 'Ninth installment' },
          { id: 10, month: 'Oct 2026', due: 5000, paid: 5000, status: 'paid', paymentDate: 'Oct 5, 2026', description: 'Tenth installment' },
        ]
      },
      { 
        id: 5, 
        customer: 'Zainab Khan', 
        caseNo: 'SR-009', 
        amount: 35000, 
        paid: 20000, 
        balance: 15000,
        monthly: 3000,
        date: '2026-03-01',
        status: 'pending',
        cnic: '12345-6789012-1',
        phone: '0300-5678901',
        address: 'House #45, Street 40, Lahore',
        product: 'LG Refrigerator',
        employeeId: 1,
        guarantors: [],
        installments: [
          { id: 1, month: 'Mar 2026', due: 3000, paid: 3000, status: 'paid', paymentDate: 'Mar 1, 2026', description: 'First installment' },
          { id: 2, month: 'Apr 2026', due: 3000, paid: 3000, status: 'paid', paymentDate: 'Apr 1, 2026', description: 'Second installment' },
          { id: 3, month: 'May 2026', due: 3000, paid: 2000, status: 'partial', paymentDate: 'May 1, 2026', description: 'Partial payment' },
          { id: 4, month: 'Jun 2026', due: 3000, paid: 0, status: 'unpaid', paymentDate: '-', description: 'Awaiting payment' },
        ]
      },
      { 
        id: 6, 
        customer: 'Hina Riaz', 
        caseNo: 'SR-010', 
        amount: 25000, 
        paid: 25000, 
        balance: 0,
        monthly: 0,
        date: '2026-03-15',
        status: 'paid',
        cnic: '12345-6789012-2',
        phone: '0300-6789012',
        address: 'House #67, Street 50, Lahore',
        product: 'Sony Soundbar',
        employeeId: 2,
        guarantors: [],
        installments: [
          { id: 1, month: 'Mar 2026', due: 25000, paid: 25000, status: 'paid', paymentDate: 'Mar 15, 2026', description: 'Full payment' },
        ]
      },
    ]
  });

  const getEmployeeAccounts = (employeeId) => {
    if (!employeeId) return allData.accounts;
    return allData.accounts.filter(acc => acc.employeeId === employeeId);
  };

  const getEmployeeStats = (employeeId) => {
    const accounts = getEmployeeAccounts(employeeId);
    const total = accounts.length;
    const totalRecovery = accounts.reduce((sum, acc) => sum + acc.amount, 0);
    const overdue = accounts.filter(acc => acc.balance > 0).length;
    const paid = accounts.filter(acc => acc.status === 'paid').length;
    const pending = accounts.filter(acc => acc.status === 'pending').length;
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const newAccounts = accounts.filter(acc => {
      const accDate = new Date(acc.date);
      return accDate.getMonth() === currentMonth && accDate.getFullYear() === currentYear;
    }).length;

    return {
      totalAccounts: total,
      newAccounts: newAccounts,
      totalRecovery: totalRecovery,
      overdueAccounts: overdue,
      paidAccounts: paid,
      pendingAccounts: pending,
      accounts: accounts
    };
  };

  const selectedEmployeeData = selectedEmployeeId ? getEmployeeStats(selectedEmployeeId) : getEmployeeStats(null);
  const selectedEmployee = employeesList.find(emp => emp.id === selectedEmployeeId);

  const filteredAccounts = selectedEmployeeData.accounts.filter(item => {
    if (!isEmployee && search) {
      return item.customer.toLowerCase().includes(search.toLowerCase()) ||
        item.caseNo.toLowerCase().includes(search.toLowerCase()) ||
        item.product.toLowerCase().includes(search.toLowerCase());
    }
    return true;
  });

  const getCurrentMonthAccounts = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    return selectedEmployeeData.accounts.filter(acc => {
      const accDate = new Date(acc.date);
      return accDate.getMonth() === currentMonth && accDate.getFullYear() === currentYear;
    });
  };

  const currentMonthAccounts = getCurrentMonthAccounts();
  const overdueAccounts = selectedEmployeeData.accounts.filter(acc => acc.balance > 0);

  const openAccountModal = (account) => {
    setSelectedAccount(account);
    setShowAccountModal(true);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'paid': return '#22c55e';
      case 'pending': return '#f59e0b';
      case 'overdue': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'paid': return 'Paid';
      case 'pending': return 'Pending';
      case 'overdue': return 'Overdue';
      default: return 'Unknown';
    }
  };

  const getEmployeeName = (id) => {
    const emp = employeesList.find(e => e.id === id);
    return emp ? emp.name : 'All Employees';
  };

  // ===== COLORFUL CARDS =====
  const cards = isEmployee ? [
    { 
      key: 'new', 
      label: 'New Accounts', 
      value: currentMonthAccounts.length,
      icon: TrendingUp,
      color: '#2563eb',
      bg: 'rgba(37, 99, 235, 0.12)',
      className: 'new-accounts-card'
    },
    { 
      key: 'recovery', 
      label: 'Recovery Due', 
      value: `PKR ${selectedEmployeeData.totalRecovery.toLocaleString()}`,
      icon: DollarSign,
      color: '#C9A84C',
      bg: 'rgba(201, 168, 76, 0.15)',
      className: 'recovery-card'
    },
    { 
      key: 'overdue', 
      label: 'Overdue', 
      value: overdueAccounts.length,
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
      label: 'New Accounts', 
      value: currentMonthAccounts.length,
      icon: TrendingUp,
      color: '#2563eb',
      bg: 'rgba(37, 99, 235, 0.12)',
      className: 'new-accounts-card'
    },
    { 
      key: 'recovery', 
      label: 'Recovery Due', 
      value: `PKR ${selectedEmployeeData.totalRecovery.toLocaleString()}`,
      icon: DollarSign,
      color: '#C9A84C',
      bg: 'rgba(201, 168, 76, 0.15)',
      className: 'recovery-card'
    },
    { 
      key: 'overdue', 
      label: 'Overdue', 
      value: overdueAccounts.length,
      icon: AlertTriangle,
      color: '#dc2626',
      bg: 'rgba(220, 38, 38, 0.12)',
      className: 'overdue-card-main'
    },
  ];

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
                  filteredAccounts.map((item, index) => (
                    <tr key={item.id} className={`${item.status === 'overdue' ? 'overdue-row' : ''} ${index % 2 === 0 ? 'even-row' : 'odd-row'}`}>
                      <td className="case-number">{item.caseNo}</td>
                      <td>
                        <div className="customer-info">
                          <div className="customer-avatar" style={{ background: item.status === 'paid' ? '#d1fae5' : item.status === 'overdue' ? '#fee2e2' : '#fef3c7', color: item.status === 'paid' ? '#065f46' : item.status === 'overdue' ? '#991b1b' : '#92400e' }}>
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
                          {item.date}
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${item.status}`}>
                          {item.status === 'paid' ? 'Paid' : 
                           item.status === 'pending' ? 'Pending' : 'Overdue'}
                        </span>
                      </td>
                      <td>
                        <div className="action-group">
                          <button 
                            className="btn-view-account" 
                            onClick={() => openAccountModal(item)}
                            title="View Account Details"
                          >
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

    if (activeTab === 'new') {
      const accounts = isEmployee ? currentMonthAccounts : currentMonthAccounts;
      return (
        <div className="table-container">
          <div className="table-header">
            <div className="table-header-left">
              <FileText size={18} style={{ color: '#2563eb' }} />
              <h3>New Accounts (This Month)</h3>
              <span className="record-count">{accounts.length} accounts</span>
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
                {accounts.length === 0 ? (
                  <tr><td colSpan="7" className="no-data">No new accounts this month</td></tr>
                ) : (
                  accounts.map((item, index) => (
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
                          {item.date}
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${item.status}`}>
                          {item.status === 'paid' ? 'Paid' : 
                           item.status === 'pending' ? 'Pending' : 'Overdue'}
                        </span>
                      </td>
                      <td>
                        <div className="action-group">
                          <button 
                            className="btn-view-account" 
                            onClick={() => openAccountModal(item)}
                            title="View Account Details"
                          >
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

    if (activeTab === 'recovery') {
      const accounts = selectedEmployeeData.accounts.filter(acc => acc.balance > 0);
      return (
        <div className="table-container">
          <div className="table-header">
            <div className="table-header-left">
              <FileText size={18} style={{ color: '#C9A84C' }} />
              <h3>Recovery Due</h3>
              <span className="record-count">{accounts.length} customers</span>
            </div>
          </div>
          <div className="table-scroll">
            <table className="accounts-table">
              <thead>
                <tr>
                  <th>Case #</th>
                  <th>Customer</th>
                  <th>Product</th>
                  <th>Total (PKR)</th>
                  <th>Paid (PKR)</th>
                  <th>Balance (PKR)</th>
                  <th>Monthly</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {accounts.length === 0 ? (
                  <tr><td colSpan="8" className="no-data">No recovery due</td></tr>
                ) : (
                  accounts.map((item, index) => (
                    <tr key={item.id} className={`overdue-row ${index % 2 === 0 ? 'even-row' : 'odd-row'}`}>
                      <td className="case-number">{item.caseNo}</td>
                      <td>
                        <div className="customer-info">
                          <div className="customer-avatar">{item.customer.charAt(0)}</div>
                          {item.customer}
                        </div>
                      </td>
                      <td>{item.product}</td>
                      <td className="amount">PKR {item.amount.toLocaleString()}</td>
                      <td className="paid-amount">PKR {item.paid.toLocaleString()}</td>
                      <td className="balance-amount">PKR {item.balance.toLocaleString()}</td>
                      <td>{item.monthly > 0 ? `PKR ${item.monthly.toLocaleString()}` : '---'}</td>
                      <td>
                        <div className="action-group">
                          <button 
                            className="btn-view-account" 
                            onClick={() => openAccountModal(item)}
                            title="View Account Details"
                          >
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
      const accounts = selectedEmployeeData.accounts.filter(acc => acc.balance > 0);
      return (
        <div className="table-container">
          <div className="table-header">
            <div className="table-header-left">
              <FileText size={18} style={{ color: '#dc2626' }} />
              <h3>Overdue Accounts</h3>
              <span className="record-count">{accounts.length} customers</span>
            </div>
          </div>
          <div className="table-scroll">
            <table className="accounts-table">
              <thead>
                <tr>
                  <th>Case #</th>
                  <th>Customer</th>
                  <th>Product</th>
                  <th>Total (PKR)</th>
                  <th>Paid (PKR)</th>
                  <th>Balance (PKR)</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {accounts.length === 0 ? (
                  <tr><td colSpan="8" className="no-data">No overdue accounts</td></tr>
                ) : (
                  accounts.map((item, index) => (
                    <tr key={item.id} className={`overdue-row ${index % 2 === 0 ? 'even-row' : 'odd-row'}`}>
                      <td className="case-number">{item.caseNo}</td>
                      <td>
                        <div className="customer-info">
                          <div className="customer-avatar">{item.customer.charAt(0)}</div>
                          {item.customer}
                        </div>
                      </td>
                      <td>{item.product}</td>
                      <td className="amount">PKR {item.amount.toLocaleString()}</td>
                      <td className="paid-amount">PKR {item.paid.toLocaleString()}</td>
                      <td className="balance-amount">PKR {item.balance.toLocaleString()}</td>
                      <td>
                        <span className={`status-badge ${item.status}`}>
                          {item.status === 'paid' ? 'Paid' : 
                           item.status === 'pending' ? 'Pending' : 'Overdue'}
                        </span>
                      </td>
                      <td>
                        <div className="action-group">
                          <button 
                            className="btn-view-account" 
                            onClick={() => openAccountModal(item)}
                            title="View Account Details"
                          >
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
            <span className="selected-employee-role">{selectedEmployee.role} • Branch {selectedEmployee.branch}</span>
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

      {/* ===== ACCOUNT DETAIL MODAL - WITH INSTALLMENT TABLE ===== */}
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
              {/* Customer Info */}
              <div className="account-detail-header">
                <div className="account-detail-avatar" style={{ background: selectedAccount.status === 'paid' ? '#065f46' : selectedAccount.status === 'overdue' ? '#991b1b' : '#1E1B4B' }}>
                  {selectedAccount.customer.charAt(0)}
                </div>
                <div className="account-detail-info">
                  <h4 style={{ fontWeight: 700 }}>{selectedAccount.customer}</h4>
                  <span className="account-detail-case" style={{ fontWeight: 600 }}>Case: {selectedAccount.caseNo}</span>
                  <span className="account-detail-product" style={{ fontWeight: 500 }}>Product: {selectedAccount.product}</span>
                </div>
                <div className="account-detail-status">
                  <span className={`status-badge ${selectedAccount.status}`}>
                    {selectedAccount.status === 'paid' ? 'Paid' : 
                     selectedAccount.status === 'pending' ? 'Pending' : 'Overdue'}
                  </span>
                </div>
              </div>

              {/* Personal Info */}
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

              {/* Guarantors */}
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

              {/* ===== INSTALLMENT PAYMENT HISTORY TABLE ===== */}
              <div className="installment-details-section">
                <div className="section-header">
                  <h4 style={{ fontWeight: 700 }}>Installment Payment History</h4>
                </div>

                <div className="table-scroll">
                  <table className="installment-history-table">
                    <thead>
                      <tr>
                        <th style={{ fontWeight: 800 }}>#</th>
                        <th style={{ fontWeight: 800 }}>Due Date</th>
                        <th style={{ fontWeight: 800 }}>Installment Amount</th>
                        <th style={{ fontWeight: 800 }}>Amount Paid</th>
                        <th style={{ fontWeight: 800 }}>Balance</th>
                        <th style={{ fontWeight: 800 }}>Status</th>
                        <th style={{ fontWeight: 800 }}>Payment Date</th>
                        <th style={{ fontWeight: 800 }}>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedAccount.installments && selectedAccount.installments.length > 0 ? (
                        selectedAccount.installments.map((inst, index) => {
                          const balance = inst.due - inst.paid;
                          return (
                            <tr key={inst.id} className={`${inst.status === 'unpaid' ? 'overdue-row' : ''} ${index % 2 === 0 ? 'even-row' : 'odd-row'}`}>
                              <td style={{ fontWeight: 700 }}>{index + 1}</td>
                              <td style={{ fontWeight: 600 }}>{inst.month}</td>
                              <td style={{ fontWeight: 600 }}>PKR {inst.due.toLocaleString()}</td>
                              <td className={inst.paid > 0 ? 'paid-amount' : ''} style={{ fontWeight: 700 }}>
                                PKR {inst.paid.toLocaleString()}
                              </td>
                              <td className={balance > 0 ? 'balance-amount' : 'paid-amount'} style={{ fontWeight: 700 }}>
                                PKR {balance.toLocaleString()}
                              </td>
                              <td>
                                <span className={`status-badge ${inst.status}`} style={{ fontWeight: 700 }}>
                                  {inst.status === 'paid' ? 'Paid' : 
                                   inst.status === 'partial' ? 'Partial' : 'Pending'}
                                </span>
                              </td>
                              <td style={{ fontWeight: 500 }}>{inst.paymentDate || '-'}</td>
                              <td className="description-cell" style={{ fontWeight: 500 }}>{inst.description || '-'}</td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr><td colSpan="8" className="no-data">No installment records found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* ===== PAY NOW WITH INPUT FIELD ===== */}
                {selectedAccount.balance > 0 && (
                  <div className="pay-now-section">
                    <div className="pay-now-row">
                      <div className="pay-input-group">
                        <span className="pay-currency" style={{ fontWeight: 700 }}>PKR</span>
                        <input 
                          type="number" 
                          className="pay-amount-input"
                          placeholder="Enter amount"
                          min="1"
                          max={selectedAccount.balance}
                          defaultValue={selectedAccount.balance}
                          id={`payAmount_${selectedAccount.id}`}
                          style={{ fontWeight: 600 }}
                        />
                      </div>
                      <button 
                        className="btn-pay-now-full"
                        onClick={() => {
                          const input = document.getElementById(`payAmount_${selectedAccount.id}`);
                          const amount = parseInt(input.value);
                          
                          if (!amount || amount <= 0) {
                            alert('Please enter a valid amount');
                            return;
                          }
                          
                          if (amount > selectedAccount.balance) {
                            alert(`Amount cannot exceed balance: PKR ${selectedAccount.balance.toLocaleString()}`);
                            return;
                          }
                          
                          const newBalance = selectedAccount.balance - amount;
                          const newPaid = selectedAccount.paid + amount;
                          
                          const updatedAccounts = allData.accounts.map(acc => {
                            if (acc.id === selectedAccount.id) {
                              return {
                                ...acc,
                                balance: newBalance,
                                paid: newPaid,
                                status: newBalance === 0 ? 'paid' : acc.status
                              };
                            }
                            return acc;
                          });
                          
                          setAllData({ ...allData, accounts: updatedAccounts });
                          
                          setSelectedAccount({
                            ...selectedAccount,
                            balance: newBalance,
                            paid: newPaid,
                            status: newBalance === 0 ? 'paid' : selectedAccount.status
                          });
                          
                          alert(`Payment of PKR ${amount.toLocaleString()} successful!\nRemaining Balance: PKR ${newBalance.toLocaleString()}`);
                        }}
                      >
                        <DollarSign size={18} />
                        Pay Now
                      </button>
                    </div>
                    <p className="pay-hint" style={{ fontWeight: 600 }}>Enter amount to pay (Max: PKR {selectedAccount.balance.toLocaleString()})</p>
                  </div>
                )}

                {/* Description */}
                <div className="installment-description">
                  <label style={{ fontWeight: 700 }}>Description</label>
                  <textarea 
                    className="description-textarea"
                    placeholder="Add description here..."
                    rows="3"
                  ></textarea>
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