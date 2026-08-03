// src/components/OverdueInstallments/OverdueInstallments.jsx

import React, { useState, useEffect } from 'react';
import { Search, Eye, Edit, Save, X, DollarSign, Calendar, User, Building, AlertTriangle, CheckCircle, Clock, RefreshCw, FileText, Users } from 'lucide-react';
import './OverdueInstallments.css';
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

const OverdueInstallments = () => {
  const [search, setSearch] = useState('');
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
      branch = user.branch;
      setUserRole(role);
      setUserBranch(branch);
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
      
      // ✅ Sirf admin ko sab dikhega, baaki ko sirf apna branch
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

        for (const [accId, list] of grouped) {
          const sample = list[0];
          const account = sample.account || {};

          const sortedInstallments = [...list].sort((a, b) => (a.month || '').localeCompare(b.month || ''));

          const dueUnpaid = sortedInstallments.filter(i => 
            parseFloat(i.balance || 0) > 0 && 
            i.month && 
            monthsBetween(i.month, currentMonth) >= 0
          );

          if (dueUnpaid.length === 0) continue;

          const totalOverdue = dueUnpaid.reduce((sum, i) => sum + parseFloat(i.balance || 0), 0);
          const nextPayable = dueUnpaid[0] || null;

          let overdueMonths = 0;
          if (dueUnpaid[0] && dueUnpaid[0].month) {
            overdueMonths = monthsBetween(dueUnpaid[0].month, currentMonth) + 1;
          }

          if (overdueMonths > 3) continue;

          const customer = account.customer || {};

          // ✅ GUARANTORS KO PROPERLY FETCH KARO - Multiple possible paths
          let guarantors = [];
          
          if (customer.guarantors && Array.isArray(customer.guarantors)) {
            guarantors = customer.guarantors;
          }
          else if (account.guarantors && Array.isArray(account.guarantors)) {
            guarantors = account.guarantors;
          }
          else if (sample.guarantors && Array.isArray(sample.guarantors)) {
            guarantors = sample.guarantors;
          }
          else if (customer.guarantor && Array.isArray(customer.guarantor)) {
            guarantors = customer.guarantor;
          }
          else if (account.guarantor && Array.isArray(account.guarantor)) {
            guarantors = account.guarantor;
          }

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
            // ✅ FIX: remarks ab is account ki agli payable installment (jo table row mein represent ho rahi hai) se aayenge,
            // account/customer se nahi — kyunke 'remarks' column installments table mein hai, account mein nahi.
            remarks: nextPayable?.remarks || '',
            customer: customer,
            account: account,
            guarantors: guarantors,
          });
        }

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

    // ✅ Branch filter hata diya - sirf logged-in user ka branch show hoga
    // Admin ko sab dikhega (kyunki fetch mein admin ke liye branch filter nahi lagta)

    let monthMatch = true;
    if (monthFilter !== 'all') {
      monthMatch = item.overdueMonths === parseInt(monthFilter);
    }

    return searchMatch && monthMatch;
  });

  const totalBalance = filtered.reduce((sum, item) => sum + item.balance, 0);
  const totalOverdueSum = filtered.reduce((sum, item) => sum + item.totalOverdue, 0);

  const branchLabel = userBranch ? `Branch ${userBranch}` : 'All Branches';

  const formatMonth = (month) => {
    if (!month) return '-';
    return new Date(month + '-01').toLocaleDateString('en-PK', { month: 'short', year: 'numeric' });
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-PK', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getAgingLabel = (months) => {
    if (!months || months <= 0) return 'Aging';
    return months === 1 ? 'Aging - 1 Month' : `Aging - ${months} Months`;
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
      label: 'Total Aging',
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
      // ✅ FIX: remarks ab installment se hi aa rahe hain (record.remarks already isi se set hai)
      remarks: record.remarks || '',
      maxPayable: nextInst ? parseFloat(nextInst.balance || 0) : 0,
    });
    setShowEditModal(true);
  };

  // ✅ UPDATED: ab amount dena zaroori nahi. Agar sirf remarks likhe hain (amount 0/khaali)
  // to bhi save ho jayega, sirf remarks update honge, koi payment record nahi hogi.
  const handleSaveEdit = async () => {
    if (!canEdit) return;

    if (!editingData.installmentId) {
      alert('No payable installment found for this account.');
      return;
    }

    const amount = parseFloat(editingData.paidAmount) || 0;
    const hasRemarks = (editingData.remarks || '').trim().length > 0;

    // ✅ NEW: kam se kam amount ya remarks mein se koi ek hona chahiye
    if (amount <= 0 && !hasRemarks) {
      alert('Please enter a payment amount or add remarks');
      return;
    }

    // ✅ NEW: balance check sirf tab lagega jab actual amount diya ho
    if (amount > 0 && amount > editingData.maxPayable) {
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
        // ✅ NEW: amount ke hisaab se alag message
        alert(amount > 0 ? 'Payment recorded successfully!' : 'Remarks saved successfully!');
        setShowEditModal(false);
        setSelectedRecord(null);
        const user = JSON.parse(localStorage.getItem('user'));
        fetchOverdueAccounts(user?.branch || null, user?.role || null);
      } else {
        alert('Failed to save: ' + (data.message || 'Unknown error'));
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
    totalAging: item.totalOverdue,
    status: getAgingLabel(item.overdueMonths),
    remarks: item.remarks || ''
  }));

  const exportColumns = [
    { header: 'Customer', key: 'customerName' },
    { header: 'Case No', key: 'caseNo' },
    { header: 'CNIC', key: 'customerCnic' },
    { header: 'Next Due Month', key: 'nextDueMonth' },
    { header: 'Monthly', key: 'monthlyInstallment' },
    { header: 'Balance', key: 'balance' },
    { header: 'Total Aging', key: 'totalAging' },
    { header: 'Status', key: 'status' },
    { header: 'Remarks', key: 'remarks' },
  ];

  return (
    <div className="oi-container">
      <div className="oi-header">
        <div className="oi-header-left">
          <div className="oi-header-title-group">
            <h2>Aging Accounts</h2>
            <span className="oi-live-badge">
              <Clock size={12} /> Live
            </span>
          </div>
          <p className="oi-subtitle">
            Accounts whose oldest due installment is 1-3 months aging
            {userBranch && <span style={{ fontWeight: 600, marginLeft: '8px', color: '#4b5563' }}>• Branch {userBranch}</span>}
          </p>
        </div>
        <ExportButton
          data={exportData}
          columns={exportColumns}
          filename="aging-accounts"
          title="Aging Accounts Report"
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
            All Aging
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

        {/* ✅ BRANCH FILTER BUTTONS COMPLETELY REMOVED */}
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
                <th style={{ fontWeight: 800 }}>Aging</th>
                <th style={{ fontWeight: 800 }}>Remarks</th>
                <th style={{ fontWeight: 800 }}>Status</th>
                <th style={{ fontWeight: 800 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" className="oi-no-data">Loading aging accounts...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="10" className="oi-no-data">No aging records found for {branchLabel}</td>
                </tr>
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
                    <td className="oi-remarks-cell" style={{ fontSize: '0.85rem', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.remarks || ''}>
                      {item.remarks || '-'}
                    </td>
                    <td>
                      <span className="oi-status-badge oi-overdue-badge" style={{ fontWeight: 700 }}>
                        {getAgingLabel(item.overdueMonths)}
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
                  <span style={{ fontWeight: 700 }}>CNIC</span>
                  <strong style={{ fontWeight: 700 }}>{selectedRecord.customerCnic || 'N/A'}</strong>
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
                  <span style={{ fontWeight: 700 }}>Total Aging</span>
                  <strong className="oi-overdue-amount" style={{ fontWeight: 800, color: '#dc2626' }}>
                    PKR {selectedRecord.totalOverdue.toLocaleString()}
                  </strong>
                </div>
                <div className="oi-detail-item">
                  <span style={{ fontWeight: 700 }}>Aging Since</span>
                  <strong style={{ fontWeight: 700, color: '#dc2626' }}>
                    {getAgingLabel(selectedRecord.overdueMonths)}
                  </strong>
                </div>
                <div className="oi-detail-item">
                  <span style={{ fontWeight: 700 }}>Account Opening</span>
                  <strong style={{ fontWeight: 600 }}>
                    {formatDate(selectedRecord.account?.created_at)}
                  </strong>
                </div>
              </div>

              {/* ============================================ */}
              {/* DOCUMENTS SECTION */}
              {/* ============================================ */}
              <div className="oi-documents-section" style={{ marginTop: '20px', borderTop: '2px solid #e5e7eb', paddingTop: '20px' }}>
                <div className="oi-section-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <FileText size={20} style={{ color: '#374151' }} />
                  <h4 style={{ fontWeight: 700, fontSize: '16px', margin: 0, color: '#1f2937' }}>Original Form Documents</h4>
                </div>

                {/* Customer CNIC Images */}
                <div style={{ marginBottom: '20px' }}>
                  <h5 style={{ fontWeight: 700, fontSize: '14px', marginBottom: '10px', color: '#374151' }}>
                    Customer CNIC
                  </h5>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                    {selectedRecord.customer?.cnic_front && (
                      <DocImage label="CNIC Front" src={getFileUrl(selectedRecord.customer.cnic_front)} />
                    )}
                    {selectedRecord.customer?.cnic_back && (
                      <DocImage label="CNIC Back" src={getFileUrl(selectedRecord.customer.cnic_back)} />
                    )}
                    {!selectedRecord.customer?.cnic_front && !selectedRecord.customer?.cnic_back && (
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
                    {selectedRecord.customer?.additional_image_1 && (
                      <DocImage label="Additional Image 1" src={getFileUrl(selectedRecord.customer.additional_image_1)} />
                    )}
                    {selectedRecord.customer?.additional_image_2 && (
                      <DocImage label="Additional Image 2" src={getFileUrl(selectedRecord.customer.additional_image_2)} />
                    )}
                    {!selectedRecord.customer?.additional_image_1 && !selectedRecord.customer?.additional_image_2 && (
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
                    {selectedRecord.account?.chalan_front && (
                      <DocImage label="Chalan Front" src={getFileUrl(selectedRecord.account.chalan_front)} />
                    )}
                    {selectedRecord.account?.chalan_back && (
                      <DocImage label="Chalan Back" src={getFileUrl(selectedRecord.account.chalan_back)} />
                    )}
                    {!selectedRecord.account?.chalan_front && !selectedRecord.account?.chalan_back && (
                      <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>No chalan images found</p>
                    )}
                  </div>
                </div>

                {/* Voice Consent */}
                {selectedRecord.customer?.voice_consent && (
                  <div style={{ marginBottom: '20px' }}>
                    <h5 style={{ fontWeight: 700, fontSize: '14px', marginBottom: '10px', color: '#374151' }}>
                      Voice Consent (Raza Mandi)
                    </h5>
                    <audio controls style={{ width: '100%' }}>
                      <source src={getFileUrl(selectedRecord.customer.voice_consent)} />
                      Your browser does not support audio playback.
                    </audio>
                  </div>
                )}

                {/* Guarantors' CNIC Images */}
                <div>
                  <h5 style={{ fontWeight: 700, fontSize: '14px', marginBottom: '10px', color: '#374151' }}>
                    Guarantors' CNIC Images
                  </h5>
                  {selectedRecord.guarantors && selectedRecord.guarantors.length > 0 ? (
                    selectedRecord.guarantors.map((g, idx) => (
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

              <div className="oi-installment-history" style={{ marginTop: '20px' }}>
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
                        <th style={{ fontWeight: 800 }}>Aging</th>
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
                        placeholder="Enter amount to pay (leave empty to just save remarks)..."
                        style={{ fontWeight: 600 }}
                        disabled={!selectedRecord.nextPayableInstallment}
                      />
                      <small className="oi-field-hint" style={{ fontWeight: 600 }}>
                        {selectedRecord.nextPayableInstallment
                          ? `Max payable: PKR ${editingData.maxPayable.toLocaleString()} — amount is optional if you're only adding remarks`
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