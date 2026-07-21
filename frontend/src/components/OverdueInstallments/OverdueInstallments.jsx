import React, { useState, useEffect } from 'react';
import { Search, Eye, Edit, Save, X, DollarSign, Calendar, User, Building, AlertTriangle, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import './OverdueInstallments.css';
import { API_URL } from '../../../config';

const OverdueInstallments = () => {
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('all');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userBranch, setUserBranch] = useState(null);
  const [editingData, setEditingData] = useState({
    installmentId: null,
    paidAmount: '',
    remarks: '',
    maxPayable: 0,
  });
  const [saving, setSaving] = useState(false);

  // ✅ Real data (no more dummy overdueData)
  const [loading, setLoading] = useState(true);
  const [overdueAccounts, setOverdueAccounts] = useState([]);

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

    fetchOverdueAccounts(branch, role);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };
  const currentMonth = getCurrentMonth();

  // ============================================
  // ✅ FETCH ALL INSTALLMENTS (every page) — need full history per account
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
  // ✅ SAME shortfall-based status logic used across the app:
  //   - Clear   -> every installment fully paid
  //   - Aging   -> 3+ installments with a short (partial) payment
  //   - Overdue -> 1-2 installments with a short (partial) payment   ← THIS PAGE
  //   - Active  -> no short payments at all
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
  // ✅ BUILD THE OVERDUE LIST from all installments, grouped by account
  // ============================================
  const fetchOverdueAccounts = async (branch, role) => {
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

      const overdueList = [];

      grouped.forEach((list, accId) => {
        const sample = list[0];
        const account = sample.account || {};

        // ✅ Only accounts whose status is actually "Overdue" (1-2 short payments)
        const statusKey = getAccountStatusKey(list, account);
        if (statusKey !== 'overdue') return;

        const sortedInstallments = [...list].sort((a, b) => (a.month || '').localeCompare(b.month || ''));
        const shortfallCount = getShortfallCount(list);

        // ✅ Total overdue = sum of unpaid/short balances that are already due (month <= current month)
        const totalOverdue = sortedInstallments
          .filter(i => i.month && i.month <= currentMonth && parseFloat(i.balance || 0) > 0)
          .reduce((sum, i) => sum + parseFloat(i.balance || 0), 0);

        // ✅ Next payable installment = earliest one that still has a balance
        const nextPayable = sortedInstallments.find(i => parseFloat(i.balance || 0) > 0) || null;

        const customer = account.customer || {};

        overdueList.push({
          accountId: accId,
          caseNo: account.case_no || 'N/A',
          customerName: customer.name || 'N/A',
          customerCnic: customer.cnic || 'N/A',
          branch: account.branch_id,
          nextDueMonth: nextPayable?.month || null,
          monthlyInstallment: parseFloat(account.monthly_installment || 0),
          paidAmount: parseFloat(account.paid_amount || 0),
          balance: parseFloat(account.balance || 0),
          totalOverdue,
          shortfallCount,
          nextPayableInstallment: nextPayable,
          installments: sortedInstallments
        });
      });

      // Worst (highest overdue amount) first
      overdueList.sort((a, b) => b.totalOverdue - a.totalOverdue);

      setOverdueAccounts(overdueList);
    } catch (error) {
      console.error('Error fetching overdue accounts:', error);
      setOverdueAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  const canEdit = userRole === 'admin' || userRole === 'manager';

  // ===== FILTER (search + branch) =====
  const filtered = overdueAccounts.filter(item => {
    const searchMatch = item.customerName.toLowerCase().includes(search.toLowerCase()) ||
      item.caseNo.toLowerCase().includes(search.toLowerCase());

    let branchMatch = true;
    if (userBranch) {
      branchMatch = parseInt(item.branch) === parseInt(userBranch);
    } else if (branchFilter !== 'all') {
      branchMatch = parseInt(item.branch) === parseInt(branchFilter);
    }

    return searchMatch && branchMatch;
  });

  const totalBalance = filtered.reduce((sum, item) => sum + item.balance, 0);
  const totalOverdueSum = filtered.reduce((sum, item) => sum + item.totalOverdue, 0);

  const branchLabel = userBranch ? `Branch ${userBranch}` : (branchFilter !== 'all' ? `Branch ${branchFilter}` : 'All Branches');

  const formatMonth = (month) => {
    if (!month) return '-';
    return new Date(month + '-01').toLocaleDateString('en-PK', { month: 'short', year: 'numeric' });
  };

  const statCards = [
    {
      label: 'Total Balance',
      value: `PKR ${totalBalance.toLocaleString()}`,
      icon: DollarSign,
      color: '#C9A84C',
      bg: 'rgba(201, 168, 76, 0.15)',
      className: 'balance-card'
    },
    {
      label: 'Total Overdue',
      value: `PKR ${totalOverdueSum.toLocaleString()}`,
      icon: Clock,
      color: '#dc2626',
      bg: 'rgba(220, 38, 38, 0.12)',
      className: 'overdue-card'
    },
  ];

  const openEditModal = (record) => {
    setSelectedRecord(record);
    const nextInst = record.nextPayableInstallment;
    setEditingData({
      installmentId: nextInst?.id || null,
      paidAmount: '',
      remarks: '',
      maxPayable: nextInst ? parseFloat(nextInst.balance || 0) : 0,
    });
    setShowEditModal(true);
  };

  // ============================================
  // ✅ REAL SAVE — records payment against the next unpaid/partial installment
  // ============================================
  const handleSaveEdit = async () => {
    if (!canEdit) return;

    if (!editingData.installmentId) {
      alert('No payable installment found for this account.');
      return;
    }

    const amount = parseFloat(editingData.paidAmount);
    if (!amount || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (amount > editingData.maxPayable) {
      alert(`Amount cannot exceed the remaining balance of PKR ${editingData.maxPayable.toLocaleString()}`);
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/installments/partial-pay`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          installment_id: editingData.installmentId,
          paid_amount: amount
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('✅ Payment recorded successfully!');
        setShowEditModal(false);
        setSelectedRecord(null);
        // Refresh the list — account may move out of Overdue (e.g. into Clear/Active)
        const user = JSON.parse(localStorage.getItem('user'));
        fetchOverdueAccounts(user?.branch || null, user?.role || null);
      } else {
        alert('❌ Failed to record payment: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving payment:', error);
      alert('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="overdue-container">
      {/* ===== HEADER ===== */}
      <div className="overdue-header">
        <div className="header-left">
          <div className="header-title-group">
            <h2>Overdue Installments</h2>
            <span className="live-badge">
              <Clock size={12} /> Live
            </span>
          </div>
          <p className="subtitle">Accounts with 1-2 short (partial) payments</p>
        </div>
      </div>

      {/* ===== STATS - ONLY 2 CARDS ===== */}
      <div className="stats-grid-2">
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
      <div className="overdue-controls">
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search by customer or case..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ fontWeight: 500 }}
          />
        </div>

        {!userBranch && (
          <div className="branch-filters">
            <button 
              className={`filter-btn ${branchFilter === 'all' ? 'active' : ''}`}
              onClick={() => setBranchFilter('all')}
              style={{ fontWeight: 600 }}
            >
              All
            </button>
            <button 
              className={`filter-btn branch-1 ${branchFilter === '1' ? 'active' : ''}`}
              onClick={() => setBranchFilter('1')}
              style={{ fontWeight: 600 }}
            >
              Branch 1
            </button>
            <button 
              className={`filter-btn branch-2 ${branchFilter === '2' ? 'active' : ''}`}
              onClick={() => setBranchFilter('2')}
              style={{ fontWeight: 600 }}
            >
              Branch 2
            </button>
          </div>
        )}
      </div>

      {/* ===== TABLE ===== */}
      <div className="table-container">
        <div className="table-scroll">
          <table className="overdue-table">
            <thead>
              <tr>
                <th style={{ fontWeight: 800 }}>Case #</th>
                <th style={{ fontWeight: 800 }}>Customer</th>
                <th style={{ fontWeight: 800 }}>Next Due Month</th>
                <th style={{ fontWeight: 800 }}>Monthly (PKR)</th>
                <th style={{ fontWeight: 800 }}>Balance (PKR)</th>
                <th style={{ fontWeight: 800 }}>Total Overdue</th>
                <th style={{ fontWeight: 800 }}>Status</th>
                <th style={{ fontWeight: 800 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" className="no-data">Loading overdue accounts...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="8" className="no-data">No overdue records found for {branchLabel}</td></tr>
              ) : (
                filtered.map((item, index) => (
                  <tr key={item.accountId} className={`overdue-row ${index % 2 === 0 ? 'even-row' : 'odd-row'}`}>
                    <td className="case-number">{item.caseNo}</td>
                    <td>
                      <div className="customer-info">
                        <div className="customer-avatar" style={{ 
                          background: '#fee2e2',
                          color: '#991b1b'
                        }}>
                          {item.customerName.charAt(0)}
                        </div>
                        {item.customerName}
                      </div>
                    </td>
                    <td>
                      <div className="date-info">
                        <Calendar size={12} />
                        {formatMonth(item.nextDueMonth)}
                      </div>
                    </td>
                    <td className="amount" style={{ fontWeight: 600 }}>PKR {item.monthlyInstallment.toLocaleString()}</td>
                    <td className={item.balance > 0 ? 'balance-amount' : 'paid-amount'} style={{ fontWeight: 700 }}>
                      PKR {item.balance.toLocaleString()}
                    </td>
                    <td className="overdue-amount" style={{ fontWeight: 700, color: '#dc2626' }}>
                      PKR {item.totalOverdue.toLocaleString()}
                    </td>
                    <td>
                      <span className="status-badge overdue" style={{ fontWeight: 700 }}>
                        Overdue
                      </span>
                    </td>
                    <td>
                      <div className="action-group">
                        <button 
                          className={`btn-action ${canEdit ? 'btn-edit' : 'btn-view'}`}
                          onClick={() => openEditModal(item)}
                          title={canEdit ? "Edit Record" : "View Record"}
                          style={{ fontWeight: 700 }}
                        >
                          {canEdit ? <Edit size={15} /> : <Eye size={15} />}
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

      {/* ===== PAGINATION (kept simple, same as before) ===== */}
      {filtered.length > 0 && (
        <div className="pagination">
          <button style={{ fontWeight: 600 }} disabled>Previous</button>
          <span style={{ fontWeight: 600 }}>Page 1 of 1</span>
          <button style={{ fontWeight: 600 }} disabled>Next</button>
        </div>
      )}

      {/* ===== EDIT / VIEW MODAL ===== */}
      {showEditModal && selectedRecord && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-left">
                {canEdit ? <Edit size={20} className="modal-icon" /> : <Eye size={20} className="modal-icon" />}
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>{canEdit ? 'Edit' : 'View'} Record - {selectedRecord.caseNo}</h3>
              </div>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="modal-body">
              <div className="employee-detail-header">
                <div className="emp-detail-avatar" style={{ background: '#991b1b', fontSize: '1.1rem', fontWeight: 800 }}>
                  {selectedRecord.customerName.charAt(0)}
                </div>
                <div className="emp-detail-info">
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{selectedRecord.customerName}</h4>
                  <span className="emp-detail-branch" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Case: {selectedRecord.caseNo}</span>
                </div>
              </div>

              <div className="detail-grid">
                <div className="detail-item">
                  <span style={{ fontWeight: 700 }}>Case Number</span>
                  <strong className="case-number" style={{ fontWeight: 700 }}>{selectedRecord.caseNo}</strong>
                </div>
                <div className="detail-item">
                  <span style={{ fontWeight: 700 }}>Customer</span>
                  <strong style={{ fontWeight: 700 }}>{selectedRecord.customerName}</strong>
                </div>
                <div className="detail-item">
                  <span style={{ fontWeight: 700 }}>Next Due Month</span>
                  <strong style={{ fontWeight: 600 }}>{formatMonth(selectedRecord.nextDueMonth)}</strong>
                </div>
                <div className="detail-item">
                  <span style={{ fontWeight: 700 }}>Monthly Installment</span>
                  <strong style={{ fontWeight: 700 }}>PKR {selectedRecord.monthlyInstallment.toLocaleString()}</strong>
                </div>
                <div className="detail-item">
                  <span style={{ fontWeight: 700 }}>Total Overdue</span>
                  <strong className="overdue-amount" style={{ fontWeight: 800, color: '#dc2626' }}>
                    PKR {selectedRecord.totalOverdue.toLocaleString()}
                  </strong>
                </div>
              </div>

              <div className="installment-history">
                <div className="history-header">
                  <h4 style={{ fontWeight: 700 }}>Installment History</h4>
                  <span className="history-badge" style={{ fontWeight: 600 }}>{selectedRecord.installments.length} Months</span>
                </div>
                <div className="history-scroll">
                  <table className="history-table">
                    <thead>
                      <tr>
                        <th style={{ fontWeight: 800 }}>Month</th>
                        <th style={{ fontWeight: 800 }}>Due (PKR)</th>
                        <th style={{ fontWeight: 800 }}>Paid (PKR)</th>
                        <th style={{ fontWeight: 800 }}>Overdue</th>
                        <th style={{ fontWeight: 800 }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRecord.installments.map((inst, index) => {
                        const rowStatus = getInstallmentRowStatus(inst);
                        return (
                          <tr key={inst.id || index} className={`${rowStatus === 'unpaid' ? 'overdue-row' : ''} ${index % 2 === 0 ? 'even-row' : 'odd-row'}`}>
                            <td className="month-cell" style={{ fontWeight: 600 }}>{formatMonth(inst.month)}</td>
                            <td style={{ fontWeight: 600 }}>PKR {parseFloat(inst.due_amount || 0).toLocaleString()}</td>
                            <td className="paid-amount" style={{ fontWeight: 700 }}>PKR {parseFloat(inst.paid_amount || 0).toLocaleString()}</td>
                            <td className="overdue-amount" style={{ fontWeight: 700, color: '#dc2626' }}>PKR {parseFloat(inst.balance || 0).toLocaleString()}</td>
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

              <div className="edit-fields">
                {canEdit ? (
                  <>
                    <div className="form-group">
                      <label style={{ fontWeight: 700 }}>
                        Pay Installment — {formatMonth(selectedRecord.nextPayableInstallment?.month)}
                      </label>
                      <input
                        type="number"
                        className="form-input"
                        value={editingData.paidAmount}
                        onChange={(e) => setEditingData({ ...editingData, paidAmount: e.target.value })}
                        min="0"
                        max={editingData.maxPayable}
                        placeholder="Enter amount to pay..."
                        style={{ fontWeight: 600 }}
                        disabled={!selectedRecord.nextPayableInstallment}
                      />
                      <small className="field-hint" style={{ fontWeight: 600 }}>
                        {selectedRecord.nextPayableInstallment
                          ? `Max payable: PKR ${editingData.maxPayable.toLocaleString()}`
                          : 'No payable installment found for this account'}
                      </small>
                    </div>

                    <div className="form-group">
                      <label style={{ fontWeight: 700 }}>Remarks</label>
                      <textarea
                        className="form-input form-textarea"
                        value={editingData.remarks}
                        onChange={(e) => setEditingData({ ...editingData, remarks: e.target.value })}
                        placeholder="Add remarks or notes... (not saved yet — backend support needed)"
                        rows="3"
                        style={{ fontWeight: 500 }}
                      />
                    </div>
                  </>
                ) : (
                  <div className="view-only">
                    <div className="view-item">
                      <span style={{ fontWeight: 700 }}>Paid Amount</span>
                      <strong style={{ fontWeight: 700 }}>PKR {selectedRecord.paidAmount.toLocaleString()}</strong>
                    </div>
                    <div className="view-item">
                      <span style={{ fontWeight: 700 }}>Balance</span>
                      <strong className={selectedRecord.balance > 0 ? 'balance-amount' : 'paid-amount'} style={{ fontWeight: 700 }}>
                        PKR {selectedRecord.balance.toLocaleString()}
                      </strong>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowEditModal(false)} style={{ fontWeight: 700 }}>
                {canEdit ? 'Cancel' : 'Close'}
              </button>
              {canEdit && (
                <button className="btn-save" onClick={handleSaveEdit} style={{ fontWeight: 700 }} disabled={saving || !selectedRecord.nextPayableInstallment}>
                  {saving ? (
                    <>
                      <RefreshCw size={16} className="spinning" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Save Changes
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OverdueInstallments;