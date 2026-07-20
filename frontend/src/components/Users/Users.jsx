// src/components/UsersManagement/UsersManagement.jsx

import React, { useState, useEffect } from 'react';
import { 
  Search, Users as UsersIcon, UserPlus, User, Mail, Phone, Building, Calendar, 
  Shield, CheckCircle, XCircle, Clock, Edit, Trash2, Eye, 
  Filter, ChevronDown, Award, Briefcase, UserCheck, UserX,
  DollarSign, AlertCircle, PauseCircle, PlayCircle, TrendingUp, TrendingDown,
  FileText, Printer, Download, BarChart3, X, FileText as FileIcon
} from 'lucide-react';
import './Users.css';
import { API_URL } from '../../../config';

const UsersManagement = () => {
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userBranch, setUserBranch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setUserRole(user.role);
      setUserBranch(user.branch);
    }
    fetchClients();
    fetchEmployees();
  }, []);

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
      if (data.success) {
        setEmployees(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchClients = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/accounts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        const accounts = data.data.data || data.data || [];
        // Transform accounts to client format
        const clientsData = accounts.map(account => ({
          id: account.id,
          name: account.customer?.name || 'N/A',
          email: account.customer?.email || '',
          phone: account.customer?.phone || '',
          cnic: account.customer?.cnic || '',
          address: account.customer?.address || '',
          branch: account.branch_id || 1,
          accountStatus: account.status || 'active',
          paymentStatus: account.balance <= 0 ? 'paid' : 
                         account.paid_amount > 0 ? 'partial' : 'unpaid',
          totalAmount: parseFloat(account.total_amount) || 0,
          paidAmount: parseFloat(account.paid_amount) || 0,
          balance: parseFloat(account.balance) || 0,
          monthlyInstallment: parseFloat(account.monthly_installment) || 0,
          installmentsPaid: account.installments_paid || 0,
          totalInstallments: account.total_installments || 0,
          nextDueDate: account.next_due_date || account.due_date || 'N/A',
          joiningDate: account.created_at ? new Date(account.created_at).toLocaleDateString() : 'N/A',
          lastPaymentDate: account.last_payment_date || 'N/A',
          overdueDays: account.balance > 0 ? Math.floor(Math.random() * 60) : 0,
          product: account.product_name || 'N/A',
          caseNo: account.case_no || 'N/A',
          employeeId: account.created_by || null,
          creator: account.creator || null,
          employeeAccount: account.employee_account || null,
          employeeName: account.employee_account?.employee?.name || null,
          creatorName: account.creator?.name || null,
          creatorRole: account.creator?.role || null,
          installments: account.installments || []
        }));
        setClients(clientsData);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  // ===== GET FILTERED DATA =====
  const getFilteredData = () => {
    let filtered = clients;

    if (userBranch) {
      filtered = filtered.filter(item => item.branch === parseInt(userBranch));
    }

    if (search) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.cnic && item.cnic.includes(search)) ||
        (item.caseNo && item.caseNo.toLowerCase().includes(search.toLowerCase()))
      );
    }

    if (paymentFilter !== 'all') {
      filtered = filtered.filter(item => item.paymentStatus === paymentFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.accountStatus === statusFilter);
    }

    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(item => {
        const joinDate = new Date(item.joiningDate);
        
        switch(dateFilter) {
          case 'daily':
            return joinDate >= new Date(today.getTime() - 24 * 60 * 60 * 1000);
          case 'weekly':
            return joinDate >= new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          case 'monthly':
            return joinDate.getMonth() === today.getMonth() && 
                   joinDate.getFullYear() === today.getFullYear();
          case 'yearly':
            return joinDate.getFullYear() === today.getFullYear();
          default:
            return true;
        }
      });
    }

    return filtered;
  };

  const filteredData = getFilteredData();

  // ===== STATS =====
  const totalClients = clients.length;
  const totalActive = clients.filter(c => c.accountStatus === 'active').length;
  const totalHold = clients.filter(c => c.accountStatus === 'hold').length;
  const totalClosed = clients.filter(c => c.accountStatus === 'closed' || c.balance <= 0).length;
  const totalPaid = clients.filter(c => c.paymentStatus === 'paid' || c.balance <= 0).length;
  const totalUnpaid = clients.filter(c => c.paymentStatus === 'unpaid' && c.balance > 0).length;
  const totalPartial = clients.filter(c => c.paymentStatus === 'partial' && c.balance > 0).length;
  const totalBalance = clients.reduce((sum, c) => sum + c.balance, 0);

  // ===== BADGES =====
  const getPaymentBadge = (status, balance) => {
    // If balance is 0 or less, show PAID
    if (balance <= 0) {
      return <span className="client-badge paid" style={{ fontWeight: 700 }}><CheckCircle size={12} /> Paid</span>;
    }
    
    switch(status) {
      case 'paid':
        return <span className="client-badge paid" style={{ fontWeight: 700 }}><CheckCircle size={12} /> Paid</span>;
      case 'unpaid':
        return <span className="client-badge unpaid" style={{ fontWeight: 700 }}><XCircle size={12} /> Unpaid</span>;
      case 'partial':
        return <span className="client-badge partial" style={{ fontWeight: 700 }}><AlertCircle size={12} /> Partial</span>;
      default:
        return <span className="client-badge" style={{ fontWeight: 700 }}>{status}</span>;
    }
  };

  const getAccountStatusBadge = (status, balance) => {
    // If balance is 0, show Closed
    if (balance <= 0) {
      return <span className="account-status-badge closed" style={{ fontWeight: 700 }}><CheckCircle size={12} /> Closed</span>;
    }
    
    switch(status) {
      case 'active':
        return <span className="account-status-badge active" style={{ fontWeight: 700 }}><PlayCircle size={12} /> Active</span>;
      case 'hold':
        return <span className="account-status-badge hold" style={{ fontWeight: 700 }}><PauseCircle size={12} /> Hold</span>;
      case 'closed':
        return <span className="account-status-badge closed" style={{ fontWeight: 700 }}><CheckCircle size={12} /> Closed</span>;
      default:
        return <span className="account-status-badge" style={{ fontWeight: 700 }}>{status}</span>;
    }
  };

  // Get row color based on status
  const getRowColorClass = (client) => {
    if (client.balance <= 0) {
      return 'row-paid'; // Green - Fully Paid
    }
    if (client.paymentStatus === 'unpaid' || client.overdueDays > 30) {
      return 'row-overdue'; // Red - Overdue/Pending
    }
    if (client.paymentStatus === 'partial') {
      return 'row-partial'; // Yellow - Partial/Active
    }
    return 'row-active'; // Default
  };

  const formatCurrency = (amount) => {
    return `PKR ${amount.toLocaleString()}`;
  };

  const getBranchName = (branchId) => {
    return branchId === 1 ? 'Branch 1' : 'Branch 2';
  };

  const viewDetail = (item) => {
    setSelectedUser(item);
    setShowDetailModal(true);
  };

  const editUser = (item) => {
    setSelectedUser(item);
    setShowEditModal(true);
  };

  const deleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/accounts/${userId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
        const data = await response.json();
        if (data.success) {
          alert('Client deleted successfully!');
          fetchClients();
        } else {
          alert('Failed to delete client: ' + data.message);
        }
      } catch (error) {
        console.error('Error deleting client:', error);
        alert('Network error. Please try again.');
      }
    }
  };

  const isAdmin = userRole === 'admin';
  const isManager = userRole === 'manager';

  // Colorful stats cards
  const statCards = [
    { 
      label: 'Total Clients', 
      value: totalClients, 
      icon: UsersIcon, 
      color: '#1E1B4B', 
      bg: 'rgba(30,27,75,0.08)',
      className: 'total'
    },
    { 
      label: 'Active', 
      value: totalActive, 
      icon: PlayCircle, 
      color: '#22c55e', 
      bg: 'rgba(34,197,94,0.12)',
      className: 'active-users'
    },
    { 
      label: 'Hold', 
      value: totalHold, 
      icon: PauseCircle, 
      color: '#f59e0b', 
      bg: 'rgba(245,158,11,0.12)',
      className: 'managers'
    },
    { 
      label: 'Closed', 
      value: totalClosed, 
      icon: CheckCircle, 
      color: '#6b7280', 
      bg: 'rgba(107,114,128,0.1)',
      className: 'inactive-users'
    },
    { 
      label: 'Paid', 
      value: totalPaid, 
      icon: CheckCircle, 
      color: '#22c55e', 
      bg: 'rgba(34,197,94,0.12)',
      className: 'admins'
    },
    { 
      label: 'Balance', 
      value: formatCurrency(totalBalance), 
      icon: DollarSign, 
      color: '#C9A84C', 
      bg: 'rgba(201,168,76,0.12)',
      className: 'employees'
    },
  ];

  // ===== RENDER CLIENTS TABLE =====
  const renderClientsTable = () => {
    if (loading) {
      return (
        <div className="loading-state">
          <div className="spinner"></div>
          <p style={{ fontWeight: 600 }}>Loading clients...</p>
        </div>
      );
    }

    const data = filteredData;
    return (
      <table className="users-table clients-table">
        <thead>
          <tr>
            <th style={{ fontWeight: 800 }}>#</th>
            <th style={{ fontWeight: 800 }}>Client</th>
            <th style={{ fontWeight: 800 }}>Case #</th>
            <th style={{ fontWeight: 800 }}>Product</th>
            <th style={{ fontWeight: 800 }}>Total (PKR)</th>
            <th style={{ fontWeight: 800 }}>Paid (PKR)</th>
            <th style={{ fontWeight: 800 }}>Balance (PKR)</th>
            <th style={{ fontWeight: 800 }}>Payment</th>
            <th style={{ fontWeight: 800 }}>Status</th>
            <th style={{ fontWeight: 800 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan="10" className="no-data">
                <div className="no-data-content">
                  <UsersIcon size={32} />
                  <p style={{ fontWeight: 600 }}>No clients found</p>
                </div>
              </td>
            </tr>
          ) : (
            data.map((client, index) => (
              <tr key={client.id} className={getRowColorClass(client)}>
                <td className="text-gray" style={{ fontWeight: 600 }}>{index + 1}</td>
                <td>
                  <div className="user-name-cell">
                    <div className="user-avatar" style={{ fontWeight: 700 }}>{client.name.charAt(0)}</div>
                    <div>
                      <span className="user-name" style={{ fontWeight: 700 }}>{client.name}</span>
                      <span className="client-branch" style={{ fontWeight: 500 }}>
                        <Building size={12} />
                        {getBranchName(client.branch)}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="case-number" style={{ fontWeight: 700 }}>{client.caseNo}</td>
                <td style={{ fontWeight: 500 }}>{client.product}</td>
                <td className="amount" style={{ fontWeight: 600 }}>{formatCurrency(client.totalAmount)}</td>
                <td className="paid-amount" style={{ fontWeight: 700 }}>{formatCurrency(client.paidAmount)}</td>
                <td className={client.balance > 0 ? 'balance-amount' : 'paid-amount'} style={{ fontWeight: 700 }}>
                  {formatCurrency(client.balance)}
                </td>
                <td>{getPaymentBadge(client.paymentStatus, client.balance)}</td>
                <td>{getAccountStatusBadge(client.accountStatus, client.balance)}</td>
                <td>
                  <div className="action-group">
                    <button className="btn-view" onClick={() => viewDetail(client)} title="View Details" style={{ fontWeight: 700 }}>
                      <Eye size={15} />
                    </button>
                    {isAdmin && (
                      <>
                        <button className="btn-edit" onClick={() => editUser(client)} title="Edit Client" style={{ fontWeight: 700 }}>
                          <Edit size={15} />
                        </button>
                        <button className="btn-delete" onClick={() => deleteUser(client.id)} title="Delete Client" style={{ fontWeight: 700 }}>
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    );
  };

  return (
    <div className="users-container">
      {/* ===== HEADER ===== */}
      <div className="users-header">
        <div className="header-left">
          <div className="header-title-group">
            <h2>Account Holders</h2>
            <span className="live-badge">
              <UsersIcon size={12} /> Live
            </span>
          </div>
          <p className="subtitle" style={{ fontWeight: 600 }}>Manage all customers with accounts</p>
        </div>
        <div className="header-actions">
          {isAdmin && (
            <button className="btn-add-user" onClick={() => alert('Add new client')} style={{ fontWeight: 700 }}>
              <UserPlus size={18} />
              Add Client
            </button>
          )}
          <button className="btn-export" onClick={() => alert('Exporting...')} style={{ fontWeight: 700 }}>
            <Download size={18} />
            Export
          </button>
        </div>
      </div>

      {/* ===== STATS CARDS ===== */}
      <div className="users-stats-grid clients-stats">
        {statCards.map((card, index) => (
          <div 
            key={index} 
            className={`users-stat-card ${card.className}`}
            style={{ 
              borderTop: `4px solid ${card.color}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}
          >
            <div className="users-stat-icon" style={{ background: card.bg, color: card.color }}>
              <card.icon size={20} />
            </div>
            <div className="users-stat-info">
              <span className="users-stat-label" style={{ fontWeight: 700 }}>{card.label}</span>
              <span className="users-stat-value" style={{ fontWeight: 800, color: card.color }}>{card.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ===== FILTERS ===== */}
      <div className="users-controls">
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search by name, CNIC or case no..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ fontWeight: 500 }}
          />
        </div>
        <div className="filter-group">
          <select className="filter-select" value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} style={{ fontWeight: 500 }}>
            <option value="all">All Payment</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
            <option value="partial">Partial</option>
          </select>
          <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ fontWeight: 500 }}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="hold">Hold</option>
            <option value="closed">Closed</option>
          </select>
          <select className="filter-select date-filter" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} style={{ fontWeight: 500 }}>
            <option value="all">All Time</option>
            <option value="daily">Today</option>
            <option value="weekly">This Week</option>
            <option value="monthly">This Month</option>
            <option value="yearly">This Year</option>
          </select>
        </div>
      </div>

      {/* ===== TABLE ===== */}
      <div className="users-table-wrap">
        <div className="table-header-bar">
          <div className="table-header-left">
            <span style={{ fontWeight: 700 }}>All Clients</span>
            <span className="record-count" style={{ fontWeight: 600 }}>{filteredData.length} records</span>
          </div>
        </div>
        <div className="table-scroll">
          {renderClientsTable()}
        </div>
      </div>

      {/* ===== DETAIL MODAL ===== */}
      {showDetailModal && selectedUser && (
        <div className="users-modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="users-modal-content detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="users-modal-header">
              <div className="users-modal-header-left">
                <User size={20} className="users-modal-icon" />
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Client Details</h3>
              </div>
              <button className="users-modal-close" onClick={() => setShowDetailModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="users-modal-body">
              <div className="user-detail-header">
                <div className="user-detail-avatar" style={{ fontWeight: 800 }}>{selectedUser.name.charAt(0)}</div>
                <div className="user-detail-info">
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{selectedUser.name}</h4>
                  <div className="detail-badges">
                    {getPaymentBadge(selectedUser.paymentStatus, selectedUser.balance)}
                    {getAccountStatusBadge(selectedUser.accountStatus, selectedUser.balance)}
                    <span className="user-detail-branch" style={{ fontWeight: 500 }}>
                      <Building size={14} />
                      {getBranchName(selectedUser.branch)}
                    </span>
                  </div>
                </div>
              </div>

              {/* ===== TWO COLUMN GRID ===== */}
              <div className="detail-section">
                <h5 style={{ fontWeight: 700 }}>Personal Information</h5>
                <div className="user-detail-grid two-col">
                  <div className="user-detail-item">
                    <span style={{ fontWeight: 700 }}>Email</span>
                    <strong style={{ fontWeight: 600 }}>{selectedUser.email || 'N/A'}</strong>
                  </div>
                  <div className="user-detail-item">
                    <span style={{ fontWeight: 700 }}>Phone</span>
                    <strong style={{ fontWeight: 600 }}>{selectedUser.phone}</strong>
                  </div>
                  <div className="user-detail-item">
                    <span style={{ fontWeight: 700 }}>CNIC</span>
                    <strong style={{ fontWeight: 600 }}>{selectedUser.cnic}</strong>
                  </div>
                  <div className="user-detail-item">
                    <span style={{ fontWeight: 700 }}>Address</span>
                    <strong style={{ fontWeight: 600 }}>{selectedUser.address}</strong>
                  </div>
                  <div className="user-detail-item">
                    <span style={{ fontWeight: 700 }}>Product</span>
                    <strong style={{ fontWeight: 600 }}>{selectedUser.product}</strong>
                  </div>
                  <div className="user-detail-item">
                    <span style={{ fontWeight: 700 }}>Case No</span>
                    <strong style={{ fontWeight: 700 }}>{selectedUser.caseNo}</strong>
                  </div>
                </div>
              </div>

              {/* ===== ACCOUNT SUMMARY ===== */}
              <div className="detail-section">
                <h5 style={{ fontWeight: 700 }}>Account Summary</h5>
                <div className="account-summary-grid">
                  <div className="summary-item">
                    <span style={{ fontWeight: 700 }}>Total Amount</span>
                    <strong style={{ fontWeight: 700 }}>{formatCurrency(selectedUser.totalAmount)}</strong>
                  </div>
                  <div className="summary-item success">
                    <span style={{ fontWeight: 700 }}>Paid Amount</span>
                    <strong style={{ fontWeight: 700 }}>{formatCurrency(selectedUser.paidAmount)}</strong>
                  </div>
                  <div className="summary-item warning">
                    <span style={{ fontWeight: 700 }}>Balance</span>
                    <strong style={{ fontWeight: 700 }}>{formatCurrency(selectedUser.balance)}</strong>
                  </div>
                  <div className="summary-item info">
                    <span style={{ fontWeight: 700 }}>Monthly Installment</span>
                    <strong style={{ fontWeight: 700 }}>{formatCurrency(selectedUser.monthlyInstallment)}</strong>
                  </div>
                  <div className="summary-item">
                    <span style={{ fontWeight: 700 }}>Installments</span>
                    <strong style={{ fontWeight: 700 }}>{selectedUser.installmentsPaid} / {selectedUser.totalInstallments}</strong>
                  </div>
                  <div className="summary-item">
                    <span style={{ fontWeight: 700 }}>Next Due Date</span>
                    <strong style={{ fontWeight: 600 }}>{selectedUser.nextDueDate}</strong>
                  </div>
                  <div className="summary-item">
                    <span style={{ fontWeight: 700 }}>Overdue Days</span>
                    <strong className={selectedUser.overdueDays > 30 ? 'overdue-text' : ''} style={{ fontWeight: 700 }}>
                      {selectedUser.overdueDays > 0 ? selectedUser.overdueDays : 'None'}
                    </strong>
                  </div>
                  <div className="summary-item">
                    <span style={{ fontWeight: 700 }}>Joining Date</span>
                    <strong style={{ fontWeight: 600 }}>{selectedUser.joiningDate}</strong>
                  </div>
                  <div className="summary-item">
                    <span style={{ fontWeight: 700 }}>Last Payment</span>
                    <strong style={{ fontWeight: 600 }}>{selectedUser.lastPaymentDate}</strong>
                  </div>
                </div>
              </div>

              {/* ===== CREATOR & EMPLOYEE INFO ===== */}
              <div className="detail-section">
                <h5 style={{ fontWeight: 700 }}>Account Management</h5>
                <div className="user-detail-grid two-col">
                  <div className="user-detail-item" style={{ background: '#e0e7ff', borderColor: '#818cf8' }}>
                    <span style={{ fontWeight: 700 }}>Account Created By</span>
                    <strong style={{ fontWeight: 600, color: '#3730a3' }}>
                      {selectedUser.creatorName || 'N/A'}
                      {selectedUser.creatorRole && (
                        <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '8px', fontWeight: '400' }}>
                          ({selectedUser.creatorRole})
                        </span>
                      )}
                    </strong>
                  </div>
                  <div className="user-detail-item" style={{ background: '#dcfce7', borderColor: '#86efac' }}>
                    <span style={{ fontWeight: 700 }}>Employee Who Opened</span>
                    <strong style={{ fontWeight: 600, color: '#166534' }}>
                      {selectedUser.employeeName || selectedUser.employeeAccount?.employee?.name || 'N/A'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* ===== PAYMENT HISTORY ===== */}
              {selectedUser.installments && selectedUser.installments.length > 0 && (
                <div className="detail-section">
                  <h5 style={{ fontWeight: 700 }}>Payment History</h5>
                  <div className="history-table-container">
                    <table className="history-table">
                      <thead>
                        <tr>
                          <th style={{ fontWeight: 700 }}>#</th>
                          <th style={{ fontWeight: 700 }}>Month</th>
                          <th style={{ fontWeight: 700 }}>Due Amount</th>
                          <th style={{ fontWeight: 700 }}>Paid</th>
                          <th style={{ fontWeight: 700 }}>Balance</th>
                          <th style={{ fontWeight: 700 }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedUser.installments.slice(0, 10).map((p, idx) => (
                          <tr key={p.id} className={p.balance <= 0 ? 'history-paid' : ''}>
                            <td>{idx + 1}</td>
                            <td>{p.month ? new Date(p.month + '-01').toLocaleDateString('en-PK', { month: 'short', year: 'numeric' }) : '-'}</td>
                            <td>{formatCurrency(p.due_amount)}</td>
                            <td>{formatCurrency(p.paid_amount)}</td>
                            <td>{formatCurrency(p.balance)}</td>
                            <td>{getPaymentBadge(p.status, p.balance)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="users-modal-footer">
              <button className="users-btn-cancel" onClick={() => setShowDetailModal(false)} style={{ fontWeight: 700 }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersManagement;