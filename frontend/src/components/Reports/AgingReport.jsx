import React, { useState, useEffect } from 'react';
import { Search, Calendar, DollarSign, User, Building, AlertTriangle, Clock, Eye, FileText, Download, Filter, X, Users } from 'lucide-react';
import './AgingReport.css';

const AgingReport = () => {
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [userBranch, setUserBranch] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setUserRole(user.role);
      setUserBranch(user.branch);
      if (user.branch) {
        setBranchFilter(user.branch);
      }
    }
  }, []);

  // ===== GET CURRENT MONTH =====
  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  const currentMonth = getCurrentMonth();

  // ===== AGING DATA =====
  const [agingData, setAgingData] = useState([
    {
      id: 1,
      customer: 'Ahmed Khan',
      caseNo: 'SR-001',
      branch: 1,
      description: 'Samsung LED 55"',
      monthlyInstallment: 5000,
      totalAmount: 60000,
      paidAmount: 25000,
      balance: 35000,
      lastPaymentDate: '2026-03-01',
      dueDate: '2026-01-15',
      overdueMonths: 4,
      installments: [
        { month: '2026-01', due: 5000, paid: 5000, status: 'paid' },
        { month: '2026-02', due: 5000, paid: 5000, status: 'paid' },
        { month: '2026-03', due: 5000, paid: 5000, status: 'paid' },
        { month: '2026-04', due: 5000, paid: 3000, status: 'partial' },
        { month: '2026-05', due: 5000, paid: 0, status: 'unpaid' },
        { month: '2026-06', due: 5000, paid: 0, status: 'unpaid' },
        { month: '2026-07', due: 5000, paid: 0, status: 'unpaid' },
        { month: '2026-08', due: 5000, paid: 0, status: 'unpaid' },
      ]
    },
    {
      id: 2,
      customer: 'Usman Malik',
      caseNo: 'SR-003',
      branch: 1,
      description: 'Dell Laptop',
      monthlyInstallment: 4000,
      totalAmount: 40000,
      paidAmount: 15000,
      balance: 25000,
      lastPaymentDate: '2026-03-15',
      dueDate: '2026-01-20',
      overdueMonths: 4,
      installments: [
        { month: '2026-01', due: 4000, paid: 4000, status: 'paid' },
        { month: '2026-02', due: 4000, paid: 4000, status: 'paid' },
        { month: '2026-03', due: 4000, paid: 4000, status: 'paid' },
        { month: '2026-04', due: 4000, paid: 2000, status: 'partial' },
        { month: '2026-05', due: 4000, paid: 0, status: 'unpaid' },
        { month: '2026-06', due: 4000, paid: 0, status: 'unpaid' },
        { month: '2026-07', due: 4000, paid: 0, status: 'unpaid' },
        { month: '2026-08', due: 4000, paid: 0, status: 'unpaid' },
        { month: '2026-09', due: 4000, paid: 0, status: 'unpaid' },
        { month: '2026-10', due: 4000, paid: 0, status: 'unpaid' },
      ]
    },
    {
      id: 3,
      customer: 'Bilal Ahmed',
      caseNo: 'SR-007',
      branch: 1,
      description: 'Samsung Galaxy S24',
      monthlyInstallment: 3000,
      totalAmount: 30000,
      paidAmount: 0,
      balance: 30000,
      lastPaymentDate: '2026-02-10',
      dueDate: '2026-02-10',
      overdueMonths: 5,
      installments: [
        { month: '2026-02', due: 3000, paid: 0, status: 'unpaid' },
        { month: '2026-03', due: 3000, paid: 0, status: 'unpaid' },
        { month: '2026-04', due: 3000, paid: 0, status: 'unpaid' },
        { month: '2026-05', due: 3000, paid: 0, status: 'unpaid' },
        { month: '2026-06', due: 3000, paid: 0, status: 'unpaid' },
        { month: '2026-07', due: 3000, paid: 0, status: 'unpaid' },
        { month: '2026-08', due: 3000, paid: 0, status: 'unpaid' },
        { month: '2026-09', due: 3000, paid: 0, status: 'unpaid' },
      ]
    },
    {
      id: 4,
      customer: 'Fatima Noor',
      caseNo: 'SR-004',
      branch: 2,
      description: 'Sony LED 65"',
      monthlyInstallment: 6000,
      totalAmount: 80000,
      paidAmount: 42000,
      balance: 38000,
      lastPaymentDate: '2026-06-01',
      dueDate: '2026-01-25',
      overdueMonths: 3,
      installments: [
        { month: '2026-01', due: 6000, paid: 6000, status: 'paid' },
        { month: '2026-02', due: 6000, paid: 6000, status: 'paid' },
        { month: '2026-03', due: 6000, paid: 6000, status: 'paid' },
        { month: '2026-04', due: 6000, paid: 6000, status: 'paid' },
        { month: '2026-05', due: 6000, paid: 6000, status: 'paid' },
        { month: '2026-06', due: 6000, paid: 4000, status: 'partial' },
        { month: '2026-07', due: 6000, paid: 8000, status: 'paid' },
        { month: '2026-08', due: 6000, paid: 0, status: 'unpaid' },
        { month: '2026-09', due: 6000, paid: 0, status: 'unpaid' },
        { month: '2026-10', due: 6000, paid: 0, status: 'unpaid' },
      ]
    },
    {
      id: 5,
      customer: 'Hina Riaz',
      caseNo: 'SR-008',
      branch: 2,
      description: 'LG Refrigerator',
      monthlyInstallment: 5000,
      totalAmount: 50000,
      paidAmount: 1000,
      balance: 49000,
      lastPaymentDate: '2026-02-15',
      dueDate: '2026-02-15',
      overdueMonths: 5,
      installments: [
        { month: '2026-02', due: 5000, paid: 1000, status: 'partial' },
        { month: '2026-03', due: 5000, paid: 0, status: 'unpaid' },
        { month: '2026-04', due: 5000, paid: 0, status: 'unpaid' },
        { month: '2026-05', due: 5000, paid: 0, status: 'unpaid' },
        { month: '2026-06', due: 5000, paid: 0, status: 'unpaid' },
        { month: '2026-07', due: 5000, paid: 0, status: 'unpaid' },
        { month: '2026-08', due: 5000, paid: 0, status: 'unpaid' },
        { month: '2026-09', due: 5000, paid: 0, status: 'unpaid' },
        { month: '2026-10', due: 5000, paid: 0, status: 'unpaid' },
      ]
    },
  ]);

  // ===== FILTER DATA =====
  const filtered = agingData.filter(item => {
    const searchMatch = item.customer.toLowerCase().includes(search.toLowerCase()) ||
      item.caseNo.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase());
    
    let branchMatch = true;
    if (userBranch) {
      branchMatch = item.branch === parseInt(userBranch);
    } else if (branchFilter !== 'all') {
      branchMatch = item.branch === parseInt(branchFilter);
    }
    
    return searchMatch && branchMatch;
  });

  // ===== PAGINATION =====
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filtered.slice(startIndex, startIndex + itemsPerPage);

  // ===== TOTALS =====
  const totalRecords = filtered.length;
  const totalBalance = filtered.reduce((sum, item) => sum + item.balance, 0);
  const avgOverdueMonths = totalRecords > 0 ? Math.round(filtered.reduce((sum, item) => sum + item.overdueMonths, 0) / totalRecords) : 0;

  // ===== OVERDUE BADGE =====
  const getOverdueBadge = (months) => {
    if (months >= 6) return { color: '#dc2626', label: 'Critical' };
    if (months >= 4) return { color: '#f59e0b', label: 'High' };
    if (months >= 3) return { color: '#fcd34d', label: 'Medium' };
    return { color: '#22c55e', label: 'Low' };
  };

  // ===== VIEW DETAIL =====
  const openDetailModal = (customer) => {
    setSelectedCustomer(customer);
    setShowDetailModal(true);
  };

  const closeModal = () => {
    setShowDetailModal(false);
    setSelectedCustomer(null);
  };

  // ===== EXPORT =====
  const exportReport = () => {
    alert('Aging Report exported successfully!');
  };

  const branchLabel = userBranch ? `Branch ${userBranch}` : (branchFilter !== 'all' ? `Branch ${branchFilter}` : 'All Branches');

  // ===== CheckCircle icon component =====
  const CheckCircleIcon = () => (
    <svg className="check-circle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );

  return (
    <div className="aging-container">
      {/* ===== HEADER ===== */}
      <div className="aging-header">
        <div className="header-left">
          <div className="header-title-group">
            <h2>Aging Report</h2>
            <span className="live-badge">
              <Clock size={12} /> Live
            </span>
          </div>
          <div className="branch-label">
            <Building size={14} />
            <span>{branchLabel}</span>
          </div>
          <p className="subtitle">Customers with overdue payments (3+ months)</p>
        </div>
        <button className="btn-export" onClick={exportReport}>
          <Download size={18} />
          Export Report
        </button>
      </div>

      {/* ===== STATS - ONLY 2 CARDS ===== */}
      <div className="stats-grid">
        <div className="stat-card balance-card">
          <div className="stat-icon balance-icon"><DollarSign size={20} /></div>
          <div className="stat-info">
            <span className="stat-label">Total Balance</span>
            <span className="stat-value">PKR {totalBalance.toLocaleString()}</span>
          </div>
        </div>
        <div className="stat-card avg-card">
          <div className="stat-icon avg-icon"><Clock size={20} /></div>
          <div className="stat-info">
            <span className="stat-label">Average Overdue</span>
            <span className="stat-value">{avgOverdueMonths} months</span>
          </div>
        </div>
      </div>

      {/* ===== CONTROLS ===== */}
      <div className="aging-controls">
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search by customer, case or item..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        {!userBranch && (
          <div className="branch-filters">
            <button 
              className={`filter-btn ${branchFilter === 'all' ? 'active' : ''}`}
              onClick={() => { setBranchFilter('all'); setCurrentPage(1); }}
            >
              All
            </button>
            <button 
              className={`filter-btn branch-1 ${branchFilter === '1' ? 'active' : ''}`}
              onClick={() => { setBranchFilter('1'); setCurrentPage(1); }}
            >
              Branch 1
            </button>
            <button 
              className={`filter-btn branch-2 ${branchFilter === '2' ? 'active' : ''}`}
              onClick={() => { setBranchFilter('2'); setCurrentPage(1); }}
            >
              Branch 2
            </button>
          </div>
        )}
      </div>

      {/* ===== TABLE ===== */}
      <div className="table-container">
        <div className="table-header">
          <div className="table-header-left">
            <h3>Overdue Customers</h3>
            <span className="record-count">{totalRecords} entries</span>
          </div>
          <span className="aging-info">Showing customers with 3+ months overdue</span>
        </div>

        <div className="table-scroll">
          <table className="aging-table">
            <thead>
              <tr>
                <th>Case #</th>
                <th>Customer</th>
                <th>Description</th>
                <th>Balance</th>
                <th>Monthly</th>
                <th>Overdue</th>
                <th>Last Payment</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan="9" className="no-data">
                    <div className="no-data-content">
                      <CheckCircleIcon />
                      <p>No overdue customers found for {branchLabel}</p>
                      <span className="no-data-sub">All payments are up to date!</span>
                    </div>
                  </td>
                </tr>
              ) : (
                currentItems.map((item) => {
                  const badge = getOverdueBadge(item.overdueMonths);
                  return (
                    <tr key={item.id} className="overdue-row">
                      <td className="case-number">{item.caseNo}</td>
                      <td>
                        <div className="customer-info">
                          <div className="customer-avatar">{item.customer.charAt(0)}</div>
                          {item.customer}
                        </div>
                      </td>
                      <td className="description-cell">{item.description}</td>
                      <td className="balance-amount">PKR {item.balance.toLocaleString()}</td>
                      <td>PKR {item.monthlyInstallment.toLocaleString()}</td>
                      <td>
                        <span className="overdue-months-badge" style={{ background: badge.color }}>
                          {item.overdueMonths} months
                        </span>
                      </td>
                      <td className="last-payment">{item.lastPaymentDate}</td>
                      <td>
                        <span className={`status-badge ${item.overdueMonths >= 6 ? 'critical' : item.overdueMonths >= 4 ? 'high' : 'medium'}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="btn-view" 
                          onClick={() => openDetailModal(item)}
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
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
          <span className="page-info">
            {totalRecords > 0 ? (
              `Showing ${startIndex + 1} - ${Math.min(startIndex + itemsPerPage, totalRecords)} of ${totalRecords}`
            ) : (
              'No records'
            )}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            Next
          </button>
        </div>
      </div>

      {/* ===== DETAIL MODAL (Full Screen) ===== */}
      {showDetailModal && selectedCustomer && (
        <div className="aging-modal-overlay" onClick={closeModal}>
          <div className="aging-modal-content aging-modal-detail" onClick={(e) => e.stopPropagation()}>
            <div className="aging-modal-header">
              <div className="aging-modal-header-left">
                <User size={20} className="aging-modal-icon" />
                <h3>Customer Details</h3>
              </div>
              <button className="aging-modal-close" onClick={closeModal}>
                <X size={24} />
              </button>
            </div>

            <div className="aging-modal-body">
              <div className="customer-detail-header">
                <div className="customer-detail-avatar">{selectedCustomer.customer.charAt(0)}</div>
                <div className="customer-detail-info">
                  <h4>{selectedCustomer.customer}</h4>
                  <span className="customer-detail-case">Case: {selectedCustomer.caseNo}</span>
                  <span className="customer-detail-branch">Branch {selectedCustomer.branch}</span>
                </div>
                <div className="customer-detail-status">
                  <span className={`status-badge ${selectedCustomer.overdueMonths >= 6 ? 'critical' : selectedCustomer.overdueMonths >= 4 ? 'high' : 'medium'}`}>
                    {getOverdueBadge(selectedCustomer.overdueMonths).label}
                  </span>
                </div>
              </div>

              <div className="detail-summary">
                <div className="detail-summary-item">
                  <span>Description</span>
                  <strong>{selectedCustomer.description}</strong>
                </div>
                <div className="detail-summary-item">
                  <span>Total Amount</span>
                  <strong>PKR {selectedCustomer.totalAmount.toLocaleString()}</strong>
                </div>
                <div className="detail-summary-item">
                  <span>Paid Amount</span>
                  <strong className="paid-amount">PKR {selectedCustomer.paidAmount.toLocaleString()}</strong>
                </div>
                <div className="detail-summary-item">
                  <span>Balance</span>
                  <strong className="balance-amount">PKR {selectedCustomer.balance.toLocaleString()}</strong>
                </div>
                <div className="detail-summary-item">
                  <span>Monthly Installment</span>
                  <strong>PKR {selectedCustomer.monthlyInstallment.toLocaleString()}</strong>
                </div>
                <div className="detail-summary-item">
                  <span>Overdue Months</span>
                  <strong className="overdue-amount">{selectedCustomer.overdueMonths} months</strong>
                </div>
              </div>

              <div className="installment-history">
                <div className="history-header">
                  <h4>Installment History</h4>
                  <span className="history-badge">{selectedCustomer.installments.length} months</span>
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
                      {selectedCustomer.installments.map((inst, index) => {
                        const isOverdue = inst.month < currentMonth && inst.paid < inst.due;
                        return (
                          <tr key={index} className={isOverdue ? 'overdue-row' : ''}>
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
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="aging-modal-footer">
              <button className="btn-cancel" onClick={closeModal}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgingReport;