import React, { useState, useEffect } from 'react';
import { Search, Eye, Edit, Save, X, DollarSign, Calendar, User, Building, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import './OverdueInstallments.css';

const OverdueInstallments = () => {
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('all');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userBranch, setUserBranch] = useState(null);
  const [editingData, setEditingData] = useState({
    paidAmount: '',
    remarks: '',
  });

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

  const [overdueData, setOverdueData] = useState([
    {
      id: 1,
      caseNo: 'SR-001',
      customer: 'Ahmed Khan',
      branch: 1,
      dueDate: '2026-01-15',
      monthlyInstallment: 5000,
      paidAmount: 3000,
      balance: 2000,
      totalOverdue: 2000,
      remarks: 'Payment delayed due to financial issues',
      status: 'partial',
      installments: [
        { month: 'Jan 2026', due: 5000, paid: 3000, status: 'partial', overdue: 2000 },
        { month: 'Feb 2026', due: 5000, paid: 0, status: 'unpaid', overdue: 5000 },
        { month: 'Mar 2026', due: 5000, paid: 0, status: 'unpaid', overdue: 5000 },
      ]
    },
    {
      id: 2,
      caseNo: 'SR-003',
      customer: 'Usman Malik',
      branch: 1,
      dueDate: '2026-01-20',
      monthlyInstallment: 4000,
      paidAmount: 2000,
      balance: 2000,
      totalOverdue: 6000,
      remarks: 'Customer is out of city',
      status: 'overdue',
      installments: [
        { month: 'Jan 2026', due: 4000, paid: 2000, status: 'partial', overdue: 2000 },
        { month: 'Feb 2026', due: 4000, paid: 0, status: 'unpaid', overdue: 4000 },
        { month: 'Mar 2026', due: 4000, paid: 0, status: 'unpaid', overdue: 4000 },
      ]
    },
    {
      id: 3,
      caseNo: 'SR-004',
      customer: 'Fatima Noor',
      branch: 2,
      dueDate: '2026-01-25',
      monthlyInstallment: 6000,
      paidAmount: 4000,
      balance: 2000,
      totalOverdue: 8000,
      remarks: 'Will pay next month',
      status: 'partial',
      installments: [
        { month: 'Jan 2026', due: 6000, paid: 4000, status: 'partial', overdue: 2000 },
        { month: 'Feb 2026', due: 6000, paid: 0, status: 'unpaid', overdue: 6000 },
        { month: 'Mar 2026', due: 6000, paid: 0, status: 'unpaid', overdue: 6000 },
      ]
    },
    {
      id: 4,
      caseNo: 'SR-006',
      customer: 'Zainab Khan',
      branch: 2,
      dueDate: '2026-02-01',
      monthlyInstallment: 7000,
      paidAmount: 5000,
      balance: 2000,
      totalOverdue: 2000,
      remarks: 'Paid partially',
      status: 'partial',
      installments: [
        { month: 'Feb 2026', due: 7000, paid: 5000, status: 'partial', overdue: 2000 },
      ]
    },
    {
      id: 5,
      caseNo: 'SR-007',
      customer: 'Bilal Ahmed',
      branch: 1,
      dueDate: '2026-02-10',
      monthlyInstallment: 3000,
      paidAmount: 0,
      balance: 3000,
      totalOverdue: 9000,
      remarks: 'No payment received',
      status: 'overdue',
      installments: [
        { month: 'Feb 2026', due: 3000, paid: 0, status: 'unpaid', overdue: 3000 },
        { month: 'Mar 2026', due: 3000, paid: 0, status: 'unpaid', overdue: 3000 },
        { month: 'Apr 2026', due: 3000, paid: 0, status: 'unpaid', overdue: 3000 },
      ]
    },
    {
      id: 6,
      caseNo: 'SR-008',
      customer: 'Hina Riaz',
      branch: 2,
      dueDate: '2026-02-15',
      monthlyInstallment: 5000,
      paidAmount: 1000,
      balance: 4000,
      totalOverdue: 4000,
      remarks: 'Paid only 1000',
      status: 'partial',
      installments: [
        { month: 'Feb 2026', due: 5000, paid: 1000, status: 'partial', overdue: 4000 },
      ]
    },
  ]);

  const canEdit = userRole === 'admin' || userRole === 'manager';
  const isEmployee = userRole === 'employee';

  const filtered = overdueData.filter(item => {
    const searchMatch = item.customer.toLowerCase().includes(search.toLowerCase()) ||
      item.caseNo.toLowerCase().includes(search.toLowerCase());
    
    let branchMatch = true;
    if (userBranch) {
      branchMatch = item.branch === parseInt(userBranch);
    } else if (branchFilter !== 'all') {
      branchMatch = item.branch === parseInt(branchFilter);
    }
    
    return searchMatch && branchMatch;
  });

  const openEditModal = (record) => {
    setSelectedRecord(record);
    setEditingData({
      paidAmount: record.paidAmount.toString(),
      remarks: record.remarks || '',
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (!editingData.paidAmount || parseInt(editingData.paidAmount) < 0) {
      alert('Please enter a valid amount');
      return;
    }

    const newPaid = parseInt(editingData.paidAmount);
    const remaining = selectedRecord.monthlyInstallment - newPaid;

    setOverdueData(overdueData.map(item => {
      if (item.id === selectedRecord.id) {
        return {
          ...item,
          paidAmount: newPaid,
          balance: remaining > 0 ? remaining : 0,
          status: remaining <= 0 ? 'paid' : (newPaid > 0 ? 'partial' : 'unpaid'),
          remarks: editingData.remarks || item.remarks,
          totalOverdue: remaining > 0 ? item.totalOverdue : 0,
        };
      }
      return item;
    }));

    setShowEditModal(false);
    setSelectedRecord(null);
    alert('Record updated successfully!');
  };

  const totalBalance = filtered.reduce((sum, item) => sum + item.balance, 0);
  const totalOverdue = filtered.reduce((sum, item) => sum + item.totalOverdue, 0);

  const branchLabel = userBranch ? `Branch ${userBranch}` : (branchFilter !== 'all' ? `Branch ${branchFilter}` : 'All Branches');

  // Colorful stat cards
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
      value: `PKR ${totalOverdue.toLocaleString()}`,
      icon: Clock,
      color: '#dc2626',
      bg: 'rgba(220, 38, 38, 0.12)',
      className: 'overdue-card'
    },
  ];

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
          <p className="subtitle">Accounts with pending or partial payments</p>
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
                <th style={{ fontWeight: 800 }}>Due Date</th>
                <th style={{ fontWeight: 800 }}>Monthly (PKR)</th>
                <th style={{ fontWeight: 800 }}>Balance (PKR)</th>
                <th style={{ fontWeight: 800 }}>Total Overdue</th>
                <th style={{ fontWeight: 800 }}>Status</th>
                <th style={{ fontWeight: 800 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="8" className="no-data">No overdue records found for {branchLabel}</td></tr>
              ) : (
                filtered.map((item, index) => (
                  <tr key={item.id} className={`${item.status === 'overdue' ? 'overdue-row' : ''} ${index % 2 === 0 ? 'even-row' : 'odd-row'}`}>
                    <td className="case-number">{item.caseNo}</td>
                    <td>
                      <div className="customer-info">
                        <div className="customer-avatar" style={{ 
                          background: item.status === 'overdue' ? '#fee2e2' : '#fef3c7',
                          color: item.status === 'overdue' ? '#991b1b' : '#92400e'
                        }}>
                          {item.customer.charAt(0)}
                        </div>
                        {item.customer}
                      </div>
                    </td>
                    <td>
                      <div className="date-info">
                        <Calendar size={12} />
                        {item.dueDate}
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
                      <span className={`status-badge ${item.status}`} style={{ fontWeight: 700 }}>
                        {item.status === 'paid' ? 'Paid' : 
                         item.status === 'partial' ? 'Partial' : 'Overdue'}
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

      {/* ===== PAGINATION ===== */}
      {filtered.length > 0 && (
        <div className="pagination">
          <button style={{ fontWeight: 600 }}>Previous</button>
          <span style={{ fontWeight: 600 }}>Page 1 of 1</span>
          <button style={{ fontWeight: 600 }}>Next</button>
        </div>
      )}

      {/* ===== EDIT MODAL ===== */}
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
                <div className="emp-detail-avatar" style={{ background: selectedRecord.status === 'overdue' ? '#991b1b' : '#1E1B4B', fontSize: '1.1rem', fontWeight: 800 }}>
                  {selectedRecord.customer.charAt(0)}
                </div>
                <div className="emp-detail-info">
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{selectedRecord.customer}</h4>
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
                  <strong style={{ fontWeight: 700 }}>{selectedRecord.customer}</strong>
                </div>
                <div className="detail-item">
                  <span style={{ fontWeight: 700 }}>Due Date</span>
                  <strong style={{ fontWeight: 600 }}>{selectedRecord.dueDate}</strong>
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
                      {selectedRecord.installments.map((inst, index) => (
                        <tr key={index} className={`${inst.status === 'unpaid' ? 'overdue-row' : ''} ${index % 2 === 0 ? 'even-row' : 'odd-row'}`}>
                          <td className="month-cell" style={{ fontWeight: 600 }}>{inst.month}</td>
                          <td style={{ fontWeight: 600 }}>PKR {inst.due.toLocaleString()}</td>
                          <td className="paid-amount" style={{ fontWeight: 700 }}>PKR {inst.paid.toLocaleString()}</td>
                          <td className="overdue-amount" style={{ fontWeight: 700, color: '#dc2626' }}>PKR {inst.overdue.toLocaleString()}</td>
                          <td>
                            <span className={`status-badge ${inst.status}`} style={{ fontWeight: 700 }}>
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

              <div className="edit-fields">
                {canEdit ? (
                  <>
                    <div className="form-group">
                      <label style={{ fontWeight: 700 }}>Paid Amount (PKR)</label>
                      <input
                        type="number"
                        className="form-input"
                        value={editingData.paidAmount}
                        onChange={(e) => setEditingData({ ...editingData, paidAmount: e.target.value })}
                        min="0"
                        placeholder="Enter paid amount..."
                        style={{ fontWeight: 600 }}
                      />
                      <small className="field-hint" style={{ fontWeight: 600 }}>Enter total paid amount for this customer</small>
                    </div>

                    <div className="form-group">
                      <label style={{ fontWeight: 700 }}>Remarks</label>
                      <textarea
                        className="form-input form-textarea"
                        value={editingData.remarks}
                        onChange={(e) => setEditingData({ ...editingData, remarks: e.target.value })}
                        placeholder="Add remarks or notes..."
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
                    {selectedRecord.remarks && (
                      <div className="view-item full-width">
                        <span style={{ fontWeight: 700 }}>Remarks</span>
                        <strong className="remarks-text" style={{ fontWeight: 600 }}>{selectedRecord.remarks}</strong>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowEditModal(false)} style={{ fontWeight: 700 }}>
                {canEdit ? 'Cancel' : 'Close'}
              </button>
              {canEdit && (
                <button className="btn-save" onClick={handleSaveEdit} style={{ fontWeight: 700 }}>
                  <Save size={16} />
                  Save Changes
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