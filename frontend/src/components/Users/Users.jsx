// src/components/UsersManagement/UsersManagement.jsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Search, Users as UsersIcon, UserPlus, User, Building, Calendar, 
  CheckCircle, Clock, Edit, Trash2, Eye, 
  Award, Briefcase,
  DollarSign, AlertCircle, AlertTriangle, X, FileText
} from 'lucide-react';
import './Users.css';
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
// ✅ React.memo + loading="lazy" so images only load when in view
// ============================================
const DocImage = React.memo(({ label, src }) => (
  <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', background: '#fff' }}>
    <a href={src} target="_blank" rel="noopener noreferrer">
      <img 
        src={src} 
        alt={label} 
        loading="lazy"
        decoding="async"
        style={{ width: '100%', height: '120px', objectFit: 'cover', cursor: 'zoom-in' }} 
      />
    </a>
    <p style={{ fontSize: '12px', fontWeight: 600, textAlign: 'center', padding: '6px', margin: 0, color: '#374151' }}>
      {label}
    </p>
  </div>
));

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
  const [guarantorsLoading, setGuarantorsLoading] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setUserRole(user.role);
      setUserBranch(user.branch);
    }
    // ✅ Independent requests, already run in parallel (neither awaits the other)
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

  // ✅ Function to fetch guarantors for a specific account (now called lazily,
  // only for the one account whose modal the user opens)
  const fetchGuarantorsForAccount = async (accountId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/installments/account-details/${accountId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success && data.data) {
        const accountData = data.data;
        const customer = accountData.customer || {};
        // Try multiple paths for guarantors
        if (customer.guarantors && Array.isArray(customer.guarantors)) {
          return customer.guarantors;
        }
        if (accountData.guarantors && Array.isArray(accountData.guarantors)) {
          return accountData.guarantors;
        }
        if (customer.guarantor && Array.isArray(customer.guarantor)) {
          return customer.guarantor;
        }
      }
      return [];
    } catch (error) {
      console.error('Error fetching guarantors for account:', error);
      return [];
    }
  };

  // ✅ FAST fetchClients - pehle yahan har account ke liye Promise.all ke andar
  // `await fetchGuarantorsForAccount(account.id)` chal raha tha jab bhi guarantors
  // customer/account object mein already nahi hote the — matlab 100+ clients pe
  // 100+ EXTRA network requests page load ke waqt, aur poora page un sab ke
  // complete hone ka wait karta tha. Ab guarantors sirf usi data se liye jate
  // hain jo /accounts response mein already mojood hai; agar nahi milte to
  // empty rehte hain aur "View Details" click karne par sirf usi client ke
  // liye lazy-fetch hote hain (neeche viewDetail mein).
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
        
        // ✅ Synchronous map now — no per-account network calls here
        const clientsData = accounts.map((account) => {
          const installments = account.installments || [];
          const currentMonthStr = getCurrentMonthStr();
          const currentMonthInstallment = installments.find(p => p.month === currentMonthStr);
          const mirrorAmount = currentMonthInstallment ? parseFloat(currentMonthInstallment.balance || 0) : 0;
          
          const customer = account.customer || {};
          
          // ✅ Get guarantors only from data already present in this response.
          // If not present, leave empty for now — fetched lazily on "View Details".
          let guarantors = [];
          if (customer.guarantors && Array.isArray(customer.guarantors) && customer.guarantors.length > 0) {
            guarantors = customer.guarantors;
          } else if (account.guarantors && Array.isArray(account.guarantors) && account.guarantors.length > 0) {
            guarantors = account.guarantors;
          } else if (customer.guarantor && Array.isArray(customer.guarantor) && customer.guarantor.length > 0) {
            guarantors = customer.guarantor;
          }

          return {
            id: account.id,
            name: customer.name || 'N/A',
            phone: customer.phone || '',
            cnic: customer.cnic || '',
            address: customer.address || '',
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
            installments: account.installments || [],
            mirror: mirrorAmount,
            // ✅ Documents ke liye fields - customer se direct
            customer: customer,
            account: account,
            guarantors: guarantors,
            guarantorsFetched: guarantors.length > 0, // ✅ tracks whether we still need to lazy-fetch
            // Direct document fields for easy access
            cnic_front: customer.cnic_front || null,
            cnic_back: customer.cnic_back || null,
            additional_image_1: customer.additional_image_1 || null,
            additional_image_2: customer.additional_image_2 || null,
            voice_consent: customer.voice_consent || null,
            chalan_front: account.chalan_front || null,
            chalan_back: account.chalan_back || null,
          };
        });
        
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

  const getClientCategoryInfo = useCallback((client) => {
    const list = Array.isArray(client.installments) ? client.installments : [];
    const totalInstallments = client.totalInstallments || list.length;
    const fullyPaidCount = list.filter(p => parseFloat(p.balance || 0) <= 0).length;

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
  }, []);

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

  // ✅ Memoized: category is computed once per client per accounts-change,
  // instead of being recomputed 5x per client (total/aging/overdue/paid/clear)
  // on every single render (every keystroke in search, every filter click)
  const categorizedClients = useMemo(() => {
    return clients.map(c => ({ client: c, category: getClientCategoryInfo(c).category }));
  }, [clients, getClientCategoryInfo]);

  // ✅ Memoized: only recomputes when clients/filters/branch actually change
  const filteredData = useMemo(() => {
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
  }, [clients, userBranch, search, categoryFilter, dateFilter, getClientCategoryInfo]);

  // ✅ Memoized: derived once from categorizedClients instead of looping
  // the full client list 5 separate times on every render
  const { totalClients, totalAging, totalOverdue, totalPaid, totalClear, totalBalance } = useMemo(() => {
    let aging = 0, overdue = 0, paid = 0, clear = 0, balance = 0;
    for (const { client, category } of categorizedClients) {
      if (category === 'aging') aging++;
      else if (category === 'overdue') overdue++;
      else if (category === 'paid') paid++;
      else if (category === 'clear') clear++;
      balance += client.balance;
    }
    return {
      totalClients: categorizedClients.length,
      totalAging: aging,
      totalOverdue: overdue,
      totalPaid: paid,
      totalClear: clear,
      totalBalance: balance
    };
  }, [categorizedClients]);

  // ✅ Format currency WITHOUT "PKR" prefix
  const formatCurrency = (amount) => {
    return amount.toLocaleString();
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-PK', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getBranchName = (branchId) => {
    return branchId === 1 ? 'Branch 1' : 'Branch 2';
  };

  // ✅ Opens modal instantly, then lazy-loads guarantors only for this one
  // client (only if we don't already have them from the initial /accounts
  // response) — this used to happen for EVERY client on page load.
  const viewDetail = async (item) => {
    setSelectedUser(item);
    setShowDetailModal(true);

    if (!item.guarantorsFetched) {
      setGuarantorsLoading(true);
      const guarantors = await fetchGuarantorsForAccount(item.id);
      const updatedItem = { ...item, guarantors, guarantorsFetched: true };

      setSelectedUser(updatedItem);
      setClients(prev => prev.map(c => c.id === item.id ? updatedItem : c));
      setGuarantorsLoading(false);
    }
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

  // ✅ EXPORT DATA - Account Holders ke liye
  const getExportData = useCallback(() => {
    return filteredData.map(client => {
      const categoryInfo = getClientCategoryInfo(client);
      return {
        name: client.name || 'N/A',
        phone: client.phone || 'N/A',
        cnic: client.cnic || 'N/A',
        address: client.address || 'N/A',
        caseNo: client.caseNo || 'N/A',
        product: client.product || 'N/A',
        branch: getBranchName(client.branch),
        totalAmount: client.totalAmount || 0,
        paidAmount: client.paidAmount || 0,
        balance: client.balance || 0,
        monthlyInstallment: client.monthlyInstallment || 0,
        mirror: client.mirror || 0,
        installmentsPaid: client.installmentsPaid || 0,
        totalInstallments: client.totalInstallments || 0,
        nextDueDate: client.nextDueDate || 'N/A',
        joiningDate: client.joiningDate || 'N/A',
        lastPaymentDate: client.lastPaymentDate || 'N/A',
        status: categoryInfo.category.charAt(0).toUpperCase() + categoryInfo.category.slice(1),
        createdBy: client.creatorName || 'N/A',
        employee: client.employeeName || 'N/A'
      };
    });
  }, [filteredData, getClientCategoryInfo]);

  const exportColumns = useMemo(() => [
    { header: 'Name', key: 'name' },
    { header: 'Phone', key: 'phone' },
    { header: 'CNIC', key: 'cnic' },
    { header: 'Address', key: 'address' },
    { header: 'Case No', key: 'caseNo' },
    { header: 'Product', key: 'product' },
    { header: 'Branch', key: 'branch' },
    { header: 'Total Amount', key: 'totalAmount' },
    { header: 'Paid Amount', key: 'paidAmount' },
    { header: 'Balance', key: 'balance' },
    { header: 'Monthly Installment', key: 'monthlyInstallment' },
    { header: 'Mirror', key: 'mirror' },
    { header: 'Installments Paid', key: 'installmentsPaid' },
    { header: 'Total Installments', key: 'totalInstallments' },
    { header: 'Next Due Date', key: 'nextDueDate' },
    { header: 'Joining Date', key: 'joiningDate' },
    { header: 'Last Payment', key: 'lastPaymentDate' },
    { header: 'Status', key: 'status' },
    { header: 'Created By', key: 'createdBy' },
    { header: 'Employee', key: 'employee' }
  ], []);

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
      value: `PKR ${formatCurrency(totalBalance)}`, 
      icon: DollarSign, 
      color: '#C9A84C', 
      bg: 'rgba(201,168,76,0.12)',
      className: 'balance'
    },
  ];

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
            <th style={{ fontWeight: 800 }}>Total</th>
            <th style={{ fontWeight: 800 }}>Paid</th>
            <th style={{ fontWeight: 800 }}>Balance</th>
            <th style={{ fontWeight: 800 }}>Installment</th>
            <th style={{ fontWeight: 800 }}>Mirror</th>
            <th style={{ fontWeight: 800 }}>Status</th>
            <th style={{ fontWeight: 800 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan="11" className="no-data">
                <div className="no-data-content">
                  <UsersIcon size={32} />
                  <p style={{ fontWeight: 600 }}>No clients found</p>
                </div>
              </td>
            </tr>
          ) : (
            data.map((client, index) => {
              const categoryInfo = getClientCategoryInfo(client);
              return (
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
                  <td className="amount" style={{ fontWeight: 600 }}>{formatCurrency(client.monthlyInstallment)}</td>
                  <td className={client.mirror > 0 ? 'balance-amount' : 'paid-amount'} style={{ fontWeight: 700 }}>
                    {formatCurrency(client.mirror)}
                  </td>
                  <td>
                    {getCategoryBadge(client)}
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
              );
            })
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
          <ExportButton
            data={getExportData()}
            columns={exportColumns}
            filename="account-holders-report"
            title="Account Holders Report"
          />
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
            <option value="all">All Clients</option>
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
                    <span style={{ fontWeight: 700 }}>Case No</span>
                    <strong style={{ fontWeight: 700 }}>{selectedUser.caseNo}</strong>
                  </div>
                  <div className="user-detail-item">
                    <span style={{ fontWeight: 700 }}>Product</span>
                    <strong style={{ fontWeight: 600 }}>{selectedUser.product}</strong>
                  </div>
                  <div className="user-detail-item">
                    <span style={{ fontWeight: 700 }}>Address</span>
                    <strong style={{ fontWeight: 600 }}>{selectedUser.address}</strong>
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

              {/* ============================================ */}
              {/* ✅ DOCUMENTS SECTION - Same as Installments.jsx */}
              {/* ============================================ */}
              <div className="detail-section" style={{ borderTop: '2px solid #e5e7eb', paddingTop: '20px', marginTop: '10px' }}>
                <div className="section-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <FileText size={20} style={{ color: '#374151' }} />
                  <h5 style={{ fontWeight: 700, fontSize: '15px', margin: 0, color: '#1f2937' }}>Original Form Documents</h5>
                </div>

                {/* Customer CNIC Images */}
                <div style={{ marginBottom: '20px' }}>
                  <h6 style={{ fontWeight: 700, fontSize: '13px', marginBottom: '10px', color: '#374151' }}>
                    Customer CNIC
                  </h6>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                    {selectedUser.cnic_front && (
                      <DocImage label="CNIC Front" src={getFileUrl(selectedUser.cnic_front)} />
                    )}
                    {selectedUser.cnic_back && (
                      <DocImage label="CNIC Back" src={getFileUrl(selectedUser.cnic_back)} />
                    )}
                    {!selectedUser.cnic_front && !selectedUser.cnic_back && (
                      <p style={{ color: '#6b7280', fontSize: '13px', margin: 0 }}>No customer CNIC images found</p>
                    )}
                  </div>
                </div>

                {/* Additional Images */}
                <div style={{ marginBottom: '20px' }}>
                  <h6 style={{ fontWeight: 700, fontSize: '13px', marginBottom: '10px', color: '#374151' }}>
                    Additional Documents
                  </h6>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                    {selectedUser.additional_image_1 && (
                      <DocImage label="Additional Image 1" src={getFileUrl(selectedUser.additional_image_1)} />
                    )}
                    {selectedUser.additional_image_2 && (
                      <DocImage label="Additional Image 2" src={getFileUrl(selectedUser.additional_image_2)} />
                    )}
                    {!selectedUser.additional_image_1 && !selectedUser.additional_image_2 && (
                      <p style={{ color: '#6b7280', fontSize: '13px', margin: 0 }}>No additional documents found</p>
                    )}
                  </div>
                </div>

                {/* Chalan Images */}
                <div style={{ marginBottom: '20px' }}>
                  <h6 style={{ fontWeight: 700, fontSize: '13px', marginBottom: '10px', color: '#374151' }}>
                    Chalan
                  </h6>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                    {selectedUser.chalan_front && (
                      <DocImage label="Chalan Front" src={getFileUrl(selectedUser.chalan_front)} />
                    )}
                    {selectedUser.chalan_back && (
                      <DocImage label="Chalan Back" src={getFileUrl(selectedUser.chalan_back)} />
                    )}
                    {!selectedUser.chalan_front && !selectedUser.chalan_back && (
                      <p style={{ color: '#6b7280', fontSize: '13px', margin: 0 }}>No chalan images found</p>
                    )}
                  </div>
                </div>

                {/* Voice Consent */}
                {selectedUser.voice_consent && (
                  <div style={{ marginBottom: '20px' }}>
                    <h6 style={{ fontWeight: 700, fontSize: '13px', marginBottom: '10px', color: '#374151' }}>
                      Voice Consent (Raza Mandi)
                    </h6>
                    <audio controls preload="none" style={{ width: '100%' }}>
                      <source src={getFileUrl(selectedUser.voice_consent)} />
                      Your browser does not support audio playback.
                    </audio>
                  </div>
                )}

                {/* ✅ GUARANTORS' CNIC IMAGES - lazy loaded on modal open */}
                <div>
                  <h6 style={{ fontWeight: 700, fontSize: '13px', marginBottom: '10px', color: '#374151' }}>
                    Guarantors' CNIC Images
                  </h6>
                  {guarantorsLoading ? (
                    <p style={{ color: '#6b7280', fontSize: '13px', margin: 0 }}>Loading guarantors...</p>
                  ) : selectedUser.guarantors && selectedUser.guarantors.length > 0 ? (
                    selectedUser.guarantors.map((g, idx) => (
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
                    <p style={{ color: '#6b7280', fontSize: '13px', margin: 0 }}>No guarantor documents found</p>
                  )}
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