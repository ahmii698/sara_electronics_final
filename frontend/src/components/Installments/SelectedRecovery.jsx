// src/components/Installments/SelectedRecovery.jsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search, Clock, CheckCircle, AlertCircle, Building, X,
  Eye, Edit2, ChevronLeft, ChevronRight, AlertTriangle,
  RefreshCw, Save, UserCheck, Lock
} from 'lucide-react';
import './Installments.css';
import { API_URL } from '../../../config';

const SelectedRecovery = () => {
  const [installments, setInstallments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [userBranch, setUserBranch] = useState(null);
  const [userRole, setUserRole] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editPaymentData, setEditPaymentData] = useState({
    paid_amount: '',
    month: '',
    installment_id: null,
    due_amount: 0,
    current_paid: 0,
    balance: 0,
    customer_name: '',
    case_no: ''
  });
  const [editLoading, setEditLoading] = useState(false);
  const [paymentDate, setPaymentDate] = useState('');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setUserBranch(user.branch);
      setUserRole(user.role);
    }
    setPaymentDate(new Date().toISOString().split('T')[0]);
    fetchMyAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const fetchMyAssignments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/recovery-assignments/my`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setInstallments(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching assigned recovery:', error);
    } finally {
      setLoading(false);
    }
  };

  const monthsBetween = useCallback((fromMonth, toMonth) => {
    if (!fromMonth || !toMonth) return 0;
    const [fy, fm] = fromMonth.split('-').map(Number);
    const [ty, tm] = toMonth.split('-').map(Number);
    return (ty - fy) * 12 + (tm - fm);
  }, []);

  const getCurrentMonthStr = useCallback(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const getAgingMonths = useCallback((item) => {
    if (!item.month) return 1;
    const monthsDiff = monthsBetween(item.month, getCurrentMonthStr());
    if (monthsDiff < 0) return 0;
    return monthsDiff + 1;
  }, [monthsBetween, getCurrentMonthStr]);

  const getStatusBadge = (item) => {
    const balance = parseFloat(item.balance || 0);

    if (balance <= 0) {
      return <span className="badge badge-paid"><CheckCircle size={14} /> Paid</span>;
    }

    if (!item.month) {
      return <span className="badge badge-unpaid"><Clock size={14} /> Unpaid</span>;
    }

    const monthsDiff = monthsBetween(item.month, getCurrentMonthStr());

    if (monthsDiff < 0) {
      return <span className="badge badge-unpaid"><Clock size={14} /> Unpaid</span>;
    }

    const agingCount = monthsDiff + 1;

    if (agingCount >= 4) {
      return <span className="badge badge-overdue"><AlertCircle size={14} /> Overdue</span>;
    }

    return <span className="badge badge-aging"><AlertTriangle size={14} /> Aging ({agingCount}m)</span>;
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(amount || 0);
  };

  const filteredInstallments = useMemo(() => {
    const search = debouncedSearch.toLowerCase().trim();
    if (!search) return installments;

    return installments.filter(item => {
      const customer = item.customer || item.account?.customer || {};
      const customerName = (customer.name || item.customer_name || '').toLowerCase();
      const customerCnic = (customer.cnic || item.cnic || '').toLowerCase();
      const caseNo = (item.account?.case_no || item.case_no || '').toLowerCase();
      return customerName.includes(search) || customerCnic.includes(search) || caseNo.includes(search);
    });
  }, [installments, debouncedSearch]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = useMemo(
    () => filteredInstallments.slice(indexOfFirstItem, indexOfLastItem),
    [filteredInstallments, indexOfFirstItem, indexOfLastItem]
  );
  const totalPages = Math.ceil(filteredInstallments.length / itemsPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const totals = useMemo(() => {
    let totalDue = 0, totalPaid = 0, totalBalance = 0;
    filteredInstallments.forEach(item => {
      totalDue += parseFloat(item.due_amount || 0);
      totalPaid += parseFloat(item.paid_amount || 0);
      totalBalance += parseFloat(item.balance || 0);
    });
    return { totalDue, totalPaid, totalBalance, count: filteredInstallments.length };
  }, [filteredInstallments]);

  const handlePayInstallment = async (installmentId) => {
    if (!window.confirm('Are you sure you want to mark this installment as paid?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/installments/pay`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ installment_id: installmentId, payment_date: new Date().toISOString().split('T')[0] })
      });
      const data = await response.json();
      if (data.success) {
        alert('✅ Installment marked as paid!');
        fetchMyAssignments();
      } else {
        alert('❌ Failed: ' + data.message);
      }
    } catch (error) {
      console.error(error);
      alert('Network error. Please try again.');
    }
  };

  const openEditModal = (item) => {
    const customer = item.customer || item.account?.customer || {};
    setEditPaymentData({
      paid_amount: '',
      month: item.month || '',
      installment_id: item.id,
      due_amount: item.due_amount || 0,
      current_paid: item.paid_amount || 0,
      balance: item.balance || 0,
      customer_name: customer.name || item.customer_name || 'N/A',
      case_no: item.account?.case_no || item.case_no || 'N/A'
    });
    setShowEditModal(true);
  };

  const handlePartialPaymentSubmit = async () => {
    if (!editPaymentData.paid_amount || parseFloat(editPaymentData.paid_amount) <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }
    const amount = parseFloat(editPaymentData.paid_amount);
    const maxPayable = parseFloat(editPaymentData.balance) || 0;
    if (amount > maxPayable) {
      alert(`Amount cannot exceed remaining balance of ${formatCurrency(maxPayable)}`);
      return;
    }

    setEditLoading(true);
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
          installment_id: editPaymentData.installment_id,
          paid_amount: amount,
          month: editPaymentData.month,
          payment_date: new Date().toISOString().split('T')[0]
        })
      });
      const data = await response.json();
      if (data.success) {
        alert(`✅ Payment of ${formatCurrency(amount)} recorded successfully!`);
        setShowEditModal(false);
        fetchMyAssignments();
      } else {
        alert('❌ Failed: ' + data.message);
      }
    } catch (error) {
      console.error(error);
      alert('Network error. Please try again.');
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="installments-page">
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-container edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-left">
                <Edit2 size={24} className="modal-header-icon" />
                <div>
                  <h2 className="modal-title">Edit Payment</h2>
                  <p className="modal-subtitle">Case: {editPaymentData.case_no}</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setShowEditModal(false)}>
                <X size={24} />
              </button>
            </div>
            <div className="modal-body edit-modal-body">
              <div className="edit-summary">
                <div className="edit-summary-item">
                  <span className="label">Customer</span>
                  <span className="value" style={{fontWeight: '600', color: '#1a1a2e'}}>{editPaymentData.customer_name}</span>
                </div>
                <div className="edit-summary-item">
                  <span className="label">Monthly Installment</span>
                  <span className="value">{formatCurrency(editPaymentData.due_amount)}</span>
                </div>
                <div className="edit-summary-item">
                  <span className="label">Remaining Balance</span>
                  <span className="value" style={{color: '#ef4444', fontWeight: 'bold'}}>{formatCurrency(editPaymentData.balance)}</span>
                </div>
              </div>
              <div className="edit-form">
                <div className="form-group">
                  <label>Payment Amount (PKR) *</label>
                  <input
                    type="number"
                    value={editPaymentData.paid_amount}
                    onChange={(e) => setEditPaymentData({ ...editPaymentData, paid_amount: e.target.value })}
                    placeholder="Enter amount to pay"
                    className="form-input"
                    min="0"
                    max={editPaymentData.balance}
                    autoFocus
                  />
                  <small className="form-hint">Max payable: {formatCurrency(editPaymentData.balance)}</small>
                </div>
                <div className="form-group">
                  <label>Payment Date</label>
                  <input type="date" value={paymentDate} className="form-input" disabled />
                </div>
              </div>
              <div className="edit-modal-footer">
                <button className="btn-cancel" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button className="btn-save-payment" onClick={handlePartialPaymentSubmit} disabled={editLoading}>
                  {editLoading ? (<><RefreshCw size={16} className="spinning" /> Processing...</>) : (<><Save size={16} /> Record Payment</>)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="page-header">
        <div className="header-title-group">
          <h2 className="page-title">Selected Recovery</h2>
          <span className="live-badge">
            <UserCheck size={12} /> This Month
          </span>
        </div>
        {userBranch && (
          <div className="branch-badge">
            <Building size={14} />
            <span>Branch {userBranch}</span>
          </div>
        )}
      </div>

      <div className="stats-grid-4">
        <div className="stat-card-4">
          <div className="stat-card-4-icon total">
            <UserCheck size={22} />
          </div>
          <div className="stat-card-4-info">
            <span className="stat-card-4-label">Assigned Accounts</span>
            <span className="stat-card-4-value">{totals.count}</span>
          </div>
        </div>
        <div className="stat-card-4">
          <div className="stat-card-4-icon due">
            <AlertCircle size={22} />
          </div>
          <div className="stat-card-4-info">
            <span className="stat-card-4-label">Total Balance</span>
            <span className="stat-card-4-value">{formatCurrency(totals.totalBalance)}</span>
          </div>
        </div>
        <div className="stat-card-4">
          <div className="stat-card-4-icon paid">
            <CheckCircle size={22} />
          </div>
          <div className="stat-card-4-info">
            <span className="stat-card-4-label">Total Paid</span>
            <span className="stat-card-4-value">{formatCurrency(totals.totalPaid)}</span>
          </div>
        </div>
      </div>

      <div className="filters-section">
        <div className="filter-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by name, CNIC, case no..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="search-input"
          />
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading assigned recovery...</p>
          </div>
        ) : filteredInstallments.length === 0 ? (
          <div className="empty-state">
            <UserCheck size={48} />
            <h3>No accounts assigned to you yet</h3>
            <p>Jab admin/manager tumhe koi recovery assign karega, wo yahan dikhega</p>
          </div>
        ) : (
          <>
            <table className="installments-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Customer</th>
                  <th>Case No</th>
                  <th>Due Date</th>
                  <th>Installment</th>
                  <th>Balance</th>
                  <th>Status</th>
                  <th>Collected By</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((item, index) => {
                  const actualIndex = indexOfFirstItem + index + 1;
                  const customer = item.customer || item.account?.customer || {};
                  const customerName = customer.name || item.customer_name || 'N/A';
                  const customerCnic = customer.cnic || item.cnic || '';
                  const caseNo = item.account?.case_no || item.case_no || 'N/A';
                  const assignmentInfo = item.assignment_info || null;

                  return (
                    <tr key={item.id} className="installment-row">
                      <td className="text-center">{actualIndex}</td>
                      <td>
                        <div className="customer-info">
                          <strong style={{color: '#1a1a2e'}}>{customerName}</strong>
                          {customerCnic && <span className="customer-cnic">{customerCnic}</span>}
                        </div>
                      </td>
                      <td><span className="case-no">{caseNo}</span></td>
                      <td>
                        <span className="month-text" style={{fontWeight: '500', color: '#7c3aed'}}>
                          {item.due_date ? formatDate(item.due_date) : (item.month ? new Date(item.month + '-01').toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) : '-')}
                        </span>
                      </td>
                      <td className="text-right">{formatCurrency(item.due_amount)}</td>
                      <td className="text-right" style={{color: item.balance > 0 ? '#ef4444' : '#10b981'}}>
                        {formatCurrency(item.balance)}
                      </td>
                      <td>{getStatusBadge(item)}</td>
                      <td>
                        {assignmentInfo ? (
                          <div style={{ fontSize: '12px' }}>
                            <div style={{ fontWeight: 600, color: '#166534', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <UserCheck size={12} /> {assignmentInfo.assigned_to_name}
                            </div>
                            <div style={{ color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                              <Lock size={10} /> till {assignmentInfo.unlock_date}
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#9ca3af' }}>N/A</span>
                        )}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button className="btn-edit" onClick={() => openEditModal(item)} title="Edit Payment">
                            <Edit2 size={14} />
                          </button>
                          {item.balance > 0 ? (
                            <button className="btn-pay" onClick={() => handlePayInstallment(item.id)} title="Pay Full">
                              <CheckCircle size={14} /> Pay
                            </button>
                          ) : (
                            <span className="paid-text">✓ Paid</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="pagination-container">
                <div className="pagination-info">
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredInstallments.length)} of {filteredInstallments.length} entries
                </div>
                <div className="pagination-buttons">
                  <button className="pagination-btn" onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}>
                    <ChevronLeft size={16} /> Previous
                  </button>
                  {[...Array(totalPages).keys()].map(number => (
                    <button
                      key={number + 1}
                      className={`pagination-btn ${currentPage === number + 1 ? 'active' : ''}`}
                      onClick={() => paginate(number + 1)}
                    >
                      {number + 1}
                    </button>
                  ))}
                  <button className="pagination-btn" onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages}>
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SelectedRecovery;