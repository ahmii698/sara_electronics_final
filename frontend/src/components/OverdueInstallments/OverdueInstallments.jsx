// src/components/OverdueInstallments/OverdueInstallments.jsx

import React, { useState, useEffect } from 'react';
import { Search, Eye, Edit, Save, X, DollarSign, Calendar, User, Building, AlertTriangle, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import './OverdueInstallments.css';
import { API_URL } from '../../../config';
import ExportButton from '../common/ExportButton';

const OverdueInstallments = () => {
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');
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

  const [loading, setLoading] = useState(true);
  const [overdueAccounts, setOverdueAccounts] = useState([]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    let branch = null;
    let role = null;

    if (user) {
      role = user.role;
      branch = user.branch_id;
      setUserRole(role);
      setUserBranch(branch);
      if (branch) {
        setBranchFilter(String(branch));
      }
    }

    fetchOverdueAccounts(branch, role);
  }, []);

  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };
  const currentMonth = getCurrentMonth();

  const monthsBetween = (fromMonth, toMonth) => {
    if (!fromMonth || !toMonth) return 0;
    const [fy, fm] = fromMonth.split('-').map(Number);
    const [ty, tm] = toMonth.split('-').map(Number);
    return (ty - fy) * 12 + (tm - fm);
  };

  const fetchOverdueAccounts = async (branch, role) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      let url = `${API_URL}/installments?status=all`;
      
      if (branch && role !== 'admin') {
        url += `&branch_id=${branch}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        let installmentsData = data.data;
        if (data.data && data.data.data) {
          installmentsData = data.data.data;
        } else if (Array.isArray(data.data)) {
          installmentsData = data.data;
        } else {
          installmentsData = [];
        }

        const grouped = new Map();
        installmentsData.forEach(inst => {
          const accId = inst.account_id || inst.account?.id;
          if (!accId) return;
          if (!grouped.has(accId)) grouped.set(accId, []);
          grouped.get(accId).push(inst);
        });

        const overdueList = [];

        grouped.forEach((list, accId) => {
          const sample = list[0];
          const account = sample.account || {};

          const sortedInstallments = [...list].sort((a, b) => (a.month || '').localeCompare(b.month || ''));

          const dueUnpaid = sortedInstallments.filter(i => 
            parseFloat(i.balance || 0) > 0 && 
            i.month && 
            monthsBetween(i.month, currentMonth) >= 0
          );

          if (dueUnpaid.length === 0) return;

          const totalOverdue = dueUnpaid.reduce((sum, i) => sum + parseFloat(i.balance || 0), 0);
          const nextPayable = dueUnpaid[0] || null;

          let overdueMonths = 0;
          if (dueUnpaid[0] && dueUnpaid[0].month) {
            overdueMonths = monthsBetween(dueUnpaid[0].month, currentMonth) + 1;
          }

          if (overdueMonths > 3) return;

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
            overdueMonths,
            nextPayableInstallment: nextPayable,
            installments: sortedInstallments,
            remarks: account.remarks || customer.remarks || ''
          });
        });

        overdueList.sort((a, b) => b.totalOverdue - a.totalOverdue);
        setOverdueAccounts(overdueList);
      }
    } catch (error) {
      console.error('Error fetching overdue accounts:', error);
      setOverdueAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  const canEdit = userRole === 'admin' || userRole === 'manager';

  const filtered = overdueAccounts.filter(item => {
    const searchMatch = item.customerName.toLowerCase().includes(search.toLowerCase()) ||
      item.caseNo.toLowerCase().includes(search.toLowerCase());

    let branchMatch = true;
    if (userBranch) {
      branchMatch = parseInt(item.branch) === parseInt(userBranch);
    } else if (branchFilter !== 'all') {
      branchMatch = parseInt(item.branch) === parseInt(branchFilter);
    }

    let monthMatch = true;
    if (monthFilter !== 'all') {
      monthMatch = item.overdueMonths === parseInt(monthFilter);
    }

    return searchMatch && branchMatch && monthMatch;
  });

  const totalBalance = filtered.reduce((sum, item) => sum + item.balance, 0);
  const totalOverdueSum = filtered.reduce((sum, item) => sum + item.totalOverdue, 0);

  const branchLabel = userBranch ? `Branch ${userBranch}` : (branchFilter !== 'all' ? `Branch ${branchFilter}` : 'All Branches');

  const formatMonth = (month) => {
    if (!month) return '-';
    return new Date(month + '-01').toLocaleDateString('en-PK', { month: 'short', year: 'numeric' });
  };

  const getOverdueLabel = (months) => {
    if (!months || months <= 0) return 'Overdue';
    return months === 1 ? 'Overdue - 1 Month' : `Overdue - ${months} Months`;
  };

  const getInstallmentRowStatus = (inst) => {
    const paid = parseFloat(inst.paid_amount || 0);
    const balance = parseFloat(inst.balance || 0);
    if (paid > 0 && balance <= 0) return 'paid';
    if (paid > 0 && balance > 0) return 'partial';
    return 'unpaid';
  };

  const statCards = [
    {
      label: 'Total Balance',
      value: `PKR ${totalBalance.toLocaleString()}`,
      icon: DollarSign,
      color: '#C9A84C',
      bg: 'rgba(201, 168, 76, 0.15)',
      className: 'oi-balance-card'
    },
    {
      label: 'Total Overdue',
      value: `PKR ${totalOverdueSum.toLocaleString()}`,
      icon: Clock,
      color: '#dc2626',
      bg: 'rgba(220, 38, 38, 0.12)',
      className: 'oi-overdue-card'
    },
  ];

  const openEditModal = (record) => {
    setSelectedRecord(record);
    const nextInst = record.nextPayableInstallment;
    setEditingData({
      installmentId: nextInst?.id || null,
      paidAmount: '',
      remarks: record.remarks || '',
      maxPayable: nextInst ? parseFloat(nextInst.balance || 0) : 0,
    });
    setShowEditModal(true);
  };

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
          paid_amount: amount,
          remarks: editingData.remarks || ''
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('✅ Payment recorded successfully!');
        setShowEditModal(false);
        setSelectedRecord(null);
        const user = JSON.parse(localStorage.getItem('user'));
        fetchOverdueAccounts(user?.branch_id || null, user?.role || null);
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

  const exportData = filtered.map(item => ({
    customerName: item.customerName,
    caseNo: item.caseNo,
    customerCnic: item.customerCnic,
    nextDueMonth: formatMonth(item.nextDueMonth),
    monthlyInstallment: item.monthlyInstallment,
    balance: item.balance,
    totalOverdue: item.totalOverdue,
    status: getOverdueLabel(item.overdueMonths),
    remarks: item.remarks || ''
  }));

  const exportColumns = [
    { header: 'Customer', key: 'customerName' },
    { header: 'Case No', key: 'caseNo' },
    { header: 'CNIC', key: 'customerCnic' },
    { header: 'Next Due Month', key: 'nextDueMonth' },
    { header: 'Monthly', key: 'monthlyInstallment' },
    { header: 'Balance', key: 'balance' },
    { header: 'Total Overdue', key: 'totalOverdue' },
    { header: 'Status', key: 'status' },
    { header: 'Remarks', key: 'remarks' },
  ];

  return (
    <div className="oi-container">
      <div className="oi-header">
        <div className="oi-header-left">
          <div className="oi-header-title-group">
            <h2>Overdue Installments</h2>
            <span className="oi-live-badge">
              <Clock size={12} /> Live
            </span>
          </div>
          <p className="oi-subtitle">Accounts whose oldest due installment is 1-3 months overdue</p>
        </div>
        <ExportButton
          data={exportData}
          columns={exportColumns}
          filename="overdue-installments"
          title="Overdue Installments Report"
        />
      </div>

      <div className="oi-stats-grid-2">
        {statCards.map((card, index) => (
          <div 
            key={index} 
            className={`oi-stat-card ${card.className}`}
            style={{ 
              borderLeft: `5px solid ${card.color}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}
          >
            <div className="oi-stat-icon" style={{ background: card.bg, color: card.color }}>
              <card.icon size={22} />
            </div>
            <div className="oi-stat-info">
              <span className="oi-stat-label" style={{ fontWeight: 700 }}>{card.label}</span>
              <span className="oi-stat-value" style={{ fontWeight: 800, color: card.color, fontSize: '1.3rem' }}>{card.value}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="oi-controls">
        <div className="oi-search-wrapper">
          <Search size={18} className="oi-search-icon" />
          <input
            type="text"
            placeholder="Search by customer or case..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ fontWeight: 500 }}
          />
        </div>

        <div className="oi-branch-filters">
          <button
            className={`oi-filter-btn ${monthFilter === 'all' ? 'active' : ''}`}
            onClick={() => setMonthFilter('all')}
            style={{ fontWeight: 600 }}
          >
            All Overdue
          </button>
          <button
            className={`oi-filter-btn ${monthFilter === '1' ? 'active' : ''}`}
            onClick={() => setMonthFilter('1')}
            style={{ fontWeight: 600 }}
          >
            1 Month
          </button>
          <button
            className={`oi-filter-btn ${monthFilter === '2' ? 'active' : ''}`}
            onClick={() => setMonthFilter('2')}
            style={{ fontWeight: 600 }}
          >
            2 Months
          </button>
          <button
            className={`oi-filter-btn ${monthFilter === '3' ? 'active' : ''}`}
            onClick={() => setMonthFilter('3')}
            style={{ fontWeight: 600 }}
          >
            3 Months
          </button>
        </div>

        {!userBranch && (
          <div className="oi-branch-filters">
            <button 
              className={`oi-filter-btn ${branchFilter === 'all' ? 'active' : ''}`}
              onClick={() => setBranchFilter('all')}
              style={{ fontWeight: 600 }}
            >
              All
            </button>
            <button 
              className={`oi-filter-btn oi-branch-1 ${branchFilter === '1' ? 'active' : ''}`}
              onClick={() => setBranchFilter('1')}
              style={{ fontWeight: 600 }}
            >
              Branch 1
            </button>
            <button 
              className={`oi-filter-btn oi-branch-2 ${branchFilter === '2' ? 'active' : ''}`}
              onClick={() => setBranchFilter('2')}
              style={{ fontWeight: 600 }}
            >
              Branch 2
            </button>
          </div>
        )}
      </div>

      <div className="oi-table-container">
        <div className="oi-table-scroll">
          <table className="oi-table">
            <thead>
              <tr>
                <th style={{ fontWeight: 800 }}>ID</th>
                <th style={{ fontWeight: 800 }}>Customer</th>
                <th style={{ fontWeight: 800 }}>Case #</th>
                <th style={{ fontWeight: 800 }}>Next Due Month</th>
                <th style={{ fontWeight: 800 }}>Installments</th>
                <th style={{ fontWeight: 800 }}>Balance (PKR)</th>
                <th style={{ fontWeight: 800 }}>Mirror</th>
                <th style={{ fontWeight: 800 }}>Remarks</th>
                <th style={{ fontWeight: 800 }}>Status</th>
                <th style={{ fontWeight: 800 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="10" className="oi-no-data">Loading overdue accounts...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="10" className="oi-no-data">No overdue records found for {branchLabel}</td></tr>
              ) : (
                filtered.map((item, index) => (
                  <tr key={item.accountId} className={`oi-row ${index % 2 === 0 ? 'oi-even-row' : 'oi-odd-row'}`}>
                    <td className="oi-serial">{index + 1}</td>
                    <td>
                      <div className="oi-customer-info">
                        <div className="oi-customer-avatar" style={{ 
                          background: '#fee2e2',
                          color: '#991b1b'
                        }}>
                          {item.customerName.charAt(0)}
                        </div>
                        {item.customerName}
                      </div>
                    </td>
                    <td className="oi-case-number">{item.caseNo}</td>
                    <td>
                      <div className="oi-date-info">
                        <Calendar size={12} />
                        {formatMonth(item.nextDueMonth)}
                      </div>
                    </td>
                    <td className="oi-amount" style={{ fontWeight: 600 }}>PKR {item.monthlyInstallment.toLocaleString()}</td>
                    <td className={item.balance > 0 ? 'oi-balance-amount' : 'oi-paid-amount'} style={{ fontWeight: 700 }}>
                      PKR {item.balance.toLocaleString()}
                    </td>
                    <td className="oi-overdue-amount" style={{ fontWeight: 700, color: '#dc2626' }}>
                      PKR {item.totalOverdue.toLocaleString()}
                    </td>
                    <td className="oi-remarks-cell" style={{ fontSize: '0.85rem', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.remarks || '-'}
                    </td>
                    <td>
                      <span className="oi-status-badge oi-overdue-badge" style={{ fontWeight: 700 }}>
                        {getOverdueLabel(item.overdueMonths)}
                      </span>
                    </td>
                    <td>
                      <div className="oi-action-group">
                        <button 
                          className={`oi-btn-action ${canEdit ? 'oi-btn-edit' : 'oi-btn-view'}`}
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

      {filtered.length > 0 && (
        <div className="oi-pagination">
          <button style={{ fontWeight: 600 }} disabled>Previous</button>
          <span style={{ fontWeight: 600 }}>Page 1 of 1</span>
          <button style={{ fontWeight: 600 }} disabled>Next</button>
        </div>
      )}

      {showEditModal && selectedRecord && (
        <div className="oi-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="oi-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="oi-modal-header">
              <div className="oi-modal-header-left">
                {canEdit ? <Edit size={20} className="oi-modal-icon" /> : <Eye size={20} className="oi-modal-icon" />}
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>{canEdit ? 'Edit' : 'View'} Record - {selectedRecord.caseNo}</h3>
              </div>
              <button className="oi-modal-close" onClick={() => setShowEditModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="oi-modal-body">
              <div className="oi-employee-detail-header">
                <div className="oi-emp-detail-avatar" style={{ background: '#991b1b', fontSize: '1.1rem', fontWeight: 800 }}>
                  {selectedRecord.customerName.charAt(0)}
                </div>
                <div className="oi-emp-detail-info">
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{selectedRecord.customerName}</h4>
                  <span className="oi-emp-detail-branch" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Case: {selectedRecord.caseNo}</span>
                </div>
              </div>

              <div className="oi-detail-grid">
                <div className="oi-detail-item">
                  <span style={{ fontWeight: 700 }}>Case Number</span>
                  <strong className="oi-case-number" style={{ fontWeight: 700 }}>{selectedRecord.caseNo}</strong>
                </div>
                <div className="oi-detail-item">
                  <span style={{ fontWeight: 700 }}>Customer</span>
                  <strong style={{ fontWeight: 700 }}>{selectedRecord.customerName}</strong>
                </div>
                <div className="oi-detail-item">
                  <span style={{ fontWeight: 700 }}>Next Due Month</span>
                  <strong style={{ fontWeight: 600 }}>{formatMonth(selectedRecord.nextDueMonth)}</strong>
                </div>
                <div className="oi-detail-item">
                  <span style={{ fontWeight: 700 }}>Monthly Installment</span>
                  <strong style={{ fontWeight: 700 }}>PKR {selectedRecord.monthlyInstallment.toLocaleString()}</strong>
                </div>
                <div className="oi-detail-item">
                  <span style={{ fontWeight: 700 }}>Total Overdue</span>
                  <strong className="oi-overdue-amount" style={{ fontWeight: 800, color: '#dc2626' }}>
                    PKR {selectedRecord.totalOverdue.toLocaleString()}
                  </strong>
                </div>
                <div className="oi-detail-item">
                  <span style={{ fontWeight: 700 }}>Overdue Since</span>
                  <strong style={{ fontWeight: 700, color: '#dc2626' }}>
                    {getOverdueLabel(selectedRecord.overdueMonths)}
                  </strong>
                </div>
              </div>

              <div className="oi-installment-history">
                <div className="oi-history-header">
                  <h4 style={{ fontWeight: 700 }}>Installment History</h4>
                  <span className="oi-history-badge" style={{ fontWeight: 600 }}>{selectedRecord.installments.length} Months</span>
                </div>
                <div className="oi-history-scroll">
                  <table className="oi-history-table">
                    <thead>
                      <tr>
                        <th style={{ fontWeight: 800 }}>Month</th>
                        <th style={{ fontWeight: 800 }}>Due (PKR)</th>
                        <th style={{ fontWeight: 800 }}>Paid (PKR)</th>
                        <th style={{ fontWeight: 800 }}>Overdue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRecord.installments.map((inst, index) => {
                        const rowStatus = getInstallmentRowStatus(inst);
                        return (
                          <tr key={inst.id || index} className={`${rowStatus === 'unpaid' ? 'oi-row-overdue' : ''} ${index % 2 === 0 ? 'oi-even-row' : 'oi-odd-row'}`}>
                            <td className="oi-month-cell" style={{ fontWeight: 600 }}>{formatMonth(inst.month)}</td>
                            <td style={{ fontWeight: 600 }}>PKR {parseFloat(inst.due_amount || 0).toLocaleString()}</td>
                            <td className="oi-paid-amount" style={{ fontWeight: 700 }}>PKR {parseFloat(inst.paid_amount || 0).toLocaleString()}</td>
                            <td className="oi-overdue-amount" style={{ fontWeight: 700, color: '#dc2626' }}>PKR {parseFloat(inst.balance || 0).toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="oi-edit-fields">
                {canEdit ? (
                  <>
                    <div className="oi-form-group">
                      <label style={{ fontWeight: 700 }}>
                        Pay Installment — {formatMonth(selectedRecord.nextPayableInstallment?.month)}
                      </label>
                      <input
                        type="number"
                        className="oi-form-input"
                        value={editingData.paidAmount}
                        onChange={(e) => setEditingData({ ...editingData, paidAmount: e.target.value })}
                        min="0"
                        max={editingData.maxPayable}
                        placeholder="Enter amount to pay..."
                        style={{ fontWeight: 600 }}
                        disabled={!selectedRecord.nextPayableInstallment}
                      />
                      <small className="oi-field-hint" style={{ fontWeight: 600 }}>
                        {selectedRecord.nextPayableInstallment
                          ? `Max payable: PKR ${editingData.maxPayable.toLocaleString()}`
                          : 'No payable installment found for this account'}
                      </small>
                    </div>

                    <div className="oi-form-group">
                      <label style={{ fontWeight: 700 }}>Remarks</label>
                      <textarea
                        className="oi-form-input oi-form-textarea"
                        value={editingData.remarks}
                        onChange={(e) => setEditingData({ ...editingData, remarks: e.target.value })}
                        placeholder="Add remarks or notes..."
                        rows="3"
                        style={{ fontWeight: 500 }}
                      />
                    </div>
                  </>
                ) : (
                  <div className="oi-view-only">
                    <div className="oi-view-item">
                      <span style={{ fontWeight: 700 }}>Paid Amount</span>
                      <strong style={{ fontWeight: 700 }}>PKR {selectedRecord.paidAmount.toLocaleString()}</strong>
                    </div>
                    <div className="oi-view-item">
                      <span style={{ fontWeight: 700 }}>Balance</span>
                      <strong className={selectedRecord.balance > 0 ? 'oi-balance-amount' : 'oi-paid-amount'} style={{ fontWeight: 700 }}>
                        PKR {selectedRecord.balance.toLocaleString()}
                      </strong>
                    </div>
                    <div className="oi-view-item">
                      <span style={{ fontWeight: 700 }}>Remarks</span>
                      <strong style={{ fontWeight: 600 }}>{selectedRecord.remarks || 'No remarks'}</strong>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="oi-modal-footer">
              <button className="oi-btn-cancel" onClick={() => setShowEditModal(false)} style={{ fontWeight: 700 }}>
                {canEdit ? 'Cancel' : 'Close'}
              </button>
              {canEdit && (
                <button className="oi-btn-save" onClick={handleSaveEdit} style={{ fontWeight: 700 }} disabled={saving || !selectedRecord.nextPayableInstallment}>
                  {saving ? (
                    <>
                      <RefreshCw size={16} className="oi-spinning" />
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