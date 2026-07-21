import React, { useState, useEffect } from 'react';
import { Search, Calendar, DollarSign, User, Building, AlertTriangle, Clock, Eye, FileText, Download, Filter, X, Users } from 'lucide-react';
import './AgingReport.css';
import { API_URL } from '../../../config';

const AgingReport = () => {
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [userBranch, setUserBranch] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ✅ Real data (no more dummy agingData)
  const [loading, setLoading] = useState(true);
  const [agingAccounts, setAgingAccounts] = useState([]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    let branch = null;
    let role = null;

    if (user) {
      role = user.role;
      branch = user.branch;
      setUserRole(role);
      setUserBranch(branch);
      if (branch) {
        setBranchFilter(String(branch));
      }
    }

    fetchAgingAccounts(branch, role);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== GET CURRENT MONTH =====
  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  const currentMonth = getCurrentMonth();

  // ============================================
  // ✅ FETCH ALL INSTALLMENTS (every page) so we can look at each
  // account's FULL payment history and decide if it is "Aging" or not.
  // ============================================
  const fetchAllInstallments = async (branch, role) => {
    const token = localStorage.getItem('token');
    let page = 1;
    let allData = [];
    let lastPage = 1;

    // Non-admins only need their own branch — filter server-side to save data
    const branchParam = (branch && role !== 'admin') ? `&branch_id=${branch}` : '';

    do {
      const response = await fetch(`${API_URL}/installments?status=all&page=${page}${branchParam}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      const data = await response.json();
      if (!data.success) break;

      const pageData = data.data?.data || [];
      allData = allData.concat(pageData);
      lastPage = data.data?.last_page || 1;
      page++;
    } while (page <= lastPage);

    return allData;
  };

  // ============================================
  // ✅ SAME shortfall-based status logic as the Installments page's
  // "Account Status" card:
  //   - Clear   -> every installment fully paid
  //   - Aging   -> 3+ installments where SOME amount was paid but less than due
  //   - Overdue -> 1-2 such short payments
  //   - Active  -> no short payments at all
  // Here we only care whether the account is "Aging".
  // ============================================
  const getShortfallCount = (list) => {
    return list.filter(p => parseFloat(p.paid_amount || 0) > 0 && parseFloat(p.balance || 0) > 0).length;
  };

  const getAccountStatusKey = (list, account) => {
    const totalInstallments = account?.total_installments || list.length;
    const fullyPaidCount = list.filter(p => parseFloat(p.paid_amount || 0) > 0 && parseFloat(p.balance || 0) <= 0).length;

    if (totalInstallments > 0 && fullyPaidCount >= totalInstallments) {
      return 'clear';
    }

    const shortfallCount = getShortfallCount(list);
    if (shortfallCount >= 3) return 'aging';
    if (shortfallCount >= 1) return 'overdue';
    return 'active';
  };

  // ✅ Per-installment row status — used inside the month-by-month history table
  const getInstallmentRowStatus = (inst) => {
    const paid = parseFloat(inst.paid_amount || 0);
    const balance = parseFloat(inst.balance || 0);
    if (paid > 0 && balance <= 0) return 'paid';
    if (paid > 0 && balance > 0) return 'partial';
    return 'unpaid';
  };

  // ============================================
  // ✅ BUILD THE AGING LIST from all installments, grouped by account
  // ============================================
  const fetchAgingAccounts = async (branch, role) => {
    setLoading(true);
    try {
      const allInstallments = await fetchAllInstallments(branch, role);

      const grouped = new Map();
      allInstallments.forEach(inst => {
        const accId = inst.account_id || inst.account?.id;
        if (!accId) return;
        if (!grouped.has(accId)) grouped.set(accId, []);
        grouped.get(accId).push(inst);
      });

      const agingList = [];

      grouped.forEach((list, accId) => {
        const sample = list[0];
        const account = sample.account || {};

        // ✅ Only accounts whose status is actually "Aging"
        const statusKey = getAccountStatusKey(list, account);
        if (statusKey !== 'aging') return;

        const sortedInstallments = [...list].sort((a, b) => (a.month || '').localeCompare(b.month || ''));
        const shortfallCount = getShortfallCount(list);

        const paidEntries = list.filter(p => parseFloat(p.paid_amount || 0) > 0 && p.payment_date);
        const lastPaymentDate = paidEntries.length > 0
          ? paidEntries.sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date))[0].payment_date
          : null;

        const customer = account.customer || {};

        agingList.push({
          accountId: accId,
          caseNo: account.case_no || 'N/A',
          customerName: customer.name || 'N/A',
          customerCnic: customer.cnic || 'N/A',
          customerPhone: customer.phone || 'N/A',
          customerAddress: customer.address || 'N/A',
          branch: account.branch_id,
          description: account.product_name || customer.product_name || 'N/A',
          monthlyInstallment: parseFloat(account.monthly_installment || 0),
          totalAmount: parseFloat(account.total_amount || 0),
          paidAmount: parseFloat(account.paid_amount || 0),
          balance: parseFloat(account.balance || 0),
          lastPaymentDate,
          shortfallCount,
          installments: sortedInstallments
        });
      });

      // Worst accounts (most short payments) first
      agingList.sort((a, b) => b.shortfallCount - a.shortfallCount);

      setAgingAccounts(agingList);
    } catch (error) {
      console.error('Error fetching aging accounts:', error);
      setAgingAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  // ===== FILTER DATA (search + branch, same UX as before) =====
  const filtered = agingAccounts.filter(item => {
    const searchMatch = item.customerName.toLowerCase().includes(search.toLowerCase()) ||
      item.caseNo.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase());

    let branchMatch = true;
    if (userBranch) {
      branchMatch = parseInt(item.branch) === parseInt(userBranch);
    } else if (branchFilter !== 'all') {
      branchMatch = parseInt(item.branch) === parseInt(branchFilter);
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
  const avgShortfalls = totalRecords > 0
    ? Math.round(filtered.reduce((sum, item) => sum + item.shortfallCount, 0) / totalRecords)
    : 0;

  // ===== VIEW DETAIL =====
  const openDetailModal = (item) => {
    setSelectedCustomer(item);
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

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-PK', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const branchLabel = userBranch ? `Branch ${userBranch}` : (branchFilter !== 'all' ? `Branch ${branchFilter}` : 'All Branches');

  // ===== CheckCircle icon component =====
  const CheckCircleIcon = () => (
    <svg className="check-circle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );

  // ✅ Cards now reflect ONLY aging accounts
  const statCards = [
    {
      label: 'Aging Accounts',
      value: totalRecords,
      icon: AlertTriangle,
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.15)',
      className: 'balance-card'
    },
    {
      label: 'Total Balance (Aging)',
      value: `PKR ${totalBalance.toLocaleString()}`,
      icon: DollarSign,
      color: '#C9A84C',
      bg: 'rgba(201,168,76,0.15)',
      className: 'balance-card'
    },
    {
      label: 'Avg. Short Payments',
      value: avgShortfalls,
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
          <p className="subtitle">Customers who fell short on payment 3 or more times</p>
        </div>
        <button className="btn-export" onClick={exportReport}>
          <Download size={18} />
          Export Report
        </button>
      </div>

      {/* ===== STATS - AGING ONLY ===== */}
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
            <h3 style={{ fontWeight: 700 }}>Aging Customers</h3>
            <span className="record-count" style={{ fontWeight: 600 }}>{totalRecords} entries</span>
          </div>
          <span className="aging-info" style={{ fontWeight: 600 }}>Showing accounts with 3+ short payments</span>
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
                <th style={{ fontWeight: 800 }}>Short Payments</th>
                <th style={{ fontWeight: 800 }}>Last Payment</th>
                <th style={{ fontWeight: 800 }}>Status</th>
                <th style={{ fontWeight: 800 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="no-data">
                    <div className="no-data-content">
                      <p style={{ fontWeight: 600 }}>Loading aging accounts...</p>
                    </div>
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan="9" className="no-data">
                    <div className="no-data-content">
                      <CheckCircleIcon />
                      <p style={{ fontWeight: 600 }}>No aging accounts found for {branchLabel}</p>
                      <span className="no-data-sub" style={{ fontWeight: 500 }}>All payments are up to date!</span>
                    </div>
                  </td>
                </tr>
              ) : (
                currentItems.map((item, index) => (
                  <tr key={item.accountId} className={`overdue-row ${index % 2 === 0 ? 'even-row' : 'odd-row'}`}>
                    <td className="case-number" style={{ fontWeight: 700 }}>{item.caseNo}</td>
                    <td>
                      <div className="customer-info" style={{ fontWeight: 600 }}>
                        <div className="customer-avatar" style={{ 
                          background: '#ede9fe', 
                          color: '#1E1B4B',
                          fontWeight: 700,
                          fontSize: '0.7rem'
                        }}>
                          {item.customerName.charAt(0)}
                        </div>
                        {item.customerName}
                      </div>
                    </td>
                    <td className="description-cell" style={{ fontWeight: 500 }}>{item.description}</td>
                    <td className="balance-amount" style={{ fontWeight: 700, color: '#dc2626' }}>PKR {item.balance.toLocaleString()}</td>
                    <td style={{ fontWeight: 600 }}>PKR {item.monthlyInstallment.toLocaleString()}</td>
                    <td>
                      <span className="overdue-months-badge" style={{ 
                        background: '#f59e0b', 
                        color: 'white',
                        fontWeight: 700,
                        padding: '0.2rem 0.7rem',
                        borderRadius: '9999px',
                        fontSize: '0.7rem'
                      }}>
                        {item.shortfallCount} times
                      </span>
                    </td>
                    <td className="last-payment" style={{ fontWeight: 500 }}>{formatDate(item.lastPaymentDate)}</td>
                    <td>
                      <span className="status-badge high" style={{ fontWeight: 700 }}>
                        Aging
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
                ))
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
                  background: '#991b1b',
                  fontSize: '1.1rem',
                  fontWeight: 800
                }}>
                  {selectedCustomer.customerName.charAt(0)}
                </div>
                <div className="customer-detail-info">
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{selectedCustomer.customerName}</h4>
                  <span className="customer-detail-case" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Case: {selectedCustomer.caseNo}</span>
                  <span className="customer-detail-branch" style={{ fontSize: '0.8rem', fontWeight: 500 }}>Branch {selectedCustomer.branch}</span>
                </div>
                <div className="customer-detail-status">
                  <span className="status-badge high" style={{ fontWeight: 700 }}>
                    Aging
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
                  <span style={{ fontWeight: 700 }}>Short Payments</span>
                  <strong className="overdue-amount" style={{ fontWeight: 800, color: '#dc2626' }}>{selectedCustomer.shortfallCount} times</strong>
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
                        const rowStatus = getInstallmentRowStatus(inst);
                        const isOverdue = inst.month < currentMonth && parseFloat(inst.paid_amount || 0) < parseFloat(inst.due_amount || 0);
                        return (
                          <tr key={inst.id || index} className={`${isOverdue ? 'overdue-row' : ''} ${index % 2 === 0 ? 'even-row' : 'odd-row'}`}>
                            <td className="month-cell" style={{ fontWeight: 600 }}>
                              {inst.month ? new Date(inst.month + '-01').toLocaleDateString('en-PK', { month: 'short', year: 'numeric' }) : '-'}
                            </td>
                            <td style={{ fontWeight: 600 }}>PKR {parseFloat(inst.due_amount || 0).toLocaleString()}</td>
                            <td className={rowStatus === 'paid' ? 'paid-amount' : 'balance-amount'} style={{ fontWeight: 700 }}>
                              PKR {parseFloat(inst.paid_amount || 0).toLocaleString()}
                            </td>
                            <td>
                              <span className={`status-badge ${rowStatus}`} style={{ fontWeight: 700 }}>
                                {rowStatus === 'paid' ? 'Paid' : rowStatus === 'partial' ? 'Partial' : 'Unpaid'}
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