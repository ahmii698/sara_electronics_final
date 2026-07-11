import React, { useState, useEffect } from 'react';
import { 
  Search, Users as UsersIcon, UserPlus, User, Mail, Phone, Building, Calendar, 
  Shield, CheckCircle, XCircle, Clock, MoreVertical, Edit, Trash2, Eye, 
  Filter, ChevronDown, Award, Briefcase, UserCheck, UserX,
  DollarSign, AlertCircle, PauseCircle, PlayCircle, TrendingUp, TrendingDown,
  FileText, Printer, Download, BarChart3
} from 'lucide-react';
import './Users.css';

const UsersManagement = () => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userBranch, setUserBranch] = useState(null);
  const [activeTab, setActiveTab] = useState('employees'); // 'employees' or 'clients'

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setUserRole(user.role);
      setUserBranch(user.branch);
    }
  }, []);

  // ===== EMPLOYEES DATA (System Users) =====
  const [employees, setEmployees] = useState([
    {
      id: 1,
      name: 'Ahmed Khan',
      email: 'ahmed@example.com',
      phone: '0300-1234567',
      role: 'admin',
      branch: 1,
      status: 'active',
      joiningDate: '2025-01-15',
      salary: 45000,
      lastActive: '2026-07-10',
      accountsOpened: 89,
      recoveryAmount: 320000,
      commission: 178000,
      leaves: 9,
    },
    {
      id: 2,
      name: 'Sara Ali',
      email: 'sara@example.com',
      phone: '0300-7654321',
      role: 'manager',
      branch: 2,
      status: 'active',
      joiningDate: '2025-03-01',
      salary: 38000,
      lastActive: '2026-07-09',
      accountsOpened: 65,
      recoveryAmount: 249000,
      commission: 130000,
      leaves: 7,
    },
    {
      id: 3,
      name: 'Usman Malik',
      email: 'usman@example.com',
      phone: '0300-2345678',
      role: 'employee',
      branch: 1,
      status: 'active',
      joiningDate: '2025-06-01',
      salary: 52000,
      lastActive: '2026-07-08',
      accountsOpened: 45,
      recoveryAmount: 156000,
      commission: 90000,
      leaves: 17,
    },
    {
      id: 4,
      name: 'Fatima Noor',
      email: 'fatima@example.com',
      phone: '0300-8765432',
      role: 'employee',
      branch: 2,
      status: 'inactive',
      joiningDate: '2025-08-01',
      salary: 41000,
      lastActive: '2026-06-30',
      accountsOpened: 53,
      recoveryAmount: 197000,
      commission: 106000,
      leaves: 8,
    },
    {
      id: 5,
      name: 'Bilal Ahmed',
      email: 'bilal@example.com',
      phone: '0300-3456789',
      role: 'employee',
      branch: 1,
      status: 'active',
      joiningDate: '2025-09-15',
      salary: 35000,
      lastActive: '2026-07-07',
      accountsOpened: 32,
      recoveryAmount: 98000,
      commission: 64000,
      leaves: 12,
    },
    {
      id: 6,
      name: 'Hina Riaz',
      email: 'hina@example.com',
      phone: '0300-6543210',
      role: 'manager',
      branch: 2,
      status: 'active',
      joiningDate: '2025-10-01',
      salary: 42000,
      lastActive: '2026-07-06',
      accountsOpened: 58,
      recoveryAmount: 210000,
      commission: 116000,
      leaves: 5,
    },
    {
      id: 7,
      name: 'Imran Ali',
      email: 'imran@example.com',
      phone: '0300-4567890',
      role: 'employee',
      branch: 1,
      status: 'on_leave',
      joiningDate: '2025-11-01',
      salary: 30000,
      lastActive: '2026-06-28',
      accountsOpened: 28,
      recoveryAmount: 75000,
      commission: 56000,
      leaves: 15,
    },
    {
      id: 8,
      name: 'Nadia Khan',
      email: 'nadia@example.com',
      phone: '0300-5678901',
      role: 'employee',
      branch: 2,
      status: 'active',
      joiningDate: '2026-01-15',
      salary: 32000,
      lastActive: '2026-07-05',
      accountsOpened: 22,
      recoveryAmount: 62000,
      commission: 44000,
      leaves: 3,
    },
  ]);

  // ===== CLIENTS DATA (Account Holders - Installment walay) =====
  const [clients, setClients] = useState([
    {
      id: 1,
      name: 'Ahmed Khan',
      email: 'ahmed.khan@gmail.com',
      phone: '0300-1234567',
      cnic: '12345-6789012-3',
      address: 'House #12, Street 5, Lahore',
      branch: 1,
      accountStatus: 'active',
      paymentStatus: 'partial',
      totalAmount: 60000,
      paidAmount: 25000,
      balance: 35000,
      monthlyInstallment: 5000,
      installmentsPaid: 5,
      totalInstallments: 12,
      nextDueDate: '2026-08-15',
      joiningDate: '2026-01-15',
      lastPaymentDate: '2026-07-01',
      overdueDays: 45,
      product: 'Samsung LED 55"',
      caseNo: 'SR-001',
      employeeId: 1,
    },
    {
      id: 2,
      name: 'Usman Malik',
      email: 'usman.malik@gmail.com',
      phone: '0300-2345678',
      cnic: '12345-6789012-6',
      address: 'House #78, Street 12, Lahore',
      branch: 1,
      accountStatus: 'active',
      paymentStatus: 'partial',
      totalAmount: 40000,
      paidAmount: 15000,
      balance: 25000,
      monthlyInstallment: 4000,
      installmentsPaid: 4,
      totalInstallments: 10,
      nextDueDate: '2026-08-20',
      joiningDate: '2026-01-20',
      lastPaymentDate: '2026-07-05',
      overdueDays: 30,
      product: 'Dell Laptop',
      caseNo: 'SR-003',
      employeeId: 1,
    },
    {
      id: 3,
      name: 'Bilal Ahmed',
      email: 'bilal.ahmed@gmail.com',
      phone: '0300-3456789',
      cnic: '12345-6789012-8',
      address: 'House #12, Street 20, Lahore',
      branch: 1,
      accountStatus: 'hold',
      paymentStatus: 'unpaid',
      totalAmount: 30000,
      paidAmount: 0,
      balance: 30000,
      monthlyInstallment: 3000,
      installmentsPaid: 0,
      totalInstallments: 10,
      nextDueDate: '2026-08-10',
      joiningDate: '2026-02-10',
      lastPaymentDate: '2026-02-10',
      overdueDays: 60,
      product: 'Samsung Galaxy S24',
      caseNo: 'SR-007',
      employeeId: 1,
    },
    {
      id: 4,
      name: 'Ali Raza',
      email: 'ali.raza@gmail.com',
      phone: '0300-4567890',
      cnic: '12345-6789012-0',
      address: 'House #56, Street 30, Lahore',
      branch: 2,
      accountStatus: 'closed',
      paymentStatus: 'paid',
      totalAmount: 50000,
      paidAmount: 50000,
      balance: 0,
      monthlyInstallment: 5000,
      installmentsPaid: 10,
      totalInstallments: 10,
      nextDueDate: 'N/A',
      joiningDate: '2026-01-05',
      lastPaymentDate: '2026-07-15',
      overdueDays: 0,
      product: 'Apple iPhone 15',
      caseNo: 'SR-005',
      employeeId: 2,
    },
    {
      id: 5,
      name: 'Zainab Khan',
      email: 'zainab.khan@gmail.com',
      phone: '0300-5678901',
      cnic: '12345-6789012-1',
      address: 'House #45, Street 40, Lahore',
      branch: 1,
      accountStatus: 'active',
      paymentStatus: 'partial',
      totalAmount: 35000,
      paidAmount: 20000,
      balance: 15000,
      monthlyInstallment: 3000,
      installmentsPaid: 3,
      totalInstallments: 12,
      nextDueDate: '2026-08-01',
      joiningDate: '2026-03-01',
      lastPaymentDate: '2026-07-10',
      overdueDays: 20,
      product: 'LG Refrigerator',
      caseNo: 'SR-009',
      employeeId: 1,
    },
    {
      id: 6,
      name: 'Hina Riaz',
      email: 'hina.riaz@gmail.com',
      phone: '0300-6789012',
      cnic: '12345-6789012-2',
      address: 'House #67, Street 50, Lahore',
      branch: 2,
      accountStatus: 'closed',
      paymentStatus: 'paid',
      totalAmount: 25000,
      paidAmount: 25000,
      balance: 0,
      monthlyInstallment: 25000,
      installmentsPaid: 1,
      totalInstallments: 1,
      nextDueDate: 'N/A',
      joiningDate: '2026-03-15',
      lastPaymentDate: '2026-03-15',
      overdueDays: 0,
      product: 'Sony Soundbar',
      caseNo: 'SR-010',
      employeeId: 2,
    },
    {
      id: 7,
      name: 'Sara Ali',
      email: 'sara.ali@gmail.com',
      phone: '0300-7654321',
      cnic: '12345-6789012-4',
      address: 'House #34, Street 8, Lahore',
      branch: 2,
      accountStatus: 'active',
      paymentStatus: 'paid',
      totalAmount: 50000,
      paidAmount: 50000,
      balance: 0,
      monthlyInstallment: 5000,
      installmentsPaid: 10,
      totalInstallments: 10,
      nextDueDate: 'N/A',
      joiningDate: '2026-01-15',
      lastPaymentDate: '2026-07-12',
      overdueDays: 0,
      product: 'Apple MacBook',
      caseNo: 'SR-011',
      employeeId: 2,
    },
    {
      id: 8,
      name: 'Fatima Noor',
      email: 'fatima.noor@gmail.com',
      phone: '0300-8765432',
      cnic: '12345-6789012-7',
      address: 'House #90, Street 15, Lahore',
      branch: 2,
      accountStatus: 'hold',
      paymentStatus: 'unpaid',
      totalAmount: 45000,
      paidAmount: 5000,
      balance: 40000,
      monthlyInstallment: 4500,
      installmentsPaid: 1,
      totalInstallments: 10,
      nextDueDate: '2026-08-25',
      joiningDate: '2026-02-20',
      lastPaymentDate: '2026-03-20',
      overdueDays: 70,
      product: 'Samsung LED 65"',
      caseNo: 'SR-012',
      employeeId: 2,
    },
  ]);

  // ===== GET FILTERED DATA =====
  const getFilteredData = () => {
    let data = activeTab === 'employees' ? employees : clients;
    let filtered = data;

    if (userBranch) {
      filtered = filtered.filter(item => item.branch === parseInt(userBranch));
    }

    if (search) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.email.toLowerCase().includes(search.toLowerCase()) ||
        item.phone.includes(search) ||
        (item.cnic && item.cnic.includes(search)) ||
        (item.caseNo && item.caseNo.toLowerCase().includes(search.toLowerCase()))
      );
    }

    // Role filter - only for employees
    if (activeTab === 'employees' && roleFilter !== 'all') {
      filtered = filtered.filter(item => item.role === roleFilter);
    }

    // Status filter - for both
    if (activeTab === 'employees' && statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    // Payment filter - only for clients
    if (activeTab === 'clients' && paymentFilter !== 'all') {
      filtered = filtered.filter(item => item.paymentStatus === paymentFilter);
    }

    // Account Status filter - only for clients
    if (activeTab === 'clients' && statusFilter !== 'all') {
      filtered = filtered.filter(item => item.accountStatus === statusFilter);
    }

    // Date filter
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
  const totalEmployees = employees.length;
  const totalAdmins = employees.filter(u => u.role === 'admin').length;
  const totalManagers = employees.filter(u => u.role === 'manager').length;
  const totalEmployeesCount = employees.filter(u => u.role === 'employee').length;
  const activeEmployees = employees.filter(u => u.status === 'active').length;
  const inactiveEmployees = employees.filter(u => u.status === 'inactive').length;

  const totalClients = clients.length;
  const totalActive = clients.filter(c => c.accountStatus === 'active').length;
  const totalHold = clients.filter(c => c.accountStatus === 'hold').length;
  const totalClosed = clients.filter(c => c.accountStatus === 'closed').length;
  const totalPaid = clients.filter(c => c.paymentStatus === 'paid').length;
  const totalUnpaid = clients.filter(c => c.paymentStatus === 'unpaid').length;
  const totalPartial = clients.filter(c => c.paymentStatus === 'partial').length;
  const totalBalance = clients.reduce((sum, c) => sum + c.balance, 0);

  // ===== BADGES =====
  const getStatusBadge = (status) => {
    switch(status) {
      case 'active':
        return <span className="user-status-badge active"><CheckCircle size={12} /> Active</span>;
      case 'inactive':
        return <span className="user-status-badge inactive"><XCircle size={12} /> Inactive</span>;
      case 'on_leave':
        return <span className="user-status-badge on-leave"><Clock size={12} /> On Leave</span>;
      default:
        return <span className="user-status-badge">{status}</span>;
    }
  };

  const getRoleBadge = (role) => {
    switch(role) {
      case 'admin':
        return <span className="user-role-badge admin"><Shield size={12} /> Admin</span>;
      case 'manager':
        return <span className="user-role-badge manager"><Award size={12} /> Manager</span>;
      case 'employee':
        return <span className="user-role-badge employee"><Briefcase size={12} /> Employee</span>;
      default:
        return <span className="user-role-badge">{role}</span>;
    }
  };

  const getPaymentBadge = (status) => {
    switch(status) {
      case 'paid':
        return <span className="client-badge paid"><CheckCircle size={12} /> Paid</span>;
      case 'unpaid':
        return <span className="client-badge unpaid"><XCircle size={12} /> Unpaid</span>;
      case 'partial':
        return <span className="client-badge partial"><AlertCircle size={12} /> Partial</span>;
      default:
        return <span className="client-badge">{status}</span>;
    }
  };

  const getAccountStatusBadge = (status) => {
    switch(status) {
      case 'active':
        return <span className="account-status-badge active"><PlayCircle size={12} /> Active</span>;
      case 'hold':
        return <span className="account-status-badge hold"><PauseCircle size={12} /> Hold</span>;
      case 'closed':
        return <span className="account-status-badge closed"><XCircle size={12} /> Closed</span>;
      default:
        return <span className="account-status-badge">{status}</span>;
    }
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

  const toggleUserStatus = (userId) => {
    setEmployees(employees.map(u => 
      u.id === userId 
        ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' }
        : u
    ));
  };

  const deleteUser = (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      setEmployees(employees.filter(u => u.id !== userId));
    }
  };

  const isAdmin = userRole === 'admin';
  const isManager = userRole === 'manager';

  // ===== RENDER EMPLOYEES TABLE =====
  const renderEmployeesTable = () => {
    const data = filteredData;
    return (
      <table className="users-table">
        <thead>
          <tr>
            <th>#</th>
            <th>User</th>
            <th>Role</th>
            <th>Branch</th>
            <th>Status</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Joining Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan="9" className="no-data">
                <div className="no-data-content">
                  <UsersIcon size={32} />
                  <p>No employees found</p>
                </div>
              </td>
            </tr>
          ) : (
            data.map((user, index) => (
              <tr key={user.id}>
                <td className="text-gray">{index + 1}</td>
                <td>
                  <div className="user-name-cell">
                    <div className="user-avatar">{user.name.charAt(0)}</div>
                    <div>
                      <span className="user-name">{user.name}</span>
                    </div>
                  </div>
                </td>
                <td>{getRoleBadge(user.role)}</td>
                <td>
                  <span className="user-branch-badge">
                    <Building size={12} />
                    {getBranchName(user.branch)}
                  </span>
                </td>
                <td>{getStatusBadge(user.status)}</td>
                <td>{user.email}</td>
                <td>{user.phone}</td>
                <td>
                  <div className="date-info">
                    <Calendar size={12} />
                    {user.joiningDate}
                  </div>
                </td>
                <td>
                  <div className="action-group">
                    <button className="btn-view" onClick={() => viewDetail(user)} title="View Details">
                      <Eye size={15} />
                    </button>
                    <button className="btn-edit" onClick={() => editUser(user)} title="Edit User">
                      <Edit size={15} />
                    </button>
                    <button className={`btn-toggle ${user.status === 'active' ? 'active' : 'inactive'}`}
                      onClick={() => toggleUserStatus(user.id)}
                      title={user.status === 'active' ? 'Deactivate' : 'Activate'}>
                      {user.status === 'active' ? <UserX size={15} /> : <UserCheck size={15} />}
                    </button>
                    <button className="btn-delete" onClick={() => deleteUser(user.id)} title="Delete User">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    );
  };

  // ===== RENDER CLIENTS TABLE =====
  const renderClientsTable = () => {
    const data = filteredData;
    return (
      <table className="users-table clients-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Client</th>
            <th>Case #</th>
            <th>Product</th>
            <th>Total (PKR)</th>
            <th>Paid (PKR)</th>
            <th>Balance (PKR)</th>
            <th>Payment</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan="10" className="no-data">
                <div className="no-data-content">
                  <UsersIcon size={32} />
                  <p>No clients found</p>
                </div>
              </td>
            </tr>
          ) : (
            data.map((client, index) => (
              <tr key={client.id} className={client.overdueDays > 30 ? 'overdue-row' : ''}>
                <td className="text-gray">{index + 1}</td>
                <td>
                  <div className="user-name-cell">
                    <div className="user-avatar">{client.name.charAt(0)}</div>
                    <div>
                      <span className="user-name">{client.name}</span>
                      <span className="client-branch">
                        <Building size={12} />
                        {getBranchName(client.branch)}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="case-number">{client.caseNo}</td>
                <td>{client.product}</td>
                <td className="amount">{formatCurrency(client.totalAmount)}</td>
                <td className="paid-amount">{formatCurrency(client.paidAmount)}</td>
                <td className={client.balance > 0 ? 'balance-amount' : 'paid-amount'}>
                  {formatCurrency(client.balance)}
                </td>
                <td>{getPaymentBadge(client.paymentStatus)}</td>
                <td>{getAccountStatusBadge(client.accountStatus)}</td>
                <td>
                  <div className="action-group">
                    <button className="btn-view" onClick={() => viewDetail(client)} title="View Details">
                      <Eye size={15} />
                    </button>
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
            <h2>{activeTab === 'employees' ? 'Users Management' : 'Account Holders'}</h2>
            <span className="live-badge">
              <UsersIcon size={12} /> Live
            </span>
          </div>
          <p className="subtitle">
            {activeTab === 'employees' ? 'Manage all system users' : 'Manage all customers with accounts'}
          </p>
        </div>
        <div className="header-actions">
          {isAdmin && activeTab === 'employees' && (
            <button className="btn-add-user">
              <UserPlus size={18} />
              Add User
            </button>
          )}
          <button className="btn-export" onClick={() => alert('Exporting...')}>
            <Download size={18} />
            Export
          </button>
        </div>
      </div>

      {/* ===== TABS ===== */}
      <div className="users-tabs">
        <button 
          className={`tab-btn ${activeTab === 'employees' ? 'active' : ''}`}
          onClick={() => setActiveTab('employees')}
        >
          <Briefcase size={16} />
          System Users
        </button>
        <button 
          className={`tab-btn ${activeTab === 'clients' ? 'active' : ''}`}
          onClick={() => setActiveTab('clients')}
        >
          <UsersIcon size={16} />
          Account Holders
        </button>
      </div>

      {/* ===== STATS CARDS ===== */}
      {activeTab === 'employees' ? (
        <div className="users-stats-grid">
          <div className="users-stat-card total">
            <div className="users-stat-icon"><UsersIcon size={20} /></div>
            <div className="users-stat-info">
              <span className="users-stat-label">Total Users</span>
              <span className="users-stat-value">{totalEmployees}</span>
            </div>
          </div>
          <div className="users-stat-card admins">
            <div className="users-stat-icon"><Shield size={20} /></div>
            <div className="users-stat-info">
              <span className="users-stat-label">Admins</span>
              <span className="users-stat-value">{totalAdmins}</span>
            </div>
          </div>
          <div className="users-stat-card managers">
            <div className="users-stat-icon"><Award size={20} /></div>
            <div className="users-stat-info">
              <span className="users-stat-label">Managers</span>
              <span className="users-stat-value">{totalManagers}</span>
            </div>
          </div>
          <div className="users-stat-card employees">
            <div className="users-stat-icon"><Briefcase size={20} /></div>
            <div className="users-stat-info">
              <span className="users-stat-label">Employees</span>
              <span className="users-stat-value">{totalEmployeesCount}</span>
            </div>
          </div>
          <div className="users-stat-card active-users">
            <div className="users-stat-icon"><CheckCircle size={20} /></div>
            <div className="users-stat-info">
              <span className="users-stat-label">Active</span>
              <span className="users-stat-value">{activeEmployees}</span>
            </div>
          </div>
          <div className="users-stat-card inactive-users">
            <div className="users-stat-icon"><XCircle size={20} /></div>
            <div className="users-stat-info">
              <span className="users-stat-label">Inactive</span>
              <span className="users-stat-value">{inactiveEmployees}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="users-stats-grid clients-stats">
          <div className="users-stat-card total">
            <div className="users-stat-icon"><UsersIcon size={20} /></div>
            <div className="users-stat-info">
              <span className="users-stat-label">Total Clients</span>
              <span className="users-stat-value">{totalClients}</span>
            </div>
          </div>
          <div className="users-stat-card active-users">
            <div className="users-stat-icon"><PlayCircle size={20} /></div>
            <div className="users-stat-info">
              <span className="users-stat-label">Active</span>
              <span className="users-stat-value">{totalActive}</span>
            </div>
          </div>
          <div className="users-stat-card managers">
            <div className="users-stat-icon"><PauseCircle size={20} /></div>
            <div className="users-stat-info">
              <span className="users-stat-label">Hold</span>
              <span className="users-stat-value">{totalHold}</span>
            </div>
          </div>
          <div className="users-stat-card inactive-users">
            <div className="users-stat-icon"><XCircle size={20} /></div>
            <div className="users-stat-info">
              <span className="users-stat-label">Closed</span>
              <span className="users-stat-value">{totalClosed}</span>
            </div>
          </div>
          <div className="users-stat-card admins">
            <div className="users-stat-icon"><CheckCircle size={20} /></div>
            <div className="users-stat-info">
              <span className="users-stat-label">Paid</span>
              <span className="users-stat-value">{totalPaid}</span>
            </div>
          </div>
          <div className="users-stat-card employees">
            <div className="users-stat-icon"><DollarSign size={20} /></div>
            <div className="users-stat-info">
              <span className="users-stat-label">Balance</span>
              <span className="users-stat-value">{formatCurrency(totalBalance)}</span>
            </div>
          </div>
        </div>
      )}

      {/* ===== FILTERS ===== */}
      <div className="users-controls">
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder={activeTab === 'employees' ? "Search by name, email or phone..." : "Search by name, CNIC or case no..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-group">
          {activeTab === 'employees' ? (
            <>
              <select className="filter-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="employee">Employee</option>
              </select>
              <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="on_leave">On Leave</option>
              </select>
            </>
          ) : (
            <>
              <select className="filter-select" value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
                <option value="all">All Payment</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
                <option value="partial">Partial</option>
              </select>
              <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="hold">Hold</option>
                <option value="closed">Closed</option>
              </select>
            </>
          )}
          <select className="filter-select date-filter" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
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
            <span>{activeTab === 'employees' ? 'All Users' : 'All Clients'}</span>
            <span className="record-count">{filteredData.length} records</span>
          </div>
        </div>
        <div className="table-scroll">
          {activeTab === 'employees' ? renderEmployeesTable() : renderClientsTable()}
        </div>
      </div>

      {/* ===== MODAL ===== */}
      {showDetailModal && selectedUser && (
        <div className="users-modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="users-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="users-modal-header">
              <div className="users-modal-header-left">
                <User size={20} className="users-modal-icon" />
                <h3>{activeTab === 'employees' ? 'User' : 'Client'} Details</h3>
              </div>
              <button className="users-modal-close" onClick={() => setShowDetailModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="users-modal-body">
              <div className="user-detail-header">
                <div className="user-detail-avatar">{selectedUser.name.charAt(0)}</div>
                <div className="user-detail-info">
                  <h4>{selectedUser.name}</h4>
                  {activeTab === 'employees' ? (
                    <>
                      {getRoleBadge(selectedUser.role)}
                      {getStatusBadge(selectedUser.status)}
                    </>
                  ) : (
                    <>
                      {getPaymentBadge(selectedUser.paymentStatus)}
                      {getAccountStatusBadge(selectedUser.accountStatus)}
                    </>
                  )}
                  <span className="user-detail-branch">
                    <Building size={14} />
                    {getBranchName(selectedUser.branch)}
                  </span>
                </div>
              </div>

              <div className="user-detail-grid">
                <div className="user-detail-item">
                  <span>Email</span>
                  <strong>{selectedUser.email}</strong>
                </div>
                <div className="user-detail-item">
                  <span>Phone</span>
                  <strong>{selectedUser.phone}</strong>
                </div>
                {selectedUser.cnic && (
                  <div className="user-detail-item">
                    <span>CNIC</span>
                    <strong>{selectedUser.cnic}</strong>
                  </div>
                )}
                {selectedUser.address && (
                  <div className="user-detail-item">
                    <span>Address</span>
                    <strong>{selectedUser.address}</strong>
                  </div>
                )}
                <div className="user-detail-item">
                  <span>Joining Date</span>
                  <strong>{selectedUser.joiningDate}</strong>
                </div>
                {activeTab === 'employees' ? (
                  <>
                    <div className="user-detail-item">
                      <span>Salary</span>
                      <strong>{formatCurrency(selectedUser.salary)}</strong>
                    </div>
                    <div className="user-detail-item">
                      <span>Accounts Opened</span>
                      <strong>{selectedUser.accountsOpened}</strong>
                    </div>
                    <div className="user-detail-item">
                      <span>Commission</span>
                      <strong>{formatCurrency(selectedUser.commission)}</strong>
                    </div>
                    <div className="user-detail-item">
                      <span>Recovery</span>
                      <strong>{formatCurrency(selectedUser.recoveryAmount)}</strong>
                    </div>
                    <div className="user-detail-item">
                      <span>Leaves</span>
                      <strong>{selectedUser.leaves}</strong>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="user-detail-item">
                      <span>Product</span>
                      <strong>{selectedUser.product}</strong>
                    </div>
                    <div className="user-detail-item">
                      <span>Case No</span>
                      <strong>{selectedUser.caseNo}</strong>
                    </div>
                    <div className="user-detail-item">
                      <span>Total Amount</span>
                      <strong>{formatCurrency(selectedUser.totalAmount)}</strong>
                    </div>
                    <div className="user-detail-item">
                      <span>Paid Amount</span>
                      <strong className="paid-amount">{formatCurrency(selectedUser.paidAmount)}</strong>
                    </div>
                    <div className="user-detail-item">
                      <span>Balance</span>
                      <strong className={selectedUser.balance > 0 ? 'balance-amount' : 'paid-amount'}>
                        {formatCurrency(selectedUser.balance)}
                      </strong>
                    </div>
                    <div className="user-detail-item">
                      <span>Installments</span>
                      <strong>{selectedUser.installmentsPaid} / {selectedUser.totalInstallments}</strong>
                    </div>
                    <div className="user-detail-item">
                      <span>Next Due Date</span>
                      <strong>{selectedUser.nextDueDate}</strong>
                    </div>
                    <div className="user-detail-item">
                      <span>Overdue Days</span>
                      <strong className={selectedUser.overdueDays > 30 ? 'overdue-text' : ''}>
                        {selectedUser.overdueDays > 0 ? selectedUser.overdueDays : 'None'}
                      </strong>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="users-modal-footer">
              <button className="users-btn-cancel" onClick={() => setShowDetailModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersManagement;