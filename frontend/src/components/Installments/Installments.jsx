// src/components/Installments/Installments.jsx

import React, { useState, useEffect } from 'react';
import { 
  Calendar, DollarSign, User, CreditCard, Search, 
  Filter, Download, Eye, Clock, CheckCircle, 
  AlertCircle, Building, Phone, MapPin, X,
  FileText, Users, Package, Briefcase, Home,
  Calendar as CalendarIcon, CreditCard as CreditCardIcon,
  TrendingUp, TrendingDown, PieChart, List,
  ChevronLeft, ChevronRight, Printer, Edit2,
  Save, Trash2, RefreshCw, AlertTriangle
} from 'lucide-react';
import './Installments.css';
import { API_URL } from '../../../config';

// ============================================
// ✅ VIEW MODAL - Extracted outside component
// ============================================
const ViewModal = ({ 
  selectedInstallment, 
  showModal, 
  setShowModal, 
  modalLoading, 
  paymentHistory, 
  formatDate, 
  formatCurrency, 
  getStatusBadge, 
  getAccountCardStatus, 
  getEmployeeAccount,
  handleEditPayment,
  handlePayInstallment
}) => {
  if (!showModal || !selectedInstallment) return null;

  const item = selectedInstallment;
  const account = item.account || {};
  const customer = account.customer || item.customer || {};
  const guarantors = item.guarantors || customer.guarantors || [];
  const paidCount = paymentHistory.filter(p => p.balance <= 0).length;
  const totalCount = paymentHistory.length;
  const totalPaid = paymentHistory.reduce((sum, p) => sum + parseFloat(p.paid_amount || 0), 0);
  const totalDue = paymentHistory.reduce((sum, p) => sum + parseFloat(p.due_amount || 0), 0);

  const accountOpeningDate = account.created_at || customer.created_at || item.created_at || null;

  const creator = account.creator || {};
  const employeeAccount = getEmployeeAccount(account);
  const employee = employeeAccount.employee || {};

  const creatorName = creator.name || 'N/A';
  const creatorRole = creator.role || '';
  const employeeName = employee.name || account.employee_name || 'N/A';

  return (
    <div className="modal-overlay" onClick={() => setShowModal(false)}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-left">
            <FileText size={24} className="modal-header-icon" />
            <div>
              <h2 className="modal-title">Account Details</h2>
              <p className="modal-subtitle">Case: {account.case_no || item.case_no || 'N/A'}</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={() => setShowModal(false)}>
            <X size={24} />
          </button>
        </div>

        {modalLoading ? (
          <div className="modal-loading">
            <div className="spinner"></div>
            <p>Loading details...</p>
          </div>
        ) : (
          <div className="modal-body">
            <div className="modal-section">
              <div className="section-header">
                <User size={20} />
                <h3>Customer Information</h3>
              </div>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Full Name</span>
                  <span className="info-value" style={{fontWeight: '600', color: '#1a1a2e'}}>
                    {customer.name || item.customer_name || account.customer?.name || 'N/A'}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">CNIC</span>
                  <span className="info-value">{customer.cnic || item.cnic || account.customer?.cnic || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Phone</span>
                  <span className="info-value">{customer.phone || item.phone || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Address</span>
                  <span className="info-value">{customer.address || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Work / Occupation</span>
                  <span className="info-value">{customer.work || customer.occupation || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Product / Purpose</span>
                  <span className="info-value">{customer.product_name || account.product_name || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Branch</span>
                  <span className="info-value">Branch {account.branch_id || customer.branch_id || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Account Status</span>
                  <span className="info-value">{getAccountCardStatus(paymentHistory, account)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Account Opening Date</span>
                  <span className="info-value" style={{fontWeight: '600', color: '#2563eb'}}>
                    {formatDate(accountOpeningDate)}
                  </span>
                </div>
                <div className="info-item" style={{background: '#e0e7ff', borderColor: '#818cf8'}}>
                  <span className="info-label">Account Created By</span>
                  <span className="info-value" style={{fontWeight: '600', color: '#3730a3'}}>
                    {creatorName}
                    {creatorRole && (
                      <span style={{fontSize: '11px', color: '#6b7280', marginLeft: '8px', fontWeight: '400'}}>
                        ({creatorRole})
                      </span>
                    )}
                  </span>
                </div>
                <div className="info-item" style={{background: '#dcfce7', borderColor: '#86efac'}}>
                  <span className="info-label">Employee Who Opened</span>
                  <span className="info-value" style={{fontWeight: '600', color: '#166534'}}>
                    {employeeName}
                  </span>
                </div>
              </div>
            </div>

            <div className="modal-section">
              <div className="section-header">
                <DollarSign size={20} />
                <h3>Account Summary</h3>
              </div>
              <div className="summary-cards">
                <div className="summary-card">
                  <span className="summary-label">Total Amount</span>
                  <span className="summary-value">{formatCurrency(account.total_amount || 0)}</span>
                </div>
                <div className="summary-card success">
                  <span className="summary-label">Total Paid</span>
                  <span className="summary-value">{formatCurrency(account.paid_amount || 0)}</span>
                </div>
                <div className="summary-card warning">
                  <span className="summary-label">Remaining Balance</span>
                  <span className="summary-value">{formatCurrency(account.balance || 0)}</span>
                </div>
                <div className="summary-card info">
                  <span className="summary-label">Monthly Installment</span>
                  <span className="summary-value">{formatCurrency(account.monthly_installment || 0)}</span>
                </div>
                <div className="summary-card">
                  <span className="summary-label">Total Installments</span>
                  <span className="summary-value">{account.total_installments || 0}</span>
                </div>
                <div className="summary-card success">
                  <span className="summary-label">Installments Paid</span>
                  <span className="summary-value">{account.installments_paid || 0}</span>
                </div>
              </div>
            </div>

            <div className="modal-section">
              <div className="section-header">
                <Clock size={20} />
                <h3>Payment History</h3>
                <span className="payment-stats">
                  {paidCount} / {totalCount} Paid
                </span>
              </div>
              {paymentHistory.length === 0 ? (
                <div className="empty-history">
                  <p>No payment history found</p>
                </div>
              ) : (
                <div className="history-table-container">
                  <table className="history-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Month</th>
                        <th>Due Date</th>
                        <th>Due Amount</th>
                        <th>Paid</th>
                        <th>Balance</th>
                        <th>Status</th>
                        <th>Payment Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentHistory.map((p, idx) => (
                        <tr key={p.id} className={p.balance <= 0 ? 'history-paid' : ''}>
                          <td>{idx + 1}</td>
                          <td>{p.month ? new Date(p.month + '-01').toLocaleDateString('en-PK', { month: 'short', year: 'numeric' }) : '-'}</td>
                          <td>{p.due_date ? formatDate(p.due_date) : '-'}</td>
                          <td>{formatCurrency(p.due_amount)}</td>
                          <td>{formatCurrency(p.paid_amount)}</td>
                          <td>{formatCurrency(p.balance)}</td>
                          <td>{getStatusBadge(p)}</td>
                          <td>{p.payment_date ? formatDate(p.payment_date) : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="3"><strong>Total</strong></td>
                        <td><strong>{formatCurrency(totalDue)}</strong></td>
                        <td><strong>{formatCurrency(totalPaid)}</strong></td>
                        <td><strong>{formatCurrency(totalDue - totalPaid)}</strong></td>
                        <td colSpan="2"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>

            <div className="modal-section">
              <div className="section-header">
                <Users size={20} />
                <h3>Guarantors</h3>
                <span className="guarantor-count">
                  {guarantors.length || 0} found
                </span>
              </div>
              {guarantors && guarantors.length > 0 ? (
                <div className="guarantors-grid">
                  {guarantors.map((g, idx) => (
                    <div key={idx} className="guarantor-card">
                      <div className="guarantor-name">{g.name || g.guarantor_name || 'N/A'}</div>
                      <div className="guarantor-detail">CNIC: {g.cnic || g.guarantor_cnic || 'N/A'}</div>
                      <div className="guarantor-detail">Phone: {g.phone || g.guarantor_phone || 'N/A'}</div>
                      <div className="guarantor-detail">Address: {g.address || g.guarantor_address || 'N/A'}</div>
                      {g.relationship && (
                        <div className="guarantor-detail">Relationship: {g.relationship}</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-data">No guarantors found</p>
              )}
            </div>

            <div className="modal-footer-actions">
              <button
                className="btn-edit-modal"
                onClick={() => {
                  setShowModal(false);
                  handleEditPayment(selectedInstallment);
                }}
              >
                <Edit2 size={18} />
                Edit Payment
              </button>
              <button className="btn-print" onClick={() => window.print()}>
                <Printer size={18} />
                Print
              </button>
              {selectedInstallment.balance > 0 && (
                <button
                  className="btn-pay-modal"
                  onClick={() => handlePayInstallment(selectedInstallment.id)}
                >
                  <CheckCircle size={18} />
                  Pay Full
                </button>
              )}
              <button className="btn-close-modal" onClick={() => setShowModal(false)}>
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// ✅ EDIT PAYMENT MODAL - Extracted outside component
// ============================================
const EditPaymentModal = ({
  showEditModal,
  setShowEditModal,
  editPaymentData,
  setEditPaymentData,
  availableMonths,
  paymentDate,
  editLoading,
  handlePartialPaymentSubmit,
  formatCurrency
}) => {
  if (!showEditModal) return null;

  const remainingBalance = editPaymentData.balance || 0;

  return (
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
              <span className="value" style={{fontWeight: '600', color: '#1a1a2e'}}>
                {editPaymentData.customer_name}
              </span>
            </div>
            <div className="edit-summary-item">
              <span className="label">Monthly Installment</span>
              <span className="value">{formatCurrency(editPaymentData.due_amount)}</span>
            </div>
            <div className="edit-summary-item">
              <span className="label">Already Paid</span>
              <span className="value" style={{color: '#10b981'}}>{formatCurrency(editPaymentData.current_paid)}</span>
            </div>
            <div className="edit-summary-item">
              <span className="label">Remaining Balance</span>
              <span className="value" style={{color: '#ef4444', fontWeight: 'bold'}}>{formatCurrency(remainingBalance)}</span>
            </div>
          </div>

          <div className="edit-form">
            <div className="form-group">
              <label>Select Month *</label>
              <select
                value={editPaymentData.month}
                onChange={(e) => setEditPaymentData({
                  ...editPaymentData,
                  month: e.target.value
                })}
                className="form-input"
                required
              >
                <option value="">Select Month...</option>
                {availableMonths.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
              <small className="form-hint">
                Showing actual installment months from account
              </small>
            </div>

            <div className="form-group">
              <label>Payment Amount (PKR) *</label>
              <input
                type="number"
                value={editPaymentData.paid_amount}
                onChange={(e) => setEditPaymentData({
                  ...editPaymentData,
                  paid_amount: e.target.value
                })}
                placeholder="Enter amount to pay"
                className="form-input"
                min="0"
                max={remainingBalance}
                autoFocus
              />
              <small className="form-hint">
                Max payable: {formatCurrency(remainingBalance)}
              </small>
            </div>

            <div className="form-group">
              <label>Payment Date</label>
              <input
                type="date"
                value={paymentDate}
                className="form-input"
                disabled
              />
              <small className="form-hint">
                Payment will be recorded with today's date
              </small>
            </div>
          </div>

          <div className="edit-modal-footer">
            <button
              className="btn-cancel"
              onClick={() => setShowEditModal(false)}
            >
              Cancel
            </button>
            <button
              className="btn-save-payment"
              onClick={handlePartialPaymentSubmit}
              disabled={editLoading}
            >
              {editLoading ? (
                <>
                  <RefreshCw size={16} className="spinning" />
                  Processing...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Record Payment
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// ✅ MAIN COMPONENT
// ============================================
const Installments = () => {
  const [installments, setInstallments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [userBranch, setUserBranch] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [totalData, setTotalData] = useState({
    total_installments: 0,
    total_due: 0,
    total_paid: 0,
    overdue_count: 0
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [selectedInstallment, setSelectedInstallment] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editPaymentData, setEditPaymentData] = useState({
    paid_amount: '',
    month: '',
    installment_id: null,
    due_amount: 0,
    current_paid: 0,
    balance: 0,
    customer_name: '',
    customer_cnic: '',
    case_no: '',
    account_id: null,
    total_installments: 0
  });
  const [editLoading, setEditLoading] = useState(false);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [paymentDate, setPaymentDate] = useState('');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setUserBranch(user.branch);
      setUserRole(user.role);
    }
    setPaymentDate(new Date().toISOString().split('T')[0]);
    fetchInstallments();
  }, []);

  useEffect(() => {
    fetchInstallments();
  }, [filterStatus]);

  // ✅ "2026-07" jaisi do month-strings ke darmiyan farq (months) nikalta hai
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

  // ✅ Installment ka due month abhi tak "aa chuka" hai ya nahi (future nahi hai)
  const isAlreadyDue = (item) => {
    if (!item.month) return true;
    return monthsBetween(item.month, getCurrentMonthStr()) >= 0;
  };

  // ✅ Kitne mahine se overdue hai (0 = abhi due hi nahi hui / future installment)
  const getOverdueMonths = (item) => {
    if (!item.month) return 1;
    const monthsDiff = monthsBetween(item.month, getCurrentMonthStr());
    if (monthsDiff < 0) return 0;
    return monthsDiff + 1;
  };

  const fetchInstallments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      const backendStatus = filterStatus === 'paid' ? 'paid' : 'all';

      let url = `${API_URL}/installments?status=${backendStatus}`;

      if (userBranch) {
        url += `&branch_id=${userBranch}`;
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

        const uniqueMap = new Map();
        const currentMonthStr = getCurrentMonthStr();

        installmentsData.forEach(item => {
          const accountId = item.account_id || item.account?.id;
          if (!accountId) {
            if (!uniqueMap.has(item.id)) uniqueMap.set(item.id, item);
            return;
          }

          const existing = uniqueMap.get(accountId);
          if (!existing) {
            uniqueMap.set(accountId, item);
            return;
          }

          const itemMonth = item.month || '';
          const existingMonth = existing.month || '';

          const isItemCurrentMonth = itemMonth === currentMonthStr;
          const isExistingCurrentMonth = existingMonth === currentMonthStr;

          if (isItemCurrentMonth) {
            uniqueMap.set(accountId, item);
            return;
          }
          if (isExistingCurrentMonth) {
            return;
          }

          const itemUnpaid = parseFloat(item.balance || 0) > 0;
          const existingUnpaid = parseFloat(existing.balance || 0) > 0;

          if (itemUnpaid && existingUnpaid) {
            if (itemMonth < existingMonth) {
              uniqueMap.set(accountId, item);
            }
          } else if (itemUnpaid && !existingUnpaid) {
            uniqueMap.set(accountId, item);
          } else if (!itemUnpaid && !existingUnpaid) {
            if (itemMonth > existingMonth) {
              uniqueMap.set(accountId, item);
            }
          }
        });

        let uniqueInstallments = Array.from(uniqueMap.values());

        if (filterStatus === 'unpaid') {
          uniqueInstallments = uniqueInstallments.filter(item =>
            parseFloat(item.balance || 0) > 0 && getOverdueMonths(item) === 0
          );
        }

        if (filterStatus === 'overdue') {
          uniqueInstallments = uniqueInstallments.filter(item => {
            const overdueMonths = getOverdueMonths(item);
            return parseFloat(item.balance || 0) > 0 && overdueMonths >= 1 && overdueMonths < 3;
          });
        }

        if (filterStatus === 'aging') {
          uniqueInstallments = uniqueInstallments.filter(item =>
            parseFloat(item.balance || 0) > 0 && getOverdueMonths(item) >= 3
          );
        }

        setInstallments(uniqueInstallments);
        calculateTotals(uniqueInstallments);
      }
    } catch (error) {
      console.error('Error fetching installments:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Overdue count - balance > 0 aur month current month tak pohanch chuka hai
  const calculateTotals = (data) => {
    let totalDue = 0;
    let totalPaid = 0;
    let overdueCount = 0;

    data.forEach(item => {
      totalDue += parseFloat(item.due_amount || 0);
      totalPaid += parseFloat(item.paid_amount || 0);

      const balance = parseFloat(item.balance || 0);
      const isOverdue = balance > 0 && isAlreadyDue(item);

      if (isOverdue) {
        overdueCount++;
      }
    });

    setTotalData({
      total_installments: data.length,
      total_due: totalDue,
      total_paid: totalPaid,
      overdue_count: overdueCount
    });
  };

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

    const overdueCount = monthsDiff + 1;

    if (overdueCount >= 3) {
      return <span className="badge badge-aging"><AlertTriangle size={14} /> Aging</span>;
    }

    return (
      <span className="badge badge-overdue">
        <AlertCircle size={14} /> Overdue ({overdueCount}m)
      </span>
    );
  };

  const getAccountCardStatus = (payments, account) => {
    const list = Array.isArray(payments) ? payments : [];
    const totalInstallments = account?.total_installments || list.length;

    const fullyPaidCount = list.filter(p => parseFloat(p.balance || 0) <= 0).length;

    if (totalInstallments > 0 && fullyPaidCount >= totalInstallments) {
      return <span className="badge badge-paid"><CheckCircle size={14} /> Clear</span>;
    }

    const currentMonthStr = getCurrentMonthStr();

    const dueUnpaidMonths = list
      .filter(p =>
        parseFloat(p.balance || 0) > 0 &&
        p.month &&
        monthsBetween(p.month, currentMonthStr) >= 0
      )
      .map(p => p.month)
      .sort();

    if (dueUnpaidMonths.length === 0) {
      return <span className="badge badge-active"><CheckCircle size={14} /> Active</span>;
    }

    const oldestDueMonth = dueUnpaidMonths[0];
    const overdueCount = monthsBetween(oldestDueMonth, currentMonthStr) + 1;

    if (overdueCount >= 3) {
      return <span className="badge badge-aging"><AlertTriangle size={14} /> Aging</span>;
    }

    return (
      <span className="badge badge-overdue">
        <AlertCircle size={14} /> Overdue ({overdueCount}m)
      </span>
    );
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-PK', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const getEmployeeAccount = (account) => {
    if (!account) return {};
    return account.employeeAccount || account.employee_account || {};
  };

  const generateMonthsFromDueDate = (firstDueDate, totalInstallments) => {
    const months = [];
    if (!firstDueDate) return months;

    const startDate = new Date(firstDueDate);
    const startMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

    for (let i = 0; i < totalInstallments; i++) {
      const date = new Date(startMonth.getFullYear(), startMonth.getMonth() + i, 1);
      months.push({
        value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        label: date.toLocaleDateString('en-PK', { month: 'long', year: 'numeric' })
      });
    }
    return months;
  };

  const fetchRealInstallmentMonths = async (accountId) => {
    if (!accountId) return [];

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/installments/account/${accountId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        const sorted = [...data.data].sort((a, b) => a.month.localeCompare(b.month));
        return sorted.map(item => ({
          value: item.month,
          label: new Date(item.month + '-01').toLocaleDateString('en-PK', {
            month: 'long',
            year: 'numeric'
          })
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching real installments:', error);
      return [];
    }
  };

  // ✅ SEARCH
  const filteredInstallments = installments.filter(item => {
    const search = searchTerm.toLowerCase().trim();
    if (!search) return true;

    const customer = item.customer || item.account?.customer || {};
    const customerName = (customer.name || item.customer_name || '').toLowerCase();
    const customerCnic = (customer.cnic || item.cnic || '').toLowerCase();
    const customerPhone = (customer.phone || item.phone || '').toLowerCase();
    const customerAddress = (customer.address || '').toLowerCase();

    const caseNo = (item.account?.case_no || item.case_no || '').toLowerCase();
    const productName = (item.account?.product_name || '').toLowerCase();

    const creatorName = (item.account?.creator?.name || '').toLowerCase();
    const employeeName = (item.account?.employeeAccount?.employee?.name || '').toLowerCase();

    return customerName.includes(search) ||
           customerCnic.includes(search) ||
           customerPhone.includes(search) ||
           customerAddress.includes(search) ||
           caseNo.includes(search) ||
           productName.includes(search) ||
           creatorName.includes(search) ||
           employeeName.includes(search);
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredInstallments.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredInstallments.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleViewDetails = async (item) => {
    setModalLoading(true);
    setSelectedInstallment(item);
    setShowModal(true);

    try {
      const token = localStorage.getItem('token');
      const accountId = item.account_id || item.account?.id;

      if (!accountId) {
        setModalLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/installments/account-details/${accountId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        const accountData = data.data;
        setSelectedInstallment({
          ...item,
          account: accountData,
          customer: accountData.customer || item.customer,
          guarantors: accountData.customer?.guarantors || [],
          fullAccount: accountData
        });
        setPaymentHistory(accountData.installments || []);
      }
    } catch (error) {
      console.error('Error fetching account details:', error);
    }
    setModalLoading(false);
  };

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
        body: JSON.stringify({
          installment_id: installmentId,
          payment_date: new Date().toISOString().split('T')[0]
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('✅ Installment marked as paid!');
        fetchInstallments();
        if (showModal) {
          handleViewDetails(selectedInstallment);
        }
      } else {
        alert('❌ Failed to mark installment as paid: ' + data.message);
      }
    } catch (error) {
      console.error('Error paying installment:', error);
      alert('Network error. Please try again.');
    }
  };

  const handleEditPayment = async (installment) => {
    const customerName = installment.customer?.name ||
                        installment.customer_name ||
                        installment.account?.customer?.name ||
                        'N/A';

    const customerCnic = installment.customer?.cnic ||
                        installment.cnic ||
                        installment.account?.customer?.cnic ||
                        '';

    const caseNo = installment.account?.case_no ||
                  installment.case_no ||
                  'N/A';

    const accountId = installment.account_id || installment.account?.id;

    let realMonths = [];
    if (accountId) {
      realMonths = await fetchRealInstallmentMonths(accountId);
    }

    const firstDueDate = installment.due_date ||
                        installment.account?.installments?.[0]?.due_date ||
                        null;

    const totalInstallments = installment.account?.total_installments || 10;

    let months = realMonths.length > 0 ? realMonths : generateMonthsFromDueDate(firstDueDate, totalInstallments);

    const defaultMonth = installment.month || (months.length > 0 ? months[0].value : '');

    setEditPaymentData({
      paid_amount: '',
      month: defaultMonth,
      installment_id: installment.id,
      due_amount: installment.due_amount || 0,
      current_paid: installment.paid_amount || 0,
      balance: installment.balance || 0,
      customer_name: customerName,
      customer_cnic: customerCnic,
      case_no: caseNo,
      account_id: accountId,
      total_installments: totalInstallments
    });

    setAvailableMonths(months);
    setShowEditModal(true);
  };

  const handlePartialPaymentSubmit = async () => {
    if (!editPaymentData.paid_amount || parseFloat(editPaymentData.paid_amount) <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    if (!editPaymentData.month) {
      alert('Please select a month');
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
        fetchInstallments();
        if (showModal) {
          handleViewDetails(selectedInstallment);
        }
      } else {
        alert('❌ Failed to record payment: ' + data.message);
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      alert('Network error. Please try again.');
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="installments-page">
      {/* ✅ Modals rendered outside - no re-render flicker */}
      <ViewModal 
        selectedInstallment={selectedInstallment}
        showModal={showModal}
        setShowModal={setShowModal}
        modalLoading={modalLoading}
        paymentHistory={paymentHistory}
        formatDate={formatDate}
        formatCurrency={formatCurrency}
        getStatusBadge={getStatusBadge}
        getAccountCardStatus={getAccountCardStatus}
        getEmployeeAccount={getEmployeeAccount}
        handleEditPayment={handleEditPayment}
        handlePayInstallment={handlePayInstallment}
      />

      <EditPaymentModal
        showEditModal={showEditModal}
        setShowEditModal={setShowEditModal}
        editPaymentData={editPaymentData}
        setEditPaymentData={setEditPaymentData}
        availableMonths={availableMonths}
        paymentDate={paymentDate}
        editLoading={editLoading}
        handlePartialPaymentSubmit={handlePartialPaymentSubmit}
        formatCurrency={formatCurrency}
      />

      <div className="page-header">
        <div className="header-title-group">
          <h2 className="page-title">Recovery</h2>
          <span className="live-badge">
            <Clock size={12} /> Live
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
            <DollarSign size={22} />
          </div>
          <div className="stat-card-4-info">
            <span className="stat-card-4-label">Total Installments</span>
            <span className="stat-card-4-value">{totalData.total_installments}</span>
          </div>
        </div>
        <div className="stat-card-4">
          <div className="stat-card-4-icon due">
            <AlertCircle size={22} />
          </div>
          <div className="stat-card-4-info">
            <span className="stat-card-4-label">Total Mirror</span>
            <span className="stat-card-4-value">{formatCurrency(totalData.total_due - totalData.total_paid)}</span>
          </div>
        </div>
        <div className="stat-card-4">
          <div className="stat-card-4-icon paid">
            <CheckCircle size={22} />
          </div>
          <div className="stat-card-4-info">
            <span className="stat-card-4-label">Total Paid</span>
            <span className="stat-card-4-value">{formatCurrency(totalData.total_paid)}</span>
          </div>
        </div>
        <div className="stat-card-4">
          <div className="stat-card-4-icon overdue">
            <Clock size={22} />
          </div>
          <div className="stat-card-4-info">
            <span className="stat-card-4-label">Overdue</span>
            <span className="stat-card-4-value">{totalData.overdue_count}</span>
          </div>
        </div>
      </div>

      <div className="filters-section">
        <div className="filters-left">
          <div className="filter-group">
            <label>Status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">All</option>
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="aging">Aging</option>
            </select>
          </div>
        </div>

        <div className="filter-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by name, CNIC, phone, address, case no..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading installments...</p>
          </div>
        ) : filteredInstallments.length === 0 ? (
          <div className="empty-state">
            <AlertCircle size={48} />
            <h3>No installments found</h3>
            <p>Try adjusting your filters or search terms</p>
          </div>
        ) : (
          <>
            <table className="installments-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Customer</th>
                  <th>Case No</th>
                  <th>Account Opening</th>
                  <th>Due Date</th>
                  <th>Installments</th>
                  <th>Paid</th>
                  <th>Mirror</th>
                  <th>Balance</th>
                  <th>Status</th>
                  <th>Created By</th>
                  <th>Employee</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((item, index) => {
                  const actualIndex = indexOfFirstItem + index + 1;
                  const accountOpeningDate = item.account?.created_at ||
                                            item.created_at ||
                                            item.customer?.created_at ||
                                            null;

                  const customerName = item.customer?.name ||
                                      item.customer_name ||
                                      item.account?.customer?.name ||
                                      'N/A';

                  const customerCnic = item.customer?.cnic ||
                                      item.cnic ||
                                      item.account?.customer?.cnic ||
                                      '';

                  const caseNo = item.account?.case_no ||
                                item.case_no ||
                                'N/A';

                  const accountData = item.account || {};
                  const creator = accountData.creator || {};
                  const employeeAccount = getEmployeeAccount(accountData);
                  const employee = employeeAccount.employee || {};

                  const creatorName = creator.name || 'N/A';
                  const creatorRole = creator.role || '';
                  const employeeName = employee.name || accountData.employee_name || 'N/A';

                  // ✅ Account ka total balance calculate karo
                  // Agar account data available hai to us se lo, warna item ke account se
                  const accountTotalBalance = accountData.balance || item.balance || 0;

                  return (
                    <tr key={item.id} className="installment-row">
                      <td className="text-center">{actualIndex}</td>
                      <td>
                        <div className="customer-info">
                          <strong style={{color: '#1a1a2e'}}>
                            {customerName}
                          </strong>
                          {customerCnic && (
                            <span className="customer-cnic">{customerCnic}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="case-no">{caseNo}</span>
                      </td>
                      <td>
                        <span className="month-text" style={{fontWeight: '500', color: '#2563eb'}}>
                          {formatDate(accountOpeningDate)}
                        </span>
                      </td>
                      <td>
                        <span className="month-text" style={{fontWeight: '500', color: '#7c3aed'}}>
                          {item.due_date ? formatDate(item.due_date) : (item.month ? new Date(item.month + '-01').toLocaleDateString('en-PK', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          }) : '-')}
                        </span>
                      </td>
                      <td className="text-right">{formatCurrency(item.due_amount)}</td>
                      <td className="text-right" style={{color: '#10b981'}}>
                        {formatCurrency(item.paid_amount)}
                      </td>
                      <td className="text-right" style={{color: item.balance > 0 ? '#ef4444' : '#10b981'}}>
                        {formatCurrency(item.balance)}
                      </td>
                      {/* ✅ NEW BALANCE COLUMN - Account ka total remaining balance */}
                      <td className="text-right" style={{fontWeight: 'bold', color: '#dc2626', fontSize: '14px'}}>
                        {formatCurrency(accountTotalBalance)}
                      </td>
                      <td>{getStatusBadge(item)}</td>

                      <td>
                        <span style={{fontWeight: '600', color: '#3730a3', fontSize: '12px'}}>
                          {creatorName}
                          {creatorRole && (
                            <span style={{fontSize: '10px', color: '#6b7280', marginLeft: '4px'}}>
                              ({creatorRole})
                            </span>
                          )}
                        </span>
                      </td>

                      <td>
                        <span style={{fontWeight: '600', color: '#166534', fontSize: '12px'}}>
                          {employeeName}
                        </span>
                      </td>

                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-view"
                            onClick={() => handleViewDetails(item)}
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            className="btn-edit"
                            onClick={() => handleEditPayment(item)}
                            title="Edit Payment"
                          >
                            <Edit2 size={14} />
                          </button>
                          {item.balance > 0 && (
                            <button
                              className="btn-pay"
                              onClick={() => handlePayInstallment(item.id)}
                              title="Pay Full"
                            >
                              <CheckCircle size={14} />
                              Pay
                            </button>
                          )}
                          {item.balance <= 0 && (
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
                  <button
                    className="pagination-btn"
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft size={16} />
                    Previous
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

                  <button
                    className="pagination-btn"
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {filteredInstallments.length > 0 && (
        <div className="table-footer">
          <span>Showing {filteredInstallments.length} of {installments.length} installments</span>
        </div>
      )}
    </div>
  );
};

export default Installments;