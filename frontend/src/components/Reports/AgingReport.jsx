// src/components/AgingReport/AgingReport.jsx

import React, { useState, useEffect } from 'react';
import { Search, Calendar, DollarSign, User, Building, AlertTriangle, Clock, Eye, FileText, Download, Filter, X, Users } from 'lucide-react';
import './AgingReport.css';
import { API_URL, STORAGE_URL } from '../../../config';
import ExportButton from '../common/ExportButton';

// ============================================
// ✅ Storage URL helper - file path ko full URL mein convert karta hai
// ============================================
const getFileUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${STORAGE_URL}/${path}`;
};

// ============================================
// ✅ DocImage - single document image card, click pe full size khulta hai
// ============================================
const DocImage = ({ label, src }) => (
  <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', background: '#fff' }}>
    <a href={src} target="_blank" rel="noopener noreferrer">
      <img 
        src={src} 
        alt={label} 
        style={{ width: '100%', height: '120px', objectFit: 'cover', cursor: 'zoom-in' }} 
      />
    </a>
    <p style={{ fontSize: '12px', fontWeight: 600, textAlign: 'center', padding: '6px', margin: 0, color: '#374151' }}>
      {label}
    </p>
  </div>
);

const AgingReport = () => {
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [userBranch, setUserBranch] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  // ===== CURRENT MONTH (used for month-name formatting only) =====
  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  const currentMonth = getCurrentMonth();

  // ============================================
  // ✅ SAME month-math helpers as Installments.jsx
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

  // ============================================
  // ✅ FETCH ALL INSTALLMENTS (every page) so we can look at each
  // account's FULL payment history and decide if it is "Aging" or not.
  // ============================================
  const fetchAllInstallments = async (branch, role) => {
    const token = localStorage.getItem('token');
    let page = 1;
    let allData = [];
    let lastPage = 1;

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
  // ✅ EXACT SAME LOGIC as Installments.jsx / OverdueInstallments.jsx.
  // Looks at the OLDEST unpaid installment whose due month has already
  // arrived (ignores future months), and counts how many months behind
  // it is. Returns { statusKey, overdueMonths }.
  //   - Clear   -> every installment (up to total_installments) fully paid
  //   - Active  -> no due-and-unpaid installment at all
  //   - Overdue -> oldest due-unpaid installment is 1-3 months behind
  //   - Aging   -> oldest due-unpaid installment is 4+ months behind (internal
  //                classification key only — displayed to the user as "Overdue")
  // ============================================
  const getAccountAgingInfo = (list, account) => {
    const totalInstallments = account?.total_installments || list.length;
    const fullyPaidCount = list.filter(p => parseFloat(p.balance || 0) <= 0).length;

    if (totalInstallments > 0 && fullyPaidCount >= totalInstallments) {
      return { statusKey: 'clear', overdueMonths: 0 };
    }

    const currentMonthStr = getCurrentMonthStr();

    // sirf woh unpaid months jinka due date aa chuka hai (future wale exclude)
    const dueUnpaidMonths = list
      .filter(p =>
        parseFloat(p.balance || 0) > 0 &&
        p.month &&
        monthsBetween(p.month, currentMonthStr) >= 0
      )
      .map(p => p.month)
      .sort(); // "YYYY-MM" string sort = chronological

    if (dueUnpaidMonths.length === 0) {
      return { statusKey: 'active', overdueMonths: 0 };
    }

    const oldestDueMonth = dueUnpaidMonths[0];
    const overdueMonths = monthsBetween(oldestDueMonth, currentMonthStr) + 1;

    if (overdueMonths >= 4) {
      return { statusKey: 'aging', overdueMonths };
    }

    return { statusKey: 'overdue', overdueMonths };
  };

  // ✅ Per-installment row status — used inside the month-by-month history table.
  // Mirrors Installments.jsx's getStatusBadge logic (month-aware), not just paid/partial/unpaid.
  // NOTE: internal key stays 'aging' for 4m+ (used for styling), but the LABEL shown
  // to the user is always "Overdue" now, never "Aging".
  const getInstallmentRowStatus = (inst) => {
    const balance = parseFloat(inst.balance || 0);
    if (balance <= 0) return { key: 'paid', label: 'Paid' };

    if (!inst.month) return { key: 'unpaid', label: 'Unpaid' };

    const monthsDiff = monthsBetween(inst.month, getCurrentMonthStr());
    if (monthsDiff < 0) return { key: 'unpaid', label: 'Unpaid' }; // future month, not due yet

    const overdueCount = monthsDiff + 1;
    if (overdueCount >= 4) return { key: 'aging', label: `Overdue (${overdueCount}m)` };
    return { key: 'overdue', label: `Overdue (${overdueCount}m)` };
  };

  // ============================================
  // ✅ Due Date / Mirror helpers for the main table row (same idea as
  // EmployeePerformanceReport.jsx) — computed from item.installments,
  // do NOT touch anything inside the detail modal.
  // ============================================
  const getItemDueDate = (item) => {
    const list = Array.isArray(item.installments) ? item.installments : [];
    const sorted = [...list].sort((a, b) => (a.month || '').localeCompare(b.month || ''));
    const firstUnpaid = sorted.find(p => parseFloat(p.balance || 0) > 0);
    if (firstUnpaid) {
      return firstUnpaid.due_date || firstUnpaid.month || null;
    }
    if (sorted.length > 0) {
      return sorted[0].due_date || sorted[0].month || null;
    }
    return null;
  };

  const getItemMirror = (item) => {
    const list = Array.isArray(item.installments) ? item.installments : [];
    const currentMonthStr = getCurrentMonthStr();
    const currentInst = list.find(p => p.month === currentMonthStr);
    return currentInst ? parseFloat(currentInst.balance || 0) : 0;
  };

  const formatDueDate = (dueDate) => {
    if (!dueDate) return '-';

    if (dueDate.includes('-') && dueDate.split('-').length === 3) {
      return new Date(dueDate).toLocaleDateString('en-PK', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    }

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

  // ============================================
  // ✅ BUILD THE AGING LIST from all installments, grouped by account,
  // using the SAME classification as Installments.jsx / OverdueInstallments.jsx
  // ============================================
  const fetchAgingAccounts = async (branch, role) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const allInstallments = await fetchAllInstallments(branch, role);

      const grouped = new Map();
      allInstallments.forEach(inst => {
        const accId = inst.account_id || inst.account?.id;
        if (!accId) return;
        if (!grouped.has(accId)) grouped.set(accId, []);
        grouped.get(accId).push(inst);
      });

      const agingList = [];

      for (const [accId, list] of grouped) {
        const sample = list[0];
        const account = sample.account || {};

        // ✅ Only accounts whose status is actually "Aging" internally (4+ months behind)
        const { statusKey, overdueMonths } = getAccountAgingInfo(list, account);
        if (statusKey !== 'aging') continue;

        const sortedInstallments = [...list].sort((a, b) => (a.month || '').localeCompare(b.month || ''));

        const paidEntries = list.filter(p => parseFloat(p.paid_amount || 0) > 0 && p.payment_date);
        const lastPaymentDate = paidEntries.length > 0
          ? paidEntries.sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date))[0].payment_date
          : null;

        const customer = account.customer || {};

        // ✅ GUARANTORS KO PROPERLY FETCH KARO - Multiple possible paths
        let guarantors = [];
        
        // Path 1: customer.guarantors
        if (customer.guarantors && Array.isArray(customer.guarantors)) {
          guarantors = customer.guarantors;
        }
        // Path 2: account.guarantors
        else if (account.guarantors && Array.isArray(account.guarantors)) {
          guarantors = account.guarantors;
        }
        // Path 3: sample.guarantors
        else if (sample.guarantors && Array.isArray(sample.guarantors)) {
          guarantors = sample.guarantors;
        }
        // Path 4: customer ki nested guarantors property
        else if (customer.guarantor && Array.isArray(customer.guarantor)) {
          guarantors = customer.guarantor;
        }
        // Path 5: account ki nested guarantors property
        else if (account.guarantor && Array.isArray(account.guarantor)) {
          guarantors = account.guarantor;
        }

        // ✅ Agar guarantors empty hain to try fetching from account details API
        if (guarantors.length === 0 && accId) {
          try {
            const detailResponse = await fetch(`${API_URL}/installments/account-details/${accId}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
              }
            });
            const detailData = await detailResponse.json();
            if (detailData.success && detailData.data) {
              const accDetail = detailData.data;
              const cust = accDetail.customer || {};
              if (cust.guarantors && Array.isArray(cust.guarantors)) {
                guarantors = cust.guarantors;
              } else if (accDetail.guarantors && Array.isArray(accDetail.guarantors)) {
                guarantors = accDetail.guarantors;
              }
            }
          } catch (err) {
            console.error('Error fetching account details for guarantors:', err);
          }
        }

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
          overdueMonths,
          installments: sortedInstallments,
          // ✅ Documents ke liye fields
          customer: customer,
          account: account,
          guarantors: guarantors,
          // ✅ Remarks field - empty for now
          remarks: account.remarks || '',
        });
      }

      // Worst accounts (most months overdue) first
      agingList.sort((a, b) => b.overdueMonths - a.overdueMonths);

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
  const avgOverdueMonths = totalRecords > 0
    ? Math.round(filtered.reduce((sum, item) => sum + item.overdueMonths, 0) / totalRecords)
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

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-PK', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatMonth = (month) => {
    if (!month) return '-';
    return new Date(month + '-01').toLocaleDateString('en-PK', { month: 'short', year: 'numeric' });
  };

  const branchLabel = userBranch ? `Branch ${userBranch}` : (branchFilter !== 'all' ? `Branch ${branchFilter}` : 'All Branches');

  // ===== CheckCircle icon component =====
  const CheckCircleIcon = () => (
    <svg className="check-circle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );

  // ✅ Cards now reflect ONLY aging accounts (4m+), label kept as "Aging Accounts" for the report title
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
      label: 'Avg. Months Overdue',
      value: avgOverdueMonths,
      icon: Clock,
      color: '#2563eb',
      bg: 'rgba(37,99,235,0.12)',
      className: 'avg-card'
    },
  ];

  // ✅ NAYA: export ke liye filtered aging list ko flat rows mein convert karna
  const exportData = filtered.map(item => ({
    caseNo: item.caseNo,
    customerName: item.customerName,
    customerCnic: item.customerCnic,
    description: item.description,
    dueDate: formatDueDate(getItemDueDate(item)),
    monthlyInstallment: item.monthlyInstallment,
    balance: item.balance,
    mirror: getItemMirror(item),
    remarks: item.remarks || '',
    overdueMonths: item.overdueMonths,
    lastPaymentDate: item.lastPaymentDate ? formatDate(item.lastPaymentDate) : '-',
    status: 'Overdue'
  }));

  const exportColumns = [
    { header: 'Case No', key: 'caseNo' },
    { header: 'Customer', key: 'customerName' },
    { header: 'CNIC', key: 'customerCnic' },
    { header: 'Description', key: 'description' },
    { header: 'Due Date', key: 'dueDate' },
    { header: 'Installment', key: 'monthlyInstallment' },
    { header: 'Balance', key: 'balance' },
    { header: 'Mirror', key: 'mirror' },
    { header: 'Remarks', key: 'remarks' },
    { header: 'Months Overdue', key: 'overdueMonths' },
    { header: 'Last Payment', key: 'lastPaymentDate' },
    { header: 'Status', key: 'status' },
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
          <p className="subtitle">Customers whose oldest due installment is 4+ months overdue</p>
        </div>
        <ExportButton
          data={exportData}
          columns={exportColumns}
          filename="aging-report"
          title="Aging Report"
        />
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
          <span className="aging-info" style={{ fontWeight: 600 }}>Showing accounts 4+ months overdue</span>
        </div>

        <div className="table-scroll">
          <table className="aging-table">
            <thead>
              <tr>
                <th style={{ fontWeight: 800 }}>Customer</th>
                <th style={{ fontWeight: 800 }}>Case #</th>
                <th style={{ fontWeight: 800 }}>Due Date</th>
                <th style={{ fontWeight: 800 }}>Installment</th>
                <th style={{ fontWeight: 800 }}>Balance</th>
                <th style={{ fontWeight: 800 }}>Mirror</th>
                <th style={{ fontWeight: 800 }}>Remarks</th>
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
                    <td className="case-number" style={{ fontWeight: 700 }}>{item.caseNo}</td>
                    <td>
                      <div className="date-info" style={{ color: '#7c3aed', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={12} />
                        {formatDueDate(getItemDueDate(item))}
                      </div>
                    </td>
                    <td style={{ fontWeight: 600 }}>PKR {item.monthlyInstallment.toLocaleString()}</td>
                    <td className="balance-amount" style={{ fontWeight: 700, color: '#dc2626' }}>PKR {item.balance.toLocaleString()}</td>
                    <td style={{ fontWeight: 600 }}>PKR {getItemMirror(item).toLocaleString()}</td>
                    <td>
                      <span style={{ color: '#6b7280', fontSize: '13px' }}>—</span>
                    </td>
                    <td>
                      <span className="status-badge high" style={{ fontWeight: 700 }}>
                        Overdue
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

      {/* ===== DETAIL MODAL (Full Screen with Documents) — UNCHANGED ===== */}
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
                    Overdue
                  </span>
                </div>
              </div>

              <div className="detail-summary">
                <div className="detail-summary-item">
                  <span style={{ fontWeight: 700 }}>Description</span>
                  <strong style={{ fontWeight: 600 }}>{selectedCustomer.description}</strong>
                </div>
                <div className="detail-summary-item">
                  <span style={{ fontWeight: 700 }}>CNIC</span>
                  <strong style={{ fontWeight: 600 }}>{selectedCustomer.customerCnic || 'N/A'}</strong>
                </div>
                <div className="detail-summary-item">
                  <span style={{ fontWeight: 700 }}>Phone</span>
                  <strong style={{ fontWeight: 600 }}>{selectedCustomer.customerPhone || 'N/A'}</strong>
                </div>
                <div className="detail-summary-item">
                  <span style={{ fontWeight: 700 }}>Address</span>
                  <strong style={{ fontWeight: 600 }}>{selectedCustomer.customerAddress || 'N/A'}</strong>
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
                  <span style={{ fontWeight: 700 }}>Months Overdue</span>
                  <strong className="overdue-amount" style={{ fontWeight: 800, color: '#dc2626' }}>{selectedCustomer.overdueMonths}m</strong>
                </div>
                <div className="detail-summary-item">
                  <span style={{ fontWeight: 700 }}>Account Opening</span>
                  <strong style={{ fontWeight: 600 }}>{formatDate(selectedCustomer.account?.created_at)}</strong>
                </div>
              </div>

              {/* ============================================ */}
              {/* ✅ DOCUMENTS SECTION - Same as Installments.jsx */}
              {/* ============================================ */}
              <div className="aging-documents-section" style={{ marginTop: '20px', borderTop: '2px solid #e5e7eb', paddingTop: '20px' }}>
                <div className="aging-section-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <FileText size={20} style={{ color: '#374151' }} />
                  <h4 style={{ fontWeight: 700, fontSize: '16px', margin: 0, color: '#1f2937' }}>Original Form Documents</h4>
                </div>

                {/* Customer CNIC Images */}
                <div style={{ marginBottom: '20px' }}>
                  <h5 style={{ fontWeight: 700, fontSize: '14px', marginBottom: '10px', color: '#374151' }}>
                    Customer CNIC
                  </h5>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                    {selectedCustomer.customer?.cnic_front && (
                      <DocImage label="CNIC Front" src={getFileUrl(selectedCustomer.customer.cnic_front)} />
                    )}
                    {selectedCustomer.customer?.cnic_back && (
                      <DocImage label="CNIC Back" src={getFileUrl(selectedCustomer.customer.cnic_back)} />
                    )}
                    {!selectedCustomer.customer?.cnic_front && !selectedCustomer.customer?.cnic_back && (
                      <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>No customer CNIC images found</p>
                    )}
                  </div>
                </div>

                {/* Additional Images */}
                <div style={{ marginBottom: '20px' }}>
                  <h5 style={{ fontWeight: 700, fontSize: '14px', marginBottom: '10px', color: '#374151' }}>
                    Additional Documents
                  </h5>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                    {selectedCustomer.customer?.additional_image_1 && (
                      <DocImage label="Additional Image 1" src={getFileUrl(selectedCustomer.customer.additional_image_1)} />
                    )}
                    {selectedCustomer.customer?.additional_image_2 && (
                      <DocImage label="Additional Image 2" src={getFileUrl(selectedCustomer.customer.additional_image_2)} />
                    )}
                    {!selectedCustomer.customer?.additional_image_1 && !selectedCustomer.customer?.additional_image_2 && (
                      <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>No additional documents found</p>
                    )}
                  </div>
                </div>

                {/* Chalan Images */}
                <div style={{ marginBottom: '20px' }}>
                  <h5 style={{ fontWeight: 700, fontSize: '14px', marginBottom: '10px', color: '#374151' }}>
                    Chalan
                  </h5>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                    {selectedCustomer.account?.chalan_front && (
                      <DocImage label="Chalan Front" src={getFileUrl(selectedCustomer.account.chalan_front)} />
                    )}
                    {selectedCustomer.account?.chalan_back && (
                      <DocImage label="Chalan Back" src={getFileUrl(selectedCustomer.account.chalan_back)} />
                    )}
                    {!selectedCustomer.account?.chalan_front && !selectedCustomer.account?.chalan_back && (
                      <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>No chalan images found</p>
                    )}
                  </div>
                </div>

                {/* Voice Consent */}
                {selectedCustomer.customer?.voice_consent && (
                  <div style={{ marginBottom: '20px' }}>
                    <h5 style={{ fontWeight: 700, fontSize: '14px', marginBottom: '10px', color: '#374151' }}>
                      Voice Consent (Raza Mandi)
                    </h5>
                    <audio controls style={{ width: '100%' }}>
                      <source src={getFileUrl(selectedCustomer.customer.voice_consent)} />
                      Your browser does not support audio playback.
                    </audio>
                  </div>
                )}

                {/* ✅ GUARANTORS' CNIC IMAGES */}
                <div>
                  <h5 style={{ fontWeight: 700, fontSize: '14px', marginBottom: '10px', color: '#374151' }}>
                    Guarantors' CNIC Images
                  </h5>
                  {selectedCustomer.guarantors && selectedCustomer.guarantors.length > 0 ? (
                    selectedCustomer.guarantors.map((g, idx) => (
                      <div key={idx} style={{ marginBottom: '16px', padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
                        <p style={{ fontWeight: 700, marginBottom: '8px', fontSize: '13px' }}>
                          {g.name || g.guarantor_name || 'N/A'} — {g.cnic || g.guarantor_cnic || 'N/A'}
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                          {g.cnic_front && <DocImage label="CNIC Front" src={getFileUrl(g.cnic_front)} />}
                          {g.cnic_back && <DocImage label="CNIC Back" src={getFileUrl(g.cnic_back)} />}
                          {!g.cnic_front && !g.cnic_back && (
                            <p style={{ color: '#6b7280', fontSize: '13px', margin: 0 }}>No CNIC images for this guarantor</p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>No guarantor documents found</p>
                  )}
                </div>
              </div>

              <div className="installment-history" style={{ marginTop: '20px' }}>
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
                        const isOverdue = rowStatus.key === 'overdue' || rowStatus.key === 'aging';
                        return (
                          <tr key={inst.id || index} className={`${isOverdue ? 'overdue-row' : ''} ${index % 2 === 0 ? 'even-row' : 'odd-row'}`}>
                            <td className="month-cell" style={{ fontWeight: 600 }}>
                              {formatMonth(inst.month)}
                            </td>
                            <td style={{ fontWeight: 600 }}>PKR {parseFloat(inst.due_amount || 0).toLocaleString()}</td>
                            <td className={rowStatus.key === 'paid' ? 'paid-amount' : 'balance-amount'} style={{ fontWeight: 700 }}>
                              PKR {parseFloat(inst.paid_amount || 0).toLocaleString()}
                            </td>
                            <td>
                              <span className={`status-badge ${rowStatus.key}`} style={{ fontWeight: 700 }}>
                                {rowStatus.label}
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