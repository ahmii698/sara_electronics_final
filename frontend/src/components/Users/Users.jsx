// src/components/UsersManagement/UsersManagement.jsx

import React, { useState, useEffect } from 'react';
import { 
  Search, Users as UsersIcon, UserPlus, User, Building, Calendar, 
  CheckCircle, Clock, Edit, Trash2, Eye, 
  Award, Briefcase,
  DollarSign, AlertCircle, AlertTriangle, X
} from 'lucide-react';
import './Users.css';
import { API_URL } from '../../../config';

const UsersManagement = () => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
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
        const clientsData = accounts.map(account => ({
          id: account.id,
          name: account.customer?.name || 'N/A',
          phone: account.customer?.phone || '',
          cnic: account.customer?.cnic || '',
          address: account.customer?.address || '',
          branch: account.branch_id || 1,
          accountStatus: account.status || 'active',
          totalAmount: parseFloat(account.total_amount) || 0,
          paidAmount: parseFloat(account.paid_amount) || 0,
          balance: parseFloat(account.balance) || 0,
          monthlyInstallment: parseFloat(account.monthly_installment) || 0,
          installmentsPaid: account.installments_paid || 0,
          totalInstallments: account.total_installments || 0,
          nextDueDate: account.next_due_date || account.due_date || 'N/A',
          joiningDate: account.created_at ? new Date(account.created_at).toLocaleDateString() : 'N/A',
          lastPaymentDate: account.last_payment_date || 'N/A',
          product: account.product_name || 'N/A',
          caseNo: account.case_no || 'N/A',
          employeeId: account.created_by || null,
          creator: account.creator || null,
          employeeAccount: account.employee_account || null,
          employeeName: account.employee_account?.employee?.name || null,
          creatorName: account.creator?.name || null,
          creatorRole: account.creator?.role || null,
          // ✅ per-installment payment records — needed for months-based overdue calc
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

  // ============================================
  // ✅ SAME LOGIC AS Installments.jsx
  // ============================================

  // "2026-07" jaisi do month-strings ke darmiyan farq (months) nikalta hai
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

  // ✅ Client-level category — based on the OLDEST unpaid installment whose
  // month has already arrived (future months are ignored).
  // - fully paid off (all installments paid)     -> 'clear'
  // - no due-but-unpaid month yet                -> 'paid' (active/on-track)
  // - oldest due-unpaid installment is 1-3 months overdue -> 'overdue' (with count)
  // - oldest due-unpaid installment is 4+ months overdue  -> 'aging'
  const getClientCategoryInfo = (client) => {
    const list = Array.isArray(client.installments) ? client.installments : [];
    const totalInstallments = client.totalInstallments || list.length;
    const fullyPaidCount = list.filter(p => parseFloat(p.balance || 0) <= 0).length;

    // Fallback: agar installments list nahi mili to sirf balance se decide karo
    if (list.length === 0) {
      if (client.balance <= 0) return { category: 'clear', months: 0 };
      return { category: 'paid', months: 0 };
    }

    if (totalInstallments > 0 && fullyPaidCount >= totalInstallments) {
      return { category: 'clear', months: 0 };
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
      return { category: 'paid', months: 0 };
    }

    const oldestDueMonth = dueUnpaidMonths[0];
    const overdueCount = monthsBetween(oldestDueMonth, currentMonthStr) + 1;

    if (overdueCount >= 4) {
      return { category: 'aging', months: overdueCount };
    }

    return { category: 'overdue', months: overdueCount };
  };

  const getRowColorClass = (client) => {
    const { category } = getClientCategoryInfo(client);
    switch (category) {
      case 'clear': return 'row-clear';
      case 'paid': return 'row-paid';
      case 'overdue': return 'row-overdue';
      case 'aging': return 'row-aging';
      default: return '';
    }
  };

  const getCategoryBadge = (client) => {
    const { category, months } = getClientCategoryInfo(client);
    switch (category) {
      case 'aging':
        return <span className="client-badge aging" style={{ fontWeight: 700 }}><AlertTriangle size={12} /> Aging ({months}m)</span>;
      case 'overdue':
        return <span className="client-badge overdue" style={{ fontWeight: 700 }}><AlertCircle size={12} /> Overdue ({months}m)</span>;
      case 'paid':
        return <span className="client-badge paid" style={{ fontWeight: 700 }}><CheckCircle size={12} /> Active</span>;
      case 'clear':
        return <span className="client-badge clear" style={{ fontWeight: 700 }}><CheckCircle size={12} /> Clear Account</span>;
      default:
        return null;
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

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(item => getClientCategoryInfo(item).category === categoryFilter);
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

  // ===== STATS (based on the 4 categories) =====
  const totalClients = clients.length;
  const totalAging = clients.filter(c => getClientCategoryInfo(c).category === 'aging').length;
  const totalOverdue = clients.filter(c => getClientCategoryInfo(c).category === 'overdue').length;
  const totalPaid = clients.filter(c => getClientCategoryInfo(c).category === 'paid').length;
  const totalClear = clients.filter(c => getClientCategoryInfo(c).category === 'clear').length;
  const totalBalance = clients.reduce((sum, c) => sum + c.balance, 0);

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
      label: 'Clear Account', 
      value: totalClear, 
      icon: CheckCircle, 
      color: '#eab308', 
      bg: 'rgba(234,179,8,0.12)',
      className: 'clear'
    },
    { 
      label: 'Active / On-track', 
      value: totalPaid, 
      icon: CheckCircle, 
      color: '#22c55e', 
      bg: 'rgba(34,197,94,0.12)',
      className: 'paid'
    },
    { 
      label: 'Overdue', 
      value: totalOverdue, 
      icon: Clock, 
      color: '#3b82f6', 
      bg: 'rgba(59,130,246,0.12)',
      className: 'overdue'
    },
    { 
      label: 'Aging', 
      value: totalAging, 
      icon: AlertTriangle, 
      color: '#ef4444', 
      bg: 'rgba(239,68,68,0.12)',
      className: 'aging'
    },
    { 
      label: 'Total Balance', 
      value: formatCurrency(totalBalance), 
      icon: DollarSign, 
      color: '#C9A84C', 
      bg: 'rgba(201,168,76,0.12)',
      className: 'balance'
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
            <th style={{ fontWeight: 800 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan="8" className="no-data">
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
          <select className="filter-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={{ fontWeight: 500 }}>
            <option value="all">All</option>
            <option value="clear">Clear Account</option>
            <option value="paid">Active</option>
            <option value="overdue">Overdue</option>
            <option value="aging">Aging</option>
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
                    {getCategoryBadge(selectedUser)}
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