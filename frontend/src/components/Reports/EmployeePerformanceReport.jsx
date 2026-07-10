import React, { useState, useEffect } from 'react';
import { Search, User, DollarSign, Users, Briefcase, Calendar, Clock, Award, Building, Download, Eye, X, TrendingUp, CheckCircle, AlertCircle, AlertTriangle, FileText, Filter } from 'lucide-react';
import './EmployeePerformanceReport.css';

const EmployeePerformanceReport = () => {
  const [search, setSearch] = useState('');
  const [userBranch, setUserBranch] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [activeTab, setActiveTab] = useState('total');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setUserRole(user.role);
      setUserBranch(user.branch);
    }
  }, []);

  // ===== COMPLETE DATA WITH ACCOUNTS =====
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
        guarantors: [
          { name: 'Ali Raza', cnic: '12345-6789012-4', phone: '0300-7654321', address: 'House #34, Street 8' },
          { name: 'Zainab Khan', cnic: '12345-6789012-5', phone: '0300-9876543', address: 'House #56, Street 10' }
        ],
        installments: [
          { month: 'Jan 2026', due: 5000, paid: 5000, status: 'paid' },
          { month: 'Feb 2026', due: 5000, paid: 5000, status: 'paid' },
          { month: 'Mar 2026', due: 5000, paid: 5000, status: 'paid' },
          { month: 'Apr 2026', due: 5000, paid: 3000, status: 'partial' },
          { month: 'May 2026', due: 5000, paid: 0, status: 'unpaid' },
          { month: 'Jun 2026', due: 5000, paid: 0, status: 'unpaid' },
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
        guarantors: [
          { name: 'Fatima Noor', cnic: '12345-6789012-7', phone: '0300-8765432', address: 'House #90, Street 15' }
        ],
        installments: [
          { month: 'Jan 2026', due: 4000, paid: 4000, status: 'paid' },
          { month: 'Feb 2026', due: 4000, paid: 4000, status: 'paid' },
          { month: 'Mar 2026', due: 4000, paid: 4000, status: 'paid' },
          { month: 'Apr 2026', due: 4000, paid: 2000, status: 'partial' },
          { month: 'May 2026', due: 4000, paid: 0, status: 'unpaid' },
          { month: 'Jun 2026', due: 4000, paid: 0, status: 'unpaid' },
          { month: 'Jul 2026', due: 4000, paid: 0, status: 'unpaid' },
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
        guarantors: [
          { name: 'Hina Riaz', cnic: '12345-6789012-9', phone: '0300-6543210', address: 'House #34, Street 25' }
        ],
        installments: [
          { month: 'Feb 2026', due: 3000, paid: 0, status: 'unpaid' },
          { month: 'Mar 2026', due: 3000, paid: 0, status: 'unpaid' },
          { month: 'Apr 2026', due: 3000, paid: 0, status: 'unpaid' },
          { month: 'May 2026', due: 3000, paid: 0, status: 'unpaid' },
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
        guarantors: [],
        installments: [
          { month: 'Jan 2026', due: 5000, paid: 5000, status: 'paid' },
          { month: 'Feb 2026', due: 5000, paid: 5000, status: 'paid' },
          { month: 'Mar 2026', due: 5000, paid: 5000, status: 'paid' },
          { month: 'Apr 2026', due: 5000, paid: 5000, status: 'paid' },
          { month: 'May 2026', due: 5000, paid: 5000, status: 'paid' },
          { month: 'Jun 2026', due: 5000, paid: 5000, status: 'paid' },
          { month: 'Jul 2026', due: 5000, paid: 5000, status: 'paid' },
          { month: 'Aug 2026', due: 5000, paid: 5000, status: 'paid' },
          { month: 'Sep 2026', due: 5000, paid: 5000, status: 'paid' },
          { month: 'Oct 2026', due: 5000, paid: 5000, status: 'paid' },
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
        guarantors: [],
        installments: [
          { month: 'Mar 2026', due: 3000, paid: 3000, status: 'paid' },
          { month: 'Apr 2026', due: 3000, paid: 3000, status: 'paid' },
          { month: 'May 2026', due: 3000, paid: 2000, status: 'partial' },
          { month: 'Jun 2026', due: 3000, paid: 0, status: 'unpaid' },
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
        guarantors: [],
        installments: [
          { month: 'Mar 2026', due: 25000, paid: 25000, status: 'paid' },
        ]
      },
    ]
  });

  // ===== GET CURRENT MONTH ACCOUNTS =====
  const getCurrentMonthAccounts = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return allData.accounts.filter(acc => {
      const accDate = new Date(acc.date);
      return accDate.getMonth() === currentMonth && accDate.getFullYear() === currentYear;
    });
  };

  const currentMonthAccounts = getCurrentMonthAccounts();
  const overdueAccounts = allData.accounts.filter(acc => acc.balance > 0);
  const recoveryDue = allData.accounts.filter(acc => acc.balance > 0);

  // ===== FILTER ACCOUNTS =====
  const filteredAccounts = allData.accounts.filter(item => {
    const searchMatch = item.customer.toLowerCase().includes(search.toLowerCase()) ||
      item.caseNo.toLowerCase().includes(search.toLowerCase()) ||
      item.product.toLowerCase().includes(search.toLowerCase());
    return searchMatch;
  });

  // ===== VIEW ACCOUNT DETAIL =====
  const openAccountModal = (account) => {
    setSelectedAccount(account);
    setShowAccountModal(true);
  };

  // ===== GET STATUS COLOR =====
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

  const branchLabel = userBranch ? `Branch ${userBranch}` : 'All Branches';

  // ===== CARDS DATA =====
  const cards = [
    { 
      key: 'total', 
      label: 'Total Accounts', 
      value: allData.totalAccounts,
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
      bg: 'rgba(37, 99, 235, 0.1)',
      className: 'new-accounts-card'
    },
    { 
      key: 'recovery', 
      label: 'Recovery Due', 
      value: `PKR ${allData.totalRecovery.toLocaleString()}`,
      icon: DollarSign,
      color: '#C9A84C',
      bg: 'rgba(201, 168, 76, 0.1)',
      className: 'recovery-card'
    },
    { 
      key: 'overdue', 
      label: 'Overdue', 
      value: overdueAccounts.length,
      icon: AlertTriangle,
      color: '#dc2626',
      bg: 'rgba(220, 38, 38, 0.1)',
      className: 'overdue-card-main'
    },
  ];

  // ===== RENDER TABLE BASED ON ACTIVE TAB =====
  const renderTable = () => {
    if (activeTab === 'total') {
      return (
        <div className="table-container">
          <div className="table-header">
            <div className="table-header-left">
              <FileText size={18} />
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
                  filteredAccounts.map((item) => (
                    <tr key={item.id} className={item.status === 'overdue' ? 'overdue-row' : ''}>
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
      return (
        <div className="table-container">
          <div className="table-header">
            <div className="table-header-left">
              <FileText size={18} />
              <h3>New Accounts (This Month)</h3>
              <span className="record-count">{currentMonthAccounts.length} accounts</span>
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
                {currentMonthAccounts.length === 0 ? (
                  <tr><td colSpan="7" className="no-data">No new accounts this month</td></tr>
                ) : (
                  currentMonthAccounts.map((item) => (
                    <tr key={item.id}>
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
      return (
        <div className="table-container">
          <div className="table-header">
            <div className="table-header-left">
              <FileText size={18} />
              <h3>Recovery Due</h3>
              <span className="record-count">{recoveryDue.length} customers</span>
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
                {recoveryDue.length === 0 ? (
                  <tr><td colSpan="8" className="no-data">No recovery due</td></tr>
                ) : (
                  recoveryDue.map((item) => (
                    <tr key={item.id} className="overdue-row">
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
      return (
        <div className="table-container">
          <div className="table-header">
            <div className="table-header-left">
              <FileText size={18} />
              <h3>Overdue Accounts</h3>
              <span className="record-count">{overdueAccounts.length} customers</span>
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
                {overdueAccounts.length === 0 ? (
                  <tr><td colSpan="8" className="no-data">No overdue accounts</td></tr>
                ) : (
                  overdueAccounts.map((item) => (
                    <tr key={item.id} className="overdue-row">
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

  return (
    <div className="employee-performance-container">
      {/* ===== HEADER ===== */}
      <div className="performance-header">
        <div className="header-left">
          <div className="header-title-group">
            <h2>Employee Report</h2>
            <span className="live-badge">
              <Clock size={12} /> Live
            </span>
          </div>
          <p className="subtitle">Complete employee performance overview</p>
        </div>
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search by customer, case or product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ===== 4 STATS CARDS ===== */}
      <div className="stats-grid-4">
        {cards.map((card) => (
          <div 
            key={card.key}
            className={`stat-card ${card.className} ${activeTab === card.key ? 'active' : ''}`}
            onClick={() => setActiveTab(card.key)}
          >
            <div className="stat-icon" style={{ background: card.bg, color: card.color }}>
              <card.icon size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-label">{card.label}</span>
              <span className="stat-value">{card.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ===== RENDER TABLE BASED ON ACTIVE TAB ===== */}
      {renderTable()}

      {/* ===== ACCOUNT DETAIL MODAL (Full Screen) ===== */}
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
                <div className="account-detail-avatar">{selectedAccount.customer.charAt(0)}</div>
                <div className="account-detail-info">
                  <h4>{selectedAccount.customer}</h4>
                  <span className="account-detail-case">Case: {selectedAccount.caseNo}</span>
                  <span className="account-detail-product">Product: {selectedAccount.product}</span>
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
                  <span>CNIC</span>
                  <strong>{selectedAccount.cnic}</strong>
                </div>
                <div className="account-detail-item">
                  <span>Phone</span>
                  <strong>{selectedAccount.phone}</strong>
                </div>
                <div className="account-detail-item">
                  <span>Address</span>
                  <strong>{selectedAccount.address}</strong>
                </div>
                <div className="account-detail-item">
                  <span>Total Amount</span>
                  <strong>PKR {selectedAccount.amount.toLocaleString()}</strong>
                </div>
                <div className="account-detail-item">
                  <span>Paid Amount</span>
                  <strong className="paid-amount">PKR {selectedAccount.paid.toLocaleString()}</strong>
                </div>
                <div className="account-detail-item">
                  <span>Balance</span>
                  <strong className={selectedAccount.balance > 0 ? 'balance-amount' : 'paid-amount'}>
                    PKR {selectedAccount.balance.toLocaleString()}
                  </strong>
                </div>
              </div>

              {/* Guarantors */}
              {selectedAccount.guarantors && selectedAccount.guarantors.length > 0 && (
                <div className="guarantors-section">
                  <h4>Guarantors</h4>
                  {selectedAccount.guarantors.map((g, index) => (
                    <div key={index} className="guarantor-item">
                      <div className="guarantor-info">
                        <span>Name: {g.name}</span>
                        <span>CNIC: {g.cnic}</span>
                        <span>Phone: {g.phone}</span>
                        <span>Address: {g.address}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Installment History */}
              {selectedAccount.installments && selectedAccount.installments.length > 0 && (
                <div className="installment-history">
                  <div className="history-header">
                    <h4>Installment History</h4>
                    <span className="history-badge">{selectedAccount.installments.length} Months</span>
                  </div>
                  <div className="history-scroll">
                    <table className="history-table">
                      <thead>
                        <tr>
                          <th>Month</th>
                          <th>Due (PKR)</th>
                          <th>Paid (PKR)</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedAccount.installments.map((inst, index) => (
                          <tr key={index} className={inst.status === 'unpaid' ? 'overdue-row' : ''}>
                            <td className="month-cell">{inst.month}</td>
                            <td>PKR {inst.due.toLocaleString()}</td>
                            <td className={inst.paid >= inst.due ? 'paid-amount' : 'balance-amount'}>
                              PKR {inst.paid.toLocaleString()}
                            </td>
                            <td>
                              <span className={`status-badge ${inst.status}`}>
                                {inst.status === 'paid' ? 'Paid' : 
                                 inst.status === 'partial' ? 'Partial' : 'Unpaid'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="epr-modal-footer">
              <button className="btn-cancel" onClick={() => setShowAccountModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeePerformanceReport;