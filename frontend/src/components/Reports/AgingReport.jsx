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
    if (months >= 6) return { color: '#dc2626', label: 'Critical', bg: 'rgba(220,38,38,0.15)' };
    if (months >= 4) return { color: '#f59e0b', label: 'High', bg: 'rgba(245,158,11,0.15)' };
    if (months >= 3) return { color: '#fcd34d', label: 'Medium', bg: 'rgba(252,211,77,0.15)' };
    return { color: '#22c55e', label: 'Low', bg: 'rgba(34,197,94,0.15)' };
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

  // Colorful stat cards
  const statCards = [
    {
      label: 'Total Balance',
      value: `PKR ${totalBalance.toLocaleString()}`,
      icon: DollarSign,
      color: '#C9A84C',
      bg: 'rgba(201,168,76,0.15)',
      className: 'balance-card'
    },
    {
      label: 'Average Overdue',
      value: `${avgOverdueMonths} months`,
      icon: Clock,
      color: '#2563eb',
      bg: 'rgba(37,99,235,0.12)',
      className: 'avg-card'
    },
  ];

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
        {statCards.map((card, index) => (
          <div 
            key={index} 
            className={`stat-card ${card.className}`}
            style={{ 
              borderLeft: `5px solid ${card.color}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}
          >
            <div className="stat-icon" style={{ background: card.bg, color: card.color }}>
              <card.icon size={22} />
            </div>
            <div className="stat-info">
              <span className="stat-label" style={{ fontWeight: 700 }}>{card.label}</span>
              <span className="stat-value" style={{ fontWeight: 800, color: card.color, fontSize: '1.3rem' }}>{card.value}</span>
            </div>
          </div>
        ))}
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
            style={{ fontWeight: 500 }}
          />
        </div>

        {!userBranch && (
          <div className="branch-filters">
            <button 
              className={`filter-btn ${branchFilter === 'all' ? 'active' : ''}`}
              onClick={() => { setBranchFilter('all'); setCurrentPage(1); }}
              style={{ fontWeight: 600 }}
            >
              All
            </button>
            <button 
              className={`filter-btn branch-1 ${branchFilter === '1' ? 'active' : ''}`}
              onClick={() => { setBranchFilter('1'); setCurrentPage(1); }}
              style={{ fontWeight: 600 }}
            >
              Branch 1
            </button>
            <button 
              className={`filter-btn branch-2 ${branchFilter === '2' ? 'active' : ''}`}
              onClick={() => { setBranchFilter('2'); setCurrentPage(1); }}
              style={{ fontWeight: 600 }}
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
            <h3 style={{ fontWeight: 700 }}>Overdue Customers</h3>
            <span className="record-count" style={{ fontWeight: 600 }}>{totalRecords} entries</span>
          </div>
          <span className="aging-info" style={{ fontWeight: 600 }}>Showing customers with 3+ months overdue</span>
        </div>

        <div className="table-scroll">
          <table className="aging-table">
            <thead>
              <tr>
                <th style={{ fontWeight: 800 }}>Case #</th>
                <th style={{ fontWeight: 800 }}>Customer</th>
                <th style={{ fontWeight: 800 }}>Description</th>
                <th style={{ fontWeight: 800 }}>Balance</th>
                <th style={{ fontWeight: 800 }}>Monthly</th>
                <th style={{ fontWeight: 800 }}>Overdue</th>
                <th style={{ fontWeight: 800 }}>Last Payment</th>
                <th style={{ fontWeight: 800 }}>Status</th>
                <th style={{ fontWeight: 800 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan="9" className="no-data">
                    <div className="no-data-content">
                      <CheckCircleIcon />
                      <p style={{ fontWeight: 600 }}>No overdue customers found for {branchLabel}</p>
                      <span className="no-data-sub" style={{ fontWeight: 500 }}>All payments are up to date!</span>
                    </div>
                  </td>
                </tr>
              ) : (
                currentItems.map((item, index) => {
                  const badge = getOverdueBadge(item.overdueMonths);
                  return (
                    <tr key={item.id} className={`overdue-row ${index % 2 === 0 ? 'even-row' : 'odd-row'}`}>
                      <td className="case-number" style={{ fontWeight: 700 }}>{item.caseNo}</td>
                      <td>
                        <div className="customer-info" style={{ fontWeight: 600 }}>
                          <div className="customer-avatar" style={{ 
                            background: '#ede9fe', 
                            color: '#1E1B4B',
                            fontWeight: 700,
                            fontSize: '0.7rem'
                          }}>
                            {item.customer.charAt(0)}
                          </div>
                          {item.customer}
                        </div>
                      </td>
                      <td className="description-cell" style={{ fontWeight: 500 }}>{item.description}</td>
                      <td className="balance-amount" style={{ fontWeight: 700, color: '#dc2626' }}>PKR {item.balance.toLocaleString()}</td>
                      <td style={{ fontWeight: 600 }}>PKR {item.monthlyInstallment.toLocaleString()}</td>
                      <td>
                        <span className="overdue-months-badge" style={{ 
                          background: badge.color, 
                          color: 'white',
                          fontWeight: 700,
                          padding: '0.2rem 0.7rem',
                          borderRadius: '9999px',
                          fontSize: '0.7rem'
                        }}>
                          {item.overdueMonths} months
                        </span>
                      </td>
                      <td className="last-payment" style={{ fontWeight: 500 }}>{item.lastPaymentDate}</td>
                      <td>
                        <span className={`status-badge ${item.overdueMonths >= 6 ? 'critical' : item.overdueMonths >= 4 ? 'high' : 'medium'}`} style={{ fontWeight: 700 }}>
                          {badge.label}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="btn-view" 
                          onClick={() => openDetailModal(item)}
                          title="View Details"
                          style={{ fontWeight: 700 }}
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
            style={{ fontWeight: 600 }}
          >
            Previous
          </button>
          <span className="page-info" style={{ fontWeight: 600 }}>
            {totalRecords > 0 ? (
              `Showing ${startIndex + 1} - ${Math.min(startIndex + itemsPerPage, totalRecords)} of ${totalRecords}`
            ) : (
              'No records'
            )}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages || totalPages === 0}
            style={{ fontWeight: 600 }}
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
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Customer Details</h3>
              </div>
              <button className="aging-modal-close" onClick={closeModal}>
                <X size={24} />
              </button>
            </div>

            <div className="aging-modal-body">
              <div className="customer-detail-header">
                <div className="customer-detail-avatar" style={{ 
                  background: selectedCustomer.overdueMonths >= 6 ? '#991b1b' : '#1E1B4B',
                  fontSize: '1.1rem',
                  fontWeight: 800
                }}>
                  {selectedCustomer.customer.charAt(0)}
                </div>
                <div className="customer-detail-info">
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{selectedCustomer.customer}</h4>
                  <span className="customer-detail-case" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Case: {selectedCustomer.caseNo}</span>
                  <span className="customer-detail-branch" style={{ fontSize: '0.8rem', fontWeight: 500 }}>Branch {selectedCustomer.branch}</span>
                </div>
                <div className="customer-detail-status">
                  <span className={`status-badge ${selectedCustomer.overdueMonths >= 6 ? 'critical' : selectedCustomer.overdueMonths >= 4 ? 'high' : 'medium'}`} style={{ fontWeight: 700 }}>
                    {getOverdueBadge(selectedCustomer.overdueMonths).label}
                  </span>
                </div>
              </div>

              <div className="detail-summary">
                <div className="detail-summary-item">
                  <span style={{ fontWeight: 700 }}>Description</span>
                  <strong style={{ fontWeight: 600 }}>{selectedCustomer.description}</strong>
                </div>
                <div className="detail-summary-item">
                  <span style={{ fontWeight: 700 }}>Total Amount</span>
                  <strong style={{ fontWeight: 700 }}>PKR {selectedCustomer.totalAmount.toLocaleString()}</strong>
                </div>
                <div className="detail-summary-item">
                  <span style={{ fontWeight: 700 }}>Paid Amount</span>
                  <strong className="paid-amount" style={{ fontWeight: 700, color: '#065f46' }}>PKR {selectedCustomer.paidAmount.toLocaleString()}</strong>
                </div>
                <div className="detail-summary-item">
                  <span style={{ fontWeight: 700 }}>Balance</span>
                  <strong className="balance-amount" style={{ fontWeight: 700, color: '#dc2626' }}>PKR {selectedCustomer.balance.toLocaleString()}</strong>
                </div>
                <div className="detail-summary-item">
                  <span style={{ fontWeight: 700 }}>Monthly Installment</span>
                  <strong style={{ fontWeight: 700 }}>PKR {selectedCustomer.monthlyInstallment.toLocaleString()}</strong>
                </div>
                <div className="detail-summary-item">
                  <span style={{ fontWeight: 700 }}>Overdue Months</span>
                  <strong className="overdue-amount" style={{ fontWeight: 800, color: '#dc2626' }}>{selectedCustomer.overdueMonths} months</strong>
                </div>
              </div>

              <div className="installment-history">
                <div className="history-header">
                  <h4 style={{ fontWeight: 700 }}>Installment History</h4>
                  <span className="history-badge" style={{ fontWeight: 600 }}>{selectedCustomer.installments.length} months</span>
                </div>
                <div className="history-scroll">
                  <table className="history-table">
                    <thead>
                      <tr>
                        <th style={{ fontWeight: 800 }}>Month</th>
                        <th style={{ fontWeight: 800 }}>Due (PKR)</th>
                        <th style={{ fontWeight: 800 }}>Paid (PKR)</th>
                        <th style={{ fontWeight: 800 }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCustomer.installments.map((inst, index) => {
                        const isOverdue = inst.month < currentMonth && inst.paid < inst.due;
                        return (
                          <tr key={index} className={`${isOverdue ? 'overdue-row' : ''} ${index % 2 === 0 ? 'even-row' : 'odd-row'}`}>
                            <td className="month-cell" style={{ fontWeight: 600 }}>{inst.month}</td>
                            <td style={{ fontWeight: 600 }}>PKR {inst.due.toLocaleString()}</td>
                            <td className={inst.paid >= inst.due ? 'paid-amount' : 'balance-amount'} style={{ fontWeight: 700 }}>
                              PKR {inst.paid.toLocaleString()}
                            </td>
                            <td>
                              <span className={`status-badge ${inst.status}`} style={{ fontWeight: 700 }}>
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
              <button className="btn-cancel" onClick={closeModal} style={{ fontWeight: 700 }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgingReport;