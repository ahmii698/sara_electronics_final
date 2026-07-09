import React, { useState, useEffect } from 'react';
import { Search, User, DollarSign, Users, Briefcase, Calendar, Clock, Award, Building, Download, Eye, X, TrendingUp, CheckCircle, AlertCircle, AlertTriangle, FileText, Filter } from 'lucide-react';
import './EmployeePerformanceReport.css';

const EmployeePerformanceReport = () => {
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [userBranch, setUserBranch] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ===== FILTER STATES =====
  const [timeFilter, setTimeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setUserRole(user.role);
      setUserBranch(user.branch);
    }
  }, []);

  // ===== EMPLOYEES DATA (Branch wise) =====
  const employees = [
    { id: 1, name: 'Ahmed Khan', branch: 1, role: 'employee', joiningDate: '2025-01-15' },
    { id: 2, name: 'Sara Ali', branch: 2, role: 'manager', joiningDate: '2025-03-01' },
    { id: 3, name: 'Usman Malik', branch: 1, role: 'employee', joiningDate: '2025-06-01' },
    { id: 4, name: 'Fatima Noor', branch: 2, role: 'employee', joiningDate: '2025-08-01' },
    { id: 5, name: 'Bilal Ahmed', branch: 1, role: 'employee', joiningDate: '2025-09-15' },
    { id: 6, name: 'Hina Riaz', branch: 2, role: 'employee', joiningDate: '2025-10-01' },
    { id: 7, name: 'Imran Ali', branch: 1, role: 'employee', joiningDate: '2025-11-01' },
    { id: 8, name: 'Nadia Khan', branch: 2, role: 'employee', joiningDate: '2025-12-01' },
  ];

  // ===== EMPLOYEE PERFORMANCE DATA WITH FULL ACCOUNTS =====
  const employeePerformance = {
    1: {
      totalAccounts: 45,
      totalRecovery: 320000,
      totalCommission: 178000,
      paidAccounts: 28,
      pendingAccounts: 12,
      overdueAccounts: 5,
      accounts: [
        { id: 1, customer: 'Ahmed Khan', amount: 60000, paid: 25000, status: 'pending', date: '2026-01-15' },
        { id: 2, customer: 'Usman Malik', amount: 40000, paid: 15000, status: 'pending', date: '2026-01-20' },
        { id: 3, customer: 'Bilal Ahmed', amount: 30000, paid: 0, status: 'overdue', date: '2026-02-10' },
        { id: 4, customer: 'Ali Raza', amount: 50000, paid: 50000, status: 'paid', date: '2026-01-05' },
        { id: 5, customer: 'Zainab Khan', amount: 70000, paid: 70000, status: 'paid', date: '2026-02-15' },
        { id: 6, customer: 'Hina Riaz', amount: 50000, paid: 1000, status: 'overdue', date: '2026-02-15' },
        { id: 7, customer: 'Sara Ali', amount: 80000, paid: 40000, status: 'pending', date: '2026-03-01' },
        { id: 8, customer: 'Fatima Noor', amount: 60000, paid: 60000, status: 'paid', date: '2026-03-10' },
        { id: 9, customer: 'Imran Ali', amount: 35000, paid: 35000, status: 'paid', date: '2026-03-15' },
        { id: 10, customer: 'Nadia Khan', amount: 45000, paid: 20000, status: 'pending', date: '2026-03-20' },
        { id: 11, customer: 'Omar Farooq', amount: 55000, paid: 55000, status: 'paid', date: '2026-03-25' },
        { id: 12, customer: 'Khadija Noor', amount: 30000, paid: 0, status: 'overdue', date: '2026-04-01' },
        { id: 13, customer: 'Hassan Raza', amount: 65000, paid: 30000, status: 'pending', date: '2026-04-05' },
        { id: 14, customer: 'Ayesha Malik', amount: 40000, paid: 40000, status: 'paid', date: '2026-04-10' },
        { id: 15, customer: 'Zara Ahmed', amount: 50000, paid: 50000, status: 'paid', date: '2026-04-15' },
        { id: 16, customer: 'Usman Ali', amount: 70000, paid: 10000, status: 'pending', date: '2026-04-20' },
        { id: 17, customer: 'Fatima Bibi', amount: 30000, paid: 0, status: 'overdue', date: '2026-04-25' },
        { id: 18, customer: 'Ali Hassan', amount: 60000, paid: 60000, status: 'paid', date: '2026-05-01' },
        { id: 19, customer: 'Sana Khan', amount: 45000, paid: 20000, status: 'pending', date: '2026-05-05' },
        { id: 20, customer: 'Rizwan Ahmed', amount: 55000, paid: 55000, status: 'paid', date: '2026-05-10' },
        { id: 21, customer: 'Nazia Noor', amount: 35000, paid: 35000, status: 'paid', date: '2026-05-15' },
        { id: 22, customer: 'Kamran Ali', amount: 40000, paid: 0, status: 'overdue', date: '2026-05-20' },
        { id: 23, customer: 'Saima Riaz', amount: 50000, paid: 25000, status: 'pending', date: '2026-05-25' },
        { id: 24, customer: 'Tariq Mehmood', amount: 60000, paid: 60000, status: 'paid', date: '2026-06-01' },
        { id: 25, customer: 'Nadia Imran', amount: 30000, paid: 30000, status: 'paid', date: '2026-06-05' },
        { id: 26, customer: 'Omar Ali', amount: 70000, paid: 10000, status: 'pending', date: '2026-06-10' },
        { id: 27, customer: 'Khadija Raza', amount: 45000, paid: 0, status: 'overdue', date: '2026-06-15' },
        { id: 28, customer: 'Hassan Malik', amount: 55000, paid: 55000, status: 'paid', date: '2026-06-20' },
        { id: 29, customer: 'Ayesha Noor', amount: 40000, paid: 40000, status: 'paid', date: '2026-06-25' },
        { id: 30, customer: 'Zara Khan', amount: 50000, paid: 20000, status: 'pending', date: '2026-07-01' },
        { id: 31, customer: 'Usman Ahmed', amount: 60000, paid: 60000, status: 'paid', date: '2026-07-05' },
        { id: 32, customer: 'Fatima Ali', amount: 35000, paid: 0, status: 'overdue', date: '2026-07-10' },
        { id: 33, customer: 'Ali Rizwan', amount: 45000, paid: 45000, status: 'paid', date: '2026-07-15' },
        { id: 34, customer: 'Sana Bibi', amount: 55000, paid: 25000, status: 'pending', date: '2026-07-20' },
        { id: 35, customer: 'Rizwan Khan', amount: 30000, paid: 30000, status: 'paid', date: '2026-07-25' },
        { id: 36, customer: 'Nazia Ahmed', amount: 65000, paid: 65000, status: 'paid', date: '2026-08-01' },
        { id: 37, customer: 'Kamran Noor', amount: 40000, paid: 0, status: 'overdue', date: '2026-08-05' },
        { id: 38, customer: 'Saima Ali', amount: 50000, paid: 50000, status: 'paid', date: '2026-08-10' },
        { id: 39, customer: 'Tariq Raza', amount: 60000, paid: 20000, status: 'pending', date: '2026-08-15' },
        { id: 40, customer: 'Nadia Malik', amount: 35000, paid: 35000, status: 'paid', date: '2026-08-20' },
        { id: 41, customer: 'Omar Khan', amount: 45000, paid: 45000, status: 'paid', date: '2026-08-25' },
        { id: 42, customer: 'Khadija Ahmed', amount: 55000, paid: 0, status: 'pending', date: '2026-09-01' },
        { id: 43, customer: 'Hassan Noor', amount: 30000, paid: 30000, status: 'paid', date: '2026-09-05' },
        { id: 44, customer: 'Ayesha Raza', amount: 65000, paid: 65000, status: 'paid', date: '2026-09-10' },
        { id: 45, customer: 'Zara Malik', amount: 40000, paid: 10000, status: 'pending', date: '2026-09-15' },
      ]
    },
    2: {
      totalAccounts: 38,
      totalRecovery: 249000,
      totalCommission: 130000,
      paidAccounts: 22,
      pendingAccounts: 10,
      overdueAccounts: 6,
      accounts: [
        { id: 100, customer: 'Sara Ali', amount: 80000, paid: 40000, status: 'pending', date: '2026-01-25' },
        { id: 101, customer: 'Fatima Noor', amount: 60000, paid: 60000, status: 'paid', date: '2026-02-01' },
        { id: 102, customer: 'Zainab Khan', amount: 70000, paid: 20000, status: 'pending', date: '2026-02-20' },
        { id: 103, customer: 'Hina Riaz', amount: 50000, paid: 50000, status: 'paid', date: '2026-03-05' },
        { id: 104, customer: 'Ali Raza', amount: 40000, paid: 0, status: 'overdue', date: '2026-03-15' },
        { id: 105, customer: 'Ahmed Khan', amount: 30000, paid: 30000, status: 'paid', date: '2026-03-20' },
        { id: 106, customer: 'Usman Malik', amount: 45000, paid: 45000, status: 'paid', date: '2026-04-01' },
        { id: 107, customer: 'Bilal Ahmed', amount: 55000, paid: 10000, status: 'pending', date: '2026-04-10' },
      ]
    },
    3: {
      totalAccounts: 28,
      totalRecovery: 156000,
      totalCommission: 90000,
      paidAccounts: 15,
      pendingAccounts: 8,
      overdueAccounts: 5,
      accounts: [
        { id: 200, customer: 'Usman Malik', amount: 40000, paid: 15000, status: 'pending', date: '2026-01-20' },
        { id: 201, customer: 'Ahmed Khan', amount: 60000, paid: 60000, status: 'paid', date: '2026-02-01' },
        { id: 202, customer: 'Bilal Ahmed', amount: 30000, paid: 0, status: 'overdue', date: '2026-02-10' },
      ]
    },
    4: {
      totalAccounts: 32,
      totalRecovery: 197000,
      totalCommission: 106000,
      paidAccounts: 20,
      pendingAccounts: 8,
      overdueAccounts: 4,
      accounts: [
        { id: 300, customer: 'Fatima Noor', amount: 60000, paid: 60000, status: 'paid', date: '2026-01-15' },
        { id: 301, customer: 'Sara Ali', amount: 80000, paid: 30000, status: 'pending', date: '2026-02-01' },
      ]
    },
    5: {
      totalAccounts: 20,
      totalRecovery: 120000,
      totalCommission: 65000,
      paidAccounts: 12,
      pendingAccounts: 5,
      overdueAccounts: 3,
      accounts: [
        { id: 400, customer: 'Bilal Ahmed', amount: 30000, paid: 0, status: 'overdue', date: '2026-02-10' },
        { id: 401, customer: 'Ali Raza', amount: 50000, paid: 50000, status: 'paid', date: '2026-03-01' },
      ]
    },
    6: {
      totalAccounts: 25,
      totalRecovery: 150000,
      totalCommission: 80000,
      paidAccounts: 16,
      pendingAccounts: 6,
      overdueAccounts: 3,
      accounts: [
        { id: 500, customer: 'Hina Riaz', amount: 50000, paid: 1000, status: 'overdue', date: '2026-02-15' },
        { id: 501, customer: 'Sara Ali', amount: 80000, paid: 80000, status: 'paid', date: '2026-03-01' },
      ]
    },
    7: {
      totalAccounts: 18,
      totalRecovery: 95000,
      totalCommission: 50000,
      paidAccounts: 10,
      pendingAccounts: 5,
      overdueAccounts: 3,
      accounts: [
        { id: 600, customer: 'Imran Ali', amount: 35000, paid: 35000, status: 'paid', date: '2026-01-10' },
        { id: 601, customer: 'Nadia Khan', amount: 60000, paid: 10000, status: 'pending', date: '2026-02-05' },
      ]
    },
    8: {
      totalAccounts: 22,
      totalRecovery: 110000,
      totalCommission: 58000,
      paidAccounts: 14,
      pendingAccounts: 5,
      overdueAccounts: 3,
      accounts: [
        { id: 700, customer: 'Nadia Khan', amount: 60000, paid: 60000, status: 'paid', date: '2026-01-15' },
        { id: 701, customer: 'Imran Ali', amount: 35000, paid: 0, status: 'overdue', date: '2026-02-01' },
      ]
    },
  };

  // ===== FILTER FUNCTIONS =====
  const filterAccountsByTime = (accounts) => {
    if (timeFilter === 'all') return accounts;
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const currentWeek = getWeekNumber(now);
    
    return accounts.filter(account => {
      const date = new Date(account.date);
      const month = date.getMonth();
      const year = date.getFullYear();
      const week = getWeekNumber(date);
      
      if (timeFilter === 'monthly') {
        return month === currentMonth && year === currentYear;
      } else if (timeFilter === 'yearly') {
        return year === currentYear;
      } else if (timeFilter === 'weekly') {
        return week === currentWeek && year === currentYear;
      }
      return true;
    });
  };

  const getWeekNumber = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    const week1 = new Date(d.getFullYear(), 0, 4);
    return 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  };

  const filterAccountsByStatus = (accounts) => {
    if (statusFilter === 'all') return accounts;
    return accounts.filter(account => account.status === statusFilter);
  };

  // ===== GET FILTERED EMPLOYEES =====
  const getFilteredEmployees = () => {
    let filtered = employees;
    
    if (userBranch) {
      filtered = filtered.filter(emp => emp.branch === parseInt(userBranch));
    }
    
    if (searchTerm) {
      filtered = filtered.filter(emp => 
        emp.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  };

  const filteredEmployees = getFilteredEmployees();

  // ===== SELECT EMPLOYEE =====
  const handleSelectEmployee = (employee) => {
    setSelectedEmployee(employee);
    const data = employeePerformance[employee.id] || null;
    if (data) {
      // Apply filters to accounts
      let filteredAccounts = [...data.accounts];
      filteredAccounts = filterAccountsByTime(filteredAccounts);
      filteredAccounts = filterAccountsByStatus(filteredAccounts);
      
      setReportData({
        ...data,
        accounts: filteredAccounts
      });
    } else {
      setReportData(null);
    }
    setShowDropdown(false);
    setSearchTerm(employee.name);
    setCurrentPage(1);
  };

  // ===== APPLY FILTERS =====
  const applyFilters = () => {
    if (!selectedEmployee || !reportData) return;
    
    const data = employeePerformance[selectedEmployee.id];
    if (data) {
      let filteredAccounts = [...data.accounts];
      filteredAccounts = filterAccountsByTime(filteredAccounts);
      filteredAccounts = filterAccountsByStatus(filteredAccounts);
      
      setReportData({
        ...data,
        accounts: filteredAccounts
      });
      setCurrentPage(1);
    }
  };

  // ===== VIEW ACCOUNT DETAIL =====
  const viewAccountDetail = (account) => {
    setSelectedAccount(account);
    setShowAccountModal(true);
  };

  // ===== EXPORT REPORT =====
  const exportReport = () => {
    if (!selectedEmployee || !reportData) return;
    alert(`Exporting report for ${selectedEmployee.name}`);
  };

  // ===== GET STATUS COLOR =====
  const getStatusColor = (status) => {
    switch(status) {
      case 'paid': return '#22c55e';
      case 'pending': return '#f59e0b';
      case 'overdue': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'paid': return 'Paid';
      case 'pending': return 'Pending';
      case 'overdue': return 'Overdue';
      default: return 'Unknown';
    }
  };

  const branchLabel = userBranch ? `Branch ${userBranch}` : 'All Branches';

  // ===== PAGINATION =====
  const totalPages = reportData ? Math.ceil(reportData.accounts.length / itemsPerPage) : 0;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentAccounts = reportData ? reportData.accounts.slice(startIndex, startIndex + itemsPerPage) : [];

  // ===== STATS CARDS =====
  const stats = reportData ? [
    { label: 'Total Accounts', value: reportData.totalAccounts, icon: Users, color: '#1E1B4B' },
    { label: 'Total Recovery', value: `PKR ${reportData.totalRecovery.toLocaleString()}`, icon: DollarSign, color: '#C9A84C' },
    { label: 'Total Commission', value: `PKR ${reportData.totalCommission.toLocaleString()}`, icon: Award, color: '#2563eb' },
    { label: 'Paid Accounts', value: reportData.paidAccounts, icon: CheckCircle, color: '#22c55e' },
    { label: 'Pending Accounts', value: reportData.pendingAccounts, icon: AlertCircle, color: '#f59e0b' },
    { label: 'Overdue Accounts', value: reportData.overdueAccounts, icon: AlertTriangle, color: '#dc2626' },
  ] : [];

  // ===== TIME FILTER OPTIONS =====
  const timeFilterOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' },
  ];

  const statusFilterOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'paid', label: 'Paid' },
    { value: 'pending', label: 'Pending' },
    { value: 'overdue', label: 'Overdue' },
  ];

  return (
    <div className="employee-performance-container">
      {/* ===== HEADER ===== */}
      <div className="performance-header">
        <div className="header-left">
          <div className="header-title-group">
            <h2>Employee Performance Report</h2>
            <span className="live-badge">
              <TrendingUp size={12} /> Live
            </span>
          </div>
          <div className="branch-label">
            <Building size={14} />
            <span>{branchLabel}</span>
          </div>
          <p className="subtitle">Select an employee to view their performance report</p>
        </div>
        {selectedEmployee && reportData && (
          <button className="btn-export" onClick={exportReport}>
            <Download size={18} />
            Export Report
          </button>
        )}
      </div>

      {/* ===== SEARCH DROPDOWN ===== */}
      <div className="search-dropdown-container">
        <div className="search-dropdown-wrapper">
          <div className="search-input-wrapper" onClick={() => setShowDropdown(!showDropdown)}>
            <Search size={18} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search employee by name..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowDropdown(true);
                if (e.target.value === '') {
                  setSelectedEmployee(null);
                  setReportData(null);
                }
              }}
              onFocus={() => setShowDropdown(true)}
            />
            {selectedEmployee && (
              <button 
                className="clear-selection"
                onClick={(e) => {
                  e.stopPropagation();
                  setSearchTerm('');
                  setSelectedEmployee(null);
                  setReportData(null);
                  setShowDropdown(false);
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {showDropdown && filteredEmployees.length > 0 && (
            <div className="dropdown-list">
              {filteredEmployees.map((emp) => (
                <div
                  key={emp.id}
                  className={`dropdown-item ${selectedEmployee?.id === emp.id ? 'selected' : ''}`}
                  onClick={() => handleSelectEmployee(emp)}
                >
                  <div className="dropdown-item-left">
                    <div className="emp-avatar">{emp.name.charAt(0)}</div>
                    <div className="emp-info">
                      <span className="emp-name">{emp.name}</span>
                      <span className="emp-role">{emp.role}</span>
                    </div>
                  </div>
                  <span className="emp-branch">Branch {emp.branch}</span>
                </div>
              ))}
            </div>
          )}

          {showDropdown && filteredEmployees.length === 0 && searchTerm && (
            <div className="dropdown-list no-results">
              <div className="no-results-content">
                <AlertCircle size={24} />
                <p>No employees found</p>
                <span>Try searching with a different name</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== FILTERS SECTION ===== */}
      {selectedEmployee && reportData && (
        <div className="filters-section">
          <div className="filters-header">
            <Filter size={18} className="filter-icon" />
            <span className="filters-title">Filters</span>
          </div>
          <div className="filters-row">
            <div className="filter-group">
              <label>Time Period</label>
              <div className="filter-buttons">
                {timeFilterOptions.map((option) => (
                  <button
                    key={option.value}
                    className={`filter-btn ${timeFilter === option.value ? 'active' : ''}`}
                    onClick={() => {
                      setTimeFilter(option.value);
                      applyFilters();
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="filter-group">
              <label>Status</label>
              <div className="filter-buttons">
                {statusFilterOptions.map((option) => (
                  <button
                    key={option.value}
                    className={`filter-btn ${statusFilter === option.value ? 'active' : ''}`}
                    onClick={() => {
                      setStatusFilter(option.value);
                      applyFilters();
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="filter-results-info">
            Showing {reportData.accounts.length} of {employeePerformance[selectedEmployee.id]?.accounts.length || 0} accounts
          </div>
        </div>
      )}

      {/* ===== REPORT SECTION ===== */}
      {selectedEmployee && reportData ? (
        <div className="report-content">
          {/* ===== EMPLOYEE PROFILE ===== */}
          <div className="employee-profile">
            <div className="profile-left">
              <div className="profile-avatar">{selectedEmployee.name.charAt(0)}</div>
              <div className="profile-info">
                <h3>{selectedEmployee.name}</h3>
                <span className="profile-role">{selectedEmployee.role}</span>
                <span className="profile-branch">Branch {selectedEmployee.branch}</span>
              </div>
            </div>
            <div className="profile-right">
              <div className="profile-stat">
                <span className="profile-stat-label">Joining Date</span>
                <span className="profile-stat-value">{selectedEmployee.joiningDate}</span>
              </div>
              <div className="profile-stat">
                <span className="profile-stat-label">Total Accounts</span>
                <span className="profile-stat-value">{reportData.totalAccounts}</span>
              </div>
            </div>
          </div>

          {/* ===== STATS CARDS ===== */}
          <div className="report-stats-grid">
            {stats.map((stat, index) => (
              <div key={index} className="report-stat-card" style={{ borderTopColor: stat.color }}>
                <div className="report-stat-icon" style={{ background: `${stat.color}15`, color: stat.color }}>
                  <stat.icon size={20} />
                </div>
                <div className="report-stat-info">
                  <span className="report-stat-label">{stat.label}</span>
                  <span className="report-stat-value">{stat.value}</span>
                </div>
              </div>
            ))}
          </div>

          {/* ===== ACCOUNTS TABLE ===== */}
          <div className="accounts-table-container">
            <div className="table-header">
              <div className="table-header-left">
                <FileText size={18} />
                <h4>Account Details</h4>
                <span className="account-count">{reportData.accounts.length} accounts</span>
              </div>
              <span className="page-info-text">Page {currentPage} of {totalPages}</span>
            </div>

            <div className="table-scroll">
              <table className="accounts-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Amount (PKR)</th>
                    <th>Paid (PKR)</th>
                    <th>Balance (PKR)</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentAccounts.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="no-data">No accounts found with current filters</td>
                    </tr>
                  ) : (
                    currentAccounts.map((account, index) => {
                      const balance = account.amount - account.paid;
                      return (
                        <tr key={account.id} className={account.status === 'overdue' ? 'overdue-row' : ''}>
                          <td className="text-gray">{startIndex + index + 1}</td>
                          <td className="customer-name">{account.customer}</td>
                          <td>{account.date}</td>
                          <td>PKR {account.amount.toLocaleString()}</td>
                          <td className="paid-amount">PKR {account.paid.toLocaleString()}</td>
                          <td className={balance > 0 ? 'balance-amount' : 'paid-amount'}>
                            PKR {balance.toLocaleString()}
                          </td>
                          <td>
                            <span 
                              className={`status-badge ${account.status}`}
                              style={{ background: getStatusColor(account.status) }}
                            >
                              {getStatusLabel(account.status)}
                            </span>
                          </td>
                          <td>
                            <button 
                              className="btn-view-account" 
                              onClick={() => viewAccountDetail(account)}
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* ===== PAGINATION ===== */}
            {totalPages > 1 && (
              <div className="table-pagination">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <span>{currentPage} of {totalPages}</span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ===== NO SELECTION STATE ===== */
        <div className="no-selection-state">
          <div className="no-selection-content">
            <Users size={48} className="no-selection-icon" />
            <h3>Select an Employee</h3>
            <p>Search and select an employee from the dropdown above to view their performance report</p>
            <div className="no-selection-hint">
              <span>Available employees in {branchLabel}</span>
              <span className="hint-count">{filteredEmployees.length} employees</span>
            </div>
          </div>
        </div>
      )}

      {/* ===== ACCOUNT DETAIL MODAL ===== */}
      {showAccountModal && selectedAccount && (
        <div className="modal-overlay" onClick={() => setShowAccountModal(false)}>
          <div className="modal-content account-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-left">
                <FileText size={20} className="modal-icon" />
                <h3>Account Details</h3>
              </div>
              <button className="modal-close" onClick={() => setShowAccountModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="modal-body">
              <div className="account-detail-grid">
                <div className="account-detail-item">
                  <span>Customer</span>
                  <strong>{selectedAccount.customer}</strong>
                </div>
                <div className="account-detail-item">
                  <span>Date</span>
                  <strong>{selectedAccount.date}</strong>
                </div>
                <div className="account-detail-item">
                  <span>Total Amount</span>
                  <strong>PKR {selectedAccount.amount.toLocaleString()}</strong>
                </div>
                <div className="account-detail-item">
                  <span>Paid Amount</span>
                  <strong className="paid-amount">PKR {selectedAccount.paid.toLocaleString()}</strong>
                </div>
                <div className="account-detail-item">
                  <span>Balance</span>
                  <strong className={selectedAccount.amount - selectedAccount.paid > 0 ? 'balance-amount' : 'paid-amount'}>
                    PKR {(selectedAccount.amount - selectedAccount.paid).toLocaleString()}
                  </strong>
                </div>
                <div className="account-detail-item">
                  <span>Status</span>
                  <strong>
                    <span 
                      className={`status-badge ${selectedAccount.status}`}
                      style={{ background: getStatusColor(selectedAccount.status) }}
                    >
                      {getStatusLabel(selectedAccount.status)}
                    </span>
                  </strong>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowAccountModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeePerformanceReport;