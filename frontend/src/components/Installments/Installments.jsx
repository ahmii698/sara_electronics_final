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

const Installments = () => {
  const [installments, setInstallments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('unpaid');
  const [searchTerm, setSearchTerm] = useState('');
  const [userBranch, setUserBranch] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [totalData, setTotalData] = useState({
    total_installments: 0,
    total_due: 0,
    total_paid: 0,
    overdue_count: 0
  });

  // ✅ NEW FILTERS
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [employees, setEmployees] = useState([]);
  const [dateFilter, setDateFilter] = useState('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Modal states
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
    account_opening_date: null,
    total_installments: 0
  });
  const [editLoading, setEditLoading] = useState(false);
  const [availableMonths, setAvailableMonths] = useState([]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setUserBranch(user.branch);
      setUserRole(user.role);
    }
    fetchEmployees();
    fetchInstallments();
  }, []);

  useEffect(() => {
    fetchInstallments();
  }, [filterStatus, employeeFilter, dateFilter]);

  // ✅ FETCH EMPLOYEES - FIXED
  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      const data = await response.json();
      console.log('Employees Response:', data);
      
      if (data.success) {
        // ✅ Check if data.data is an array
        if (Array.isArray(data.data)) {
          setEmployees(data.data);
        } else if (Array.isArray(data)) {
          setEmployees(data);
        } else {
          // ✅ Fallback: agar data.data object hai toh usko array mein convert karein
          const dataArray = data.data ? [data.data] : [];
          setEmployees(dataArray);
        }
      } else {
        setEmployees([]);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      setEmployees([]);
    }
  };

  const fetchInstallments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      let url = `${API_URL}/installments?status=${filterStatus}`;
      
      if (userBranch && userRole !== 'admin') {
        url += `&branch_id=${userBranch}`;
      }
      
      if (employeeFilter) {
        url += `&employee_id=${employeeFilter}`;
      }
      
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      if (dateFilter === 'daily') {
        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);
        url += `&date_from=${startOfDay.toISOString().split('T')[0]}`;
        url += `&date_to=${today.toISOString().split('T')[0]}`;
      } else if (dateFilter === 'weekly') {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - 7);
        url += `&date_from=${weekStart.toISOString().split('T')[0]}`;
        url += `&date_to=${today.toISOString().split('T')[0]}`;
      } else if (dateFilter === 'monthly') {
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        url += `&date_from=${monthStart.toISOString().split('T')[0]}`;
        url += `&date_to=${today.toISOString().split('T')[0]}`;
      } else if (dateFilter === 'yearly') {
        const yearStart = new Date(today.getFullYear(), 0, 1);
        url += `&date_from=${yearStart.toISOString().split('T')[0]}`;
        url += `&date_to=${today.toISOString().split('T')[0]}`;
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
        installmentsData.forEach(item => {
          const accountId = item.account_id || item.account?.id;
          if (accountId) {
            if (!uniqueMap.has(accountId)) {
              uniqueMap.set(accountId, item);
            } else {
              const existing = uniqueMap.get(accountId);
              if (new Date(item.created_at) > new Date(existing.created_at)) {
                uniqueMap.set(accountId, item);
              }
            }
          } else {
            if (!uniqueMap.has(item.id)) {
              uniqueMap.set(item.id, item);
            }
          }
        });
        
        const uniqueInstallments = Array.from(uniqueMap.values());
        setInstallments(uniqueInstallments);
        calculateTotals(uniqueInstallments);
      }
    } catch (error) {
      console.error('Error fetching installments:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = (data) => {
    let totalDue = 0;
    let totalPaid = 0;
    let overdueCount = 0;

    data.forEach(item => {
      totalDue += parseFloat(item.due_amount || 0);
      totalPaid += parseFloat(item.paid_amount || 0);
      if (item.status === 'overdue') overdueCount++;
    });

    setTotalData({
      total_installments: data.length,
      total_due: totalDue,
      total_paid: totalPaid,
      overdue_count: overdueCount
    });
  };

  const getStatusBadge = (status, balance, due_amount, paid_amount) => {
    if (balance <= 0) {
      return <span className="badge badge-paid"><CheckCircle size={14} /> Paid</span>;
    }
    
    if (paid_amount > 0 && balance > 0) {
      return <span className="badge badge-aging"><AlertTriangle size={14} /> Aging</span>;
    }
    
    if (status === 'overdue') {
      return <span className="badge badge-overdue"><AlertCircle size={14} /> Overdue</span>;
    }
    
    return <span className="badge badge-unpaid"><Clock size={14} /> Unpaid</span>;
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

  const generateInstallmentMonths = (accountOpeningDate, totalInstallments) => {
    const months = [];
    if (!accountOpeningDate) return months;
    
    const startDate = new Date(accountOpeningDate);
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

  const filteredInstallments = installments.filter(item => {
    const search = searchTerm.toLowerCase();
    const customerName = (item.customer?.name || item.customer_name || '').toLowerCase();
    const caseNo = (item.account?.case_no || item.case_no || '').toLowerCase();
    const customerCnic = (item.customer?.cnic || item.cnic || '').toLowerCase();
    
    return customerName.includes(search) || 
           caseNo.includes(search) || 
           customerCnic.includes(search);
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
        body: JSON.stringify({ installment_id: installmentId })
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

  const handleEditPayment = (installment) => {
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
    
    const accountOpeningDate = installment.account?.created_at || 
                              installment.created_at || 
                              installment.account?.customer?.created_at || 
                              null;
    
    const totalInstallments = installment.account?.total_installments || 10;
    
    const months = generateInstallmentMonths(accountOpeningDate, totalInstallments);
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
      account_id: installment.account_id || installment.account?.id,
      account_opening_date: accountOpeningDate,
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
          month: editPaymentData.month
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

  // ===== MODAL COMPONENT =====
  const ViewModal = () => {
    if (!selectedInstallment) return null;
    
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
              {/* Customer Information */}
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
                    <span className="info-value">{getStatusBadge(account.status, account.balance, account.total_amount, account.paid_amount)}</span>
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

              {/* Account Summary */}
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

              {/* Payment History */}
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
                            <td>{formatCurrency(p.due_amount)}</td>
                            <td>{formatCurrency(p.paid_amount)}</td>
                            <td>{formatCurrency(p.balance)}</td>
                            <td>{getStatusBadge(p.status, p.balance, p.due_amount, p.paid_amount)}</td>
                            <td>{p.payment_date ? formatDate(p.payment_date) : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan="2"><strong>Total</strong></td>
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

              {/* Guarantors */}
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

              {/* Action Buttons */}
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

  // ===== EDIT PAYMENT MODAL =====
  const EditPaymentModal = () => {
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
                  Showing months from account opening to loan completion
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
                  value={new Date().toISOString().split('T')[0]}
                  className="form-input"
                  disabled
                />
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

  return (
    <div className="installments-page">
      {showModal && <ViewModal />}
      {showEditModal && <EditPaymentModal />}

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

      {/* Stats Cards - 4 in one line */}
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
            <span className="stat-card-4-label">Total Due</span>
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

      {/* Filters */}
      <div className="filters-section">
        <div className="filters-left">
          {/* Status Filter */}
          <div className="filter-group">
            <label>Status:</label>
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="partial">Partial</option>
              <option value="all">All</option>
            </select>
          </div>

          {/* ✅ Employee Filter - All Employees */}
          <div className="filter-group">
            <label>Employee:</label>
            <select 
              value={employeeFilter} 
              onChange={(e) => setEmployeeFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">All Employees</option>
              {Array.isArray(employees) && employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>

          {/* ✅ Date Filter */}
          <div className="filter-group">
            <label>Date:</label>
            <select 
              value={dateFilter} 
              onChange={(e) => setDateFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Time</option>
              <option value="daily">Today</option>
              <option value="weekly">This Week</option>
              <option value="monthly">This Month</option>
              <option value="yearly">This Year</option>
            </select>
          </div>
        </div>

        <div className="filter-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by customer name, CNIC or case no..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Table */}
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
                  <th>Due Amount</th>
                  <th>Paid</th>
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
                      <td className="text-right">{formatCurrency(item.due_amount)}</td>
                      <td className="text-right" style={{color: '#10b981'}}>
                        {formatCurrency(item.paid_amount)}
                      </td>
                      <td className="text-right" style={{color: item.balance > 0 ? '#ef4444' : '#10b981'}}>
                        {formatCurrency(item.balance)}
                      </td>
                      <td>{getStatusBadge(item.status, item.balance, item.due_amount, item.paid_amount)}</td>
                      
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

            {/* Pagination */}
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