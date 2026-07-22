// src/components/EmployeeReport/EmployeeReport.jsx

import React, { useState, useEffect } from 'react';
import { 
  Search, Users, DollarSign, Calendar, Clock, TrendingUp, TrendingDown, 
  Filter, Download, Eye, Building, Award, Fuel, Briefcase, User, 
  BarChart, LineChart, PieChart, X, Activity, CheckCircle, AlertCircle, 
  AreaChart, ChevronDown, Calendar as CalendarIcon, BookOpen
} from 'lucide-react';
import './EmployeeReport.css';
import { API_URL } from '../../../config';

const EmployeeReport = () => {
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [userBranch, setUserBranch] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [modalChartType, setModalChartType] = useState('bar');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [salaryData, setSalaryData] = useState([]);
  const [leaveData, setLeaveData] = useState([]);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setUserRole(user.role);
      setUserBranch(user.branch);
    }
    fetchData();
  }, []);

  // ============================================
  // ✅ UPDATED: fetchData using new API
  // ============================================
  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // ✅ Use new employee-report API
      const response = await fetch(`${API_URL}/employee-report`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log('Employee Report Data:', data);
      
      if (data.success) {
        const reportData = data.data;
        const employeesList = reportData.data || [];
        const summaryData = reportData.summary || {};
        
        setSummary(summaryData);
        
        const processedEmployees = employeesList.map(emp => {
          const monthlyData = emp.monthlyData || {};
          
          return {
            id: emp.id,
            name: emp.name || 'Unknown',
            email: emp.email || '',
            phone: emp.phone || '',
            branch: emp.branch_id || 1,
            role: emp.role || 'employee',
            joiningDate: emp.created_at ? new Date(emp.created_at).toISOString().split('T')[0] : 'N/A',
            salary: parseFloat(emp.salary || 0),
            monthlyData: monthlyData,
            totalAccounts: emp.totalAccounts || 0,
            totalRecovery: emp.totalRecovery || 0,
            totalCommission: emp.totalCommission || 0,
            totalLeaves: emp.totalLeaves || 0,
          };
        });
        
        setEmployees(processedEmployees);
      } else {
        console.error('API Error:', data.message);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setLoading(false);
  };

  const getUniqueMonths = () => {
    const months = new Set();
    employees.forEach(emp => {
      Object.keys(emp.monthlyData).forEach(month => {
        months.add(month);
      });
    });
    return Array.from(months).sort();
  };

  const uniqueMonths = getUniqueMonths();

  const getMonthName = (monthStr) => {
    if (monthStr === 'all') return 'All Months';
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const getCurrentMonth = () => {
    const now = new Date();
    return now.toLocaleString('default', { month: 'long' });
  };

  const currentMonth = getCurrentMonth();

  // ✅ Shared helper: builds the "YYYY-MM" key for the current month,
  // used to pull this month's slice out of an employee's monthlyData.
  const getCurrentMonthKey = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  const getFilteredEmployees = () => {
    let filtered = employees;
    if (userBranch) {
      filtered = filtered.filter(emp => emp.branch === parseInt(userBranch));
    }
    if (branchFilter !== 'all' && !userBranch) {
      filtered = filtered.filter(emp => emp.branch === parseInt(branchFilter));
    }
    if (search) {
      filtered = filtered.filter(emp => 
        emp.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    return filtered;
  };

  const filteredEmployees = getFilteredEmployees();

  const getSelectedEmployeeData = () => {
    if (selectedEmployeeId) {
      const emp = employees.find(e => e.id === selectedEmployeeId);
      return emp || null;
    }
    return null;
  };

  const selectedEmployeeData = getSelectedEmployeeData();
  const displayEmployees = selectedEmployeeData ? [selectedEmployeeData] : filteredEmployees;

  const getEmployeeChartData = (emp) => {
    const months = Object.keys(emp.monthlyData).sort();
    const data = {
      labels: months.map(m => getMonthName(m)),
      accounts: months.map(m => emp.monthlyData[m].accountsOpened || 0),
      recovery: months.map(m => emp.monthlyData[m].recoveryAmount || 0),
      commission: months.map(m => emp.monthlyData[m].commission || 0),
      leaves: months.map(m => emp.monthlyData[m].leaves || 0),
    };
    return data;
  };

  const chartTypes = [
    { id: 'bar', label: 'Bar', icon: BarChart },
    { id: 'line', label: 'Line', icon: LineChart },
    { id: 'pie', label: 'Pie', icon: PieChart },
    { id: 'area', label: 'Area', icon: Activity },
    { id: 'stacked', label: 'Stacked', icon: BarChart },
  ];

  // ===== RENDER CHART WITH LEAVES =====
  const renderEmployeeChart = () => {
    if (!selectedEmployee) return null;
    
    const empData = getEmployeeChartData(selectedEmployee);
    
    const maxAccounts = Math.max(...empData.accounts, 1);
    const maxRecovery = Math.max(...empData.recovery.map(v => v/1000), 1);
    const maxLeaves = Math.max(...empData.leaves, 1);

    const getAccountsHeight = (val) => (val / maxAccounts) * 140;
    const getRecoveryHeight = (val) => ((val/1000) / maxRecovery) * 140;
    const getLeavesHeight = (val) => (val / maxLeaves) * 140;

    if (modalChartType === 'bar') {
      return (
        <div className="modal-chart-container">
          <div className="chart-bar-container-4">
            {empData.labels.map((label, index) => (
              <div key={index} className="chart-bar-group-4">
                <div className="chart-bars-4">
                  <div className="chart-bar-wrapper-4">
                    <div 
                      className="chart-bar-4 bar-accounts" 
                      style={{ height: `${getAccountsHeight(empData.accounts[index])}px` }}
                    >
                      <span className="bar-value-4">{empData.accounts[index]}</span>
                    </div>
                    <span className="bar-label-4">Acc</span>
                  </div>
                  <div className="chart-bar-wrapper-4">
                    <div 
                      className="chart-bar-4 bar-recovery" 
                      style={{ height: `${getRecoveryHeight(empData.recovery[index])}px` }}
                    >
                      <span className="bar-value-4">{(empData.recovery[index]/1000).toFixed(1)}k</span>
                    </div>
                    <span className="bar-label-4">Rec</span>
                  </div>
                  <div className="chart-bar-wrapper-4">
                    <div 
                      className="chart-bar-4 bar-leaves" 
                      style={{ height: `${getLeavesHeight(empData.leaves[index])}px` }}
                    >
                      <span className="bar-value-4">{empData.leaves[index]}</span>
                    </div>
                    <span className="bar-label-4">Leave</span>
                  </div>
                </div>
                <div className="chart-bar-labels-4">
                  <span className="chart-label-4">{label}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="chart-legend-4">
            <span><span className="legend-dot-4 gold"></span> Accounts (max: {maxAccounts})</span>
            <span><span className="legend-dot-4 dark"></span> Recovery (max: {maxRecovery.toFixed(1)}k)</span>
            <span><span className="legend-dot-4 red"></span> Leaves (max: {maxLeaves})</span>
          </div>
        </div>
      );
    }

    if (modalChartType === 'line') {
      return (
        <div className="modal-chart-container">
          <div className="chart-line-container">
            <svg viewBox="0 0 600 220" className="chart-svg">
              {[0, 50, 100, 150, 200].map((y) => (
                <line key={y} x1="0" y1={220 - y} x2="600" y2={220 - y} stroke="#e5e7eb" strokeWidth="1" />
              ))}
              <polyline
                points={empData.accounts.map((val, i) => 
                  `${(i / (empData.accounts.length - 1)) * 600},${220 - (val / maxAccounts) * 190}`
                ).join(' ')}
                fill="none"
                stroke="#C9A84C"
                strokeWidth="3"
              />
              <polyline
                points={empData.recovery.map((val, i) => 
                  `${(i / (empData.recovery.length - 1)) * 600},${220 - ((val/1000) / maxRecovery) * 190}`
                ).join(' ')}
                fill="none"
                stroke="#1A2A4A"
                strokeWidth="3"
                strokeDasharray="5,5"
              />
              <polyline
                points={empData.leaves.map((val, i) => 
                  `${(i / (empData.leaves.length - 1)) * 600},${220 - (val / maxLeaves) * 190}`
                ).join(' ')}
                fill="none"
                stroke="#dc2626"
                strokeWidth="3"
                strokeDasharray="2,4"
              />
              {empData.labels.map((label, i) => (
                <text key={i} x={(i / (empData.labels.length - 1)) * 600} y="215" fontSize="10" fill="#6b7280" textAnchor="middle">{label}</text>
              ))}
            </svg>
            <div className="chart-legend-4">
              <span><span className="legend-dot-4 gold"></span> Accounts</span>
              <span><span className="legend-dot-4 dark"></span> Recovery (PKR'000)</span>
              <span><span className="legend-dot-4 red"></span> Leaves</span>
            </div>
          </div>
        </div>
      );
    }

    if (modalChartType === 'pie') {
      const totalAccounts = empData.accounts.reduce((a, b) => a + b, 0);
      const totalRecovery = empData.recovery.reduce((a, b) => a + b, 0);
      const totalLeaves = empData.leaves.reduce((a, b) => a + b, 0);
      const pieData = [
        { label: 'Total Accounts', value: totalAccounts, color: '#C9A84C' },
        { label: 'Total Recovery', value: totalRecovery / 1000, color: '#1A2A4A' },
        { label: 'Total Leaves', value: totalLeaves, color: '#dc2626' },
      ];
      const total = pieData.reduce((a, b) => a + b.value, 0);
      let cumulative = 0;

      return (
        <div className="modal-chart-container">
          <div className="chart-pie-container">
            <div className="pie-chart">
              <svg viewBox="0 0 220 220">
                {pieData.map((item, index) => {
                  const percentage = (item.value / total) * 100;
                  const dashArray = (percentage / 100) * 534.07;
                  const offset = cumulative;
                  cumulative += dashArray;
                  return (
                    <circle
                      key={index}
                      cx="110" cy="110" r="85"
                      fill="none"
                      stroke={item.color}
                      strokeWidth="45"
                      strokeDasharray={`${dashArray} 534.07`}
                      strokeDashoffset={`-${offset}`}
                      transform="rotate(-90 110 110)"
                    />
                  );
                })}
                <text x="110" y="100" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#0A1628">
                  Total
                </text>
                <text x="110" y="118" textAnchor="middle" fontSize="10" fill="#6b7280">
                  {totalAccounts} Acc
                </text>
                <text x="110" y="132" textAnchor="middle" fontSize="10" fill="#6b7280">
                  {(totalRecovery/1000).toFixed(1)}k Rec
                </text>
                <text x="110" y="146" textAnchor="middle" fontSize="10" fill="#dc2626">
                  {totalLeaves} Leaves
                </text>
              </svg>
            </div>
            <div className="chart-legend-4">
              <span><span className="legend-dot-4 gold"></span> Accounts ({totalAccounts})</span>
              <span><span className="legend-dot-4 dark"></span> Recovery ({(totalRecovery/1000).toFixed(1)}k)</span>
              <span><span className="legend-dot-4 red"></span> Leaves ({totalLeaves})</span>
            </div>
          </div>
        </div>
      );
    }

    if (modalChartType === 'area') {
      return (
        <div className="modal-chart-container">
          <div className="chart-area-container-custom">
            <svg viewBox="0 0 600 220" className="chart-svg">
              <polygon
                points={`0,220 ${empData.accounts.map((val, i) => 
                  `${(i / (empData.accounts.length - 1)) * 600},${220 - (val / maxAccounts) * 190}`
                ).join(' ')} 600,220`}
                fill="rgba(201, 168, 76, 0.3)"
                stroke="#C9A84C"
                strokeWidth="2"
              />
              <polygon
                points={`0,220 ${empData.recovery.map((val, i) => 
                  `${(i / (empData.recovery.length - 1)) * 600},${220 - ((val/1000) / maxRecovery) * 190}`
                ).join(' ')} 600,220`}
                fill="rgba(26, 42, 74, 0.3)"
                stroke="#1A2A4A"
                strokeWidth="2"
              />
              <polygon
                points={`0,220 ${empData.leaves.map((val, i) => 
                  `${(i / (empData.leaves.length - 1)) * 600},${220 - (val / maxLeaves) * 190}`
                ).join(' ')} 600,220`}
                fill="rgba(220, 38, 38, 0.25)"
                stroke="#dc2626"
                strokeWidth="2"
              />
              {empData.labels.map((label, i) => (
                <text key={i} x={(i / (empData.labels.length - 1)) * 600} y="215" fontSize="10" fill="#6b7280" textAnchor="middle">{label}</text>
              ))}
            </svg>
            <div className="chart-legend-4">
              <span><span className="legend-dot-4 gold"></span> Accounts</span>
              <span><span className="legend-dot-4 dark"></span> Recovery (PKR'000)</span>
              <span><span className="legend-dot-4 red"></span> Leaves</span>
            </div>
          </div>
        </div>
      );
    }

    if (modalChartType === 'stacked') {
      return (
        <div className="modal-chart-container">
          <div className="chart-stacked-container-4">
            {empData.labels.map((label, index) => {
              const accH = getAccountsHeight(empData.accounts[index]);
              const recH = getRecoveryHeight(empData.recovery[index]);
              const leaveH = getLeavesHeight(empData.leaves[index]);
              return (
                <div key={index} className="stacked-bar-group-4">
                  <div className="stacked-bar-wrapper-4">
                    <div 
                      className="stacked-bar-4 rec-bar-4" 
                      style={{ height: `${recH}px` }}
                    >
                      <span className="stacked-value-4">{(empData.recovery[index]/1000).toFixed(1)}k</span>
                    </div>
                    <div 
                      className="stacked-bar-4 leave-bar-4" 
                      style={{ height: `${leaveH}px` }}
                    >
                      <span className="stacked-value-4">{empData.leaves[index]}</span>
                    </div>
                    <div 
                      className="stacked-bar-4 acc-bar-4" 
                      style={{ height: `${accH}px` }}
                    >
                      <span className="stacked-value-4">{empData.accounts[index]}</span>
                    </div>
                  </div>
                  <span className="stacked-label-4">{label}</span>
                </div>
              );
            })}
          </div>
          <div className="chart-legend-4">
            <span><span className="legend-dot-4 gold"></span> Accounts</span>
            <span><span className="legend-dot-4 dark"></span> Recovery (PKR'000)</span>
            <span><span className="legend-dot-4 red"></span> Leaves</span>
          </div>
        </div>
      );
    }

    return null;
  };

  const openDetailModal = (emp) => {
    setSelectedEmployee(emp);
    setModalChartType('bar');
    setShowDetailModal(true);
  };

  const closeModal = () => {
    setShowDetailModal(false);
    setSelectedEmployee(null);
  };

  const exportReport = () => {
    alert('Report exported successfully!');
  };

  const branchLabel = userBranch ? `Branch ${userBranch}` : 'All Branches';

  const totalRecovery = displayEmployees.reduce((sum, e) => sum + e.totalRecovery, 0);
  const totalCommission = displayEmployees.reduce((sum, e) => sum + e.totalCommission, 0);
  const totalAccounts = displayEmployees.reduce((sum, e) => sum + e.totalAccounts, 0);
  const totalLeaves = displayEmployees.reduce((sum, e) => sum + e.totalLeaves, 0);
  const totalEmployees = displayEmployees.length;

  const getCurrentMonthAccounts = (emp) => {
    const key = getCurrentMonthKey();
    return emp.monthlyData[key]?.accountsOpened || 0;
  };

  // ✅ NEW: same idea as getCurrentMonthAccounts, but for leaves —
  // pulls this employee's leave count for the current month only.
  const getCurrentMonthLeaves = (emp) => {
    const key = getCurrentMonthKey();
    return emp.monthlyData[key]?.leaves || 0;
  };

  const getEmployeeStats = (emp) => {
    const currentAccounts = getCurrentMonthAccounts(emp);
    const currentLeaves = getCurrentMonthLeaves(emp);
    const monthlyRecovery = emp.monthlyData[getCurrentMonthKey()]?.recoveryAmount || 0;

    return [
      { label: 'Total Accounts', value: emp.totalAccounts, color: '#1E1B4B' },
      { label: `New Accounts (${currentMonth})`, value: currentAccounts, color: '#2563eb' },
      { label: 'Monthly Recovery', value: `PKR ${monthlyRecovery.toLocaleString()}`, color: '#C9A84C' },
      { label: `Leaves (${currentMonth})`, value: currentLeaves, color: '#dc2626' },
      { label: 'Salary', value: `PKR ${emp.salary.toLocaleString()}`, color: '#065f46' },
      { label: 'Total Commission', value: `PKR ${emp.totalCommission.toLocaleString()}`, color: '#8B5CF6' },
    ];
  };

  const isEmployee = userRole === 'employee';

  const summaryCards = isEmployee ? [
    { label: 'Total Accounts', value: totalAccounts, icon: Briefcase, color: '#1E1B4B', bg: 'rgba(30,27,75,0.08)', className: 'accounts' },
    { label: 'Recovery Due', value: `PKR ${totalRecovery.toLocaleString()}`, icon: DollarSign, color: '#C9A84C', bg: 'rgba(201,168,76,0.12)', className: 'recovery' },
    { label: 'Total Leaves', value: totalLeaves, icon: Calendar, color: '#dc2626', bg: 'rgba(220,38,38,0.1)', className: 'leaves' },
  ] : [
    { label: 'Total Employees', value: totalEmployees, icon: Users, color: '#1E1B4B', bg: 'rgba(30,27,75,0.08)', className: 'users' },
    { label: 'Total Recovery', value: `PKR ${totalRecovery.toLocaleString()}`, icon: DollarSign, color: '#C9A84C', bg: 'rgba(201,168,76,0.12)', className: 'recovery' },
    { label: 'Total Commission', value: `PKR ${totalCommission.toLocaleString()}`, icon: Award, color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)', className: 'commission' },
    { label: 'Total Accounts', value: totalAccounts, icon: Briefcase, color: '#2563eb', bg: 'rgba(37,99,235,0.1)', className: 'accounts' },
    { label: 'Total Leaves', value: totalLeaves, icon: Calendar, color: '#dc2626', bg: 'rgba(220,38,38,0.1)', className: 'leaves' },
  ];

  const getEmployeeName = (id) => {
    const emp = employees.find(e => e.id === id);
    return emp ? emp.name : 'Select Employee';
  };

  if (loading) {
    return (
      <div className="employee-report-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading employee data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="employee-report-container">
      {/* Header */}
      <div className="report-header">
        <div className="header-left">
          <div className="header-title-group">
            <h2>Employee Report</h2>
            <span className="live-badge">
              <Activity size={12} /> Live
            </span>
          </div>
          {userBranch && (
            <div className="branch-label">
              <Building size={14} />
              <span>{branchLabel}</span>
            </div>
          )}
        </div>
        <button className="btn-export" onClick={exportReport}>
          <Download size={18} />
          Export Report
        </button>
      </div>

      {/* Dropdown */}
      {!isEmployee && (
        <div className="employee-dropdown-wrapper">
          <div 
            className="employee-dropdown-toggle"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <span>{selectedEmployeeId ? getEmployeeName(selectedEmployeeId) : 'Select Employee...'}</span>
            <ChevronDown size={18} />
          </div>
          {showDropdown && (
            <div className="employee-dropdown-list">
              <div 
                className={`dropdown-item ${!selectedEmployeeId ? 'active' : ''}`}
                onClick={() => {
                  setSelectedEmployeeId(null);
                  setShowDropdown(false);
                }}
              >
                All Employees
              </div>
              {filteredEmployees.map(emp => (
                <div 
                  key={emp.id}
                  className={`dropdown-item ${selectedEmployeeId === emp.id ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedEmployeeId(emp.id);
                    setShowDropdown(false);
                  }}
                >
                  <div className="dropdown-emp-info">
                    <div className="dropdown-emp-avatar">{emp.name.charAt(0)}</div>
                    <span>{emp.name}</span>
                  </div>
                  <span className="dropdown-role">{emp.role}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Controls */}
      {!isEmployee && !selectedEmployeeId && (
        <div className="report-controls">
          <div className="search-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search employee..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {!userBranch && (
            <div className="branch-filters">
              <button className={`filter-btn ${branchFilter === 'all' ? 'active' : ''}`} onClick={() => setBranchFilter('all')}>All</button>
              <button className={`filter-btn branch-1 ${branchFilter === '1' ? 'active' : ''}`} onClick={() => setBranchFilter('1')}>Branch 1</button>
              <button className={`filter-btn branch-2 ${branchFilter === '2' ? 'active' : ''}`} onClick={() => setBranchFilter('2')}>Branch 2</button>
            </div>
          )}
        </div>
      )}

      {/* Selected Employee */}
      {!isEmployee && selectedEmployeeId && (
        <div className="selected-employee-info">
          <div className="selected-employee-avatar">
            {employees.find(e => e.id === selectedEmployeeId)?.name.charAt(0)}
          </div>
          <div className="selected-employee-details">
            <span className="selected-employee-name">
              {employees.find(e => e.id === selectedEmployeeId)?.name}
            </span>
            <span className="selected-employee-role">
              {employees.find(e => e.id === selectedEmployeeId)?.role} • Branch {employees.find(e => e.id === selectedEmployeeId)?.branch}
            </span>
          </div>
        </div>
      )}

      {/* Summary Cards - Colorful */}
      <div className={`summary-cards ${isEmployee ? 'employee-cards' : ''}`}>
        {summaryCards.map((card, index) => (
          <div 
            key={index} 
            className="summary-card" 
            style={{ 
              borderTop: `4px solid ${card.color}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}
          >
            <div className={`summary-icon ${card.className}`} style={{ background: card.bg, color: card.color }}>
              <card.icon size={20} />
            </div>
            <div className="summary-info">
              <span className="summary-label" style={{ fontWeight: 700 }}>{card.label}</span>
              <span className="summary-value" style={{ fontWeight: 800, fontSize: '1.2rem' }}>{card.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="employee-table-wrap">
        <div className="table-header-bar">
          <div className="table-header-left">
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Employee Performance</span>
            <span className="record-count" style={{ fontWeight: 600 }}>{displayEmployees.length} records</span>
          </div>
        </div>
        <div className="table-scroll">
          <table className="employee-report-table">
            <thead>
              <tr>
                <th style={{ fontWeight: 800 }}>#</th>
                <th style={{ fontWeight: 800 }}>Employee</th>
                <th style={{ fontWeight: 800 }}>Accounts</th>
                <th style={{ fontWeight: 800 }}>Recovery</th>
                <th style={{ fontWeight: 800 }}>Commission</th>
                <th style={{ fontWeight: 800 }}>Leaves ({currentMonth})</th>
                <th style={{ fontWeight: 800 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayEmployees.length === 0 ? (
                <tr>
                  <td colSpan="7" className="no-data">
                    <div className="no-data-content">
                      <AlertCircle size={24} />
                      <p>No employees found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                displayEmployees.map((emp, index) => {
                  const currentLeaves = getCurrentMonthLeaves(emp);
                  return (
                    <tr key={emp.id} className={index % 2 === 0 ? 'even-row' : 'odd-row'}>
                      <td className="text-gray" style={{ fontWeight: 600 }}>{index + 1}</td>
                      <td>
                        <div className="emp-name-cell">
                          <div className="emp-avatar" style={{ background: '#ede9fe', color: '#1E1B4B', fontWeight: 700 }}>
                            {emp.name.charAt(0)}
                          </div>
                          {emp.name}
                        </div>
                      </td>
                      <td className="highlight-number" style={{ fontWeight: 800, color: '#1E1B4B' }}>{emp.totalAccounts}</td>
                      <td style={{ fontWeight: 600 }}>PKR {emp.totalRecovery.toLocaleString()}</td>
                      <td style={{ fontWeight: 600 }}>PKR {emp.totalCommission.toLocaleString()}</td>
                      <td style={{ fontWeight: 600, color: currentLeaves > 2 ? '#dc2626' : '#1a1a2e' }}>{currentLeaves}</td>
                      <td>
                        <button className="btn-view-detail" onClick={() => openDetailModal(emp)} style={{ fontWeight: 700 }}>
                          <Eye size={15} />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showDetailModal && selectedEmployee && (
        <div className="empreport-modal-overlay" onClick={closeModal}>
          <div className="empreport-modal-content empreport-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="empreport-modal-header">
              <div className="empreport-modal-header-left">
                <User size={20} className="empreport-modal-icon" />
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Employee Report - {selectedEmployee.name}</h3>
              </div>
              <button className="empreport-modal-close" onClick={closeModal}>
                <X size={24} />
              </button>
            </div>

            <div className="empreport-modal-body">
              <div className="employee-detail-header">
                <div className="emp-detail-avatar" style={{ background: '#1E1B4B', fontSize: '1.5rem', fontWeight: 800 }}>
                  {selectedEmployee.name.charAt(0)}
                </div>
                <div className="emp-detail-info">
                  <h4 style={{ fontSize: '1.3rem', fontWeight: 700 }}>{selectedEmployee.name}</h4>
                  <span className="emp-detail-branch" style={{ fontSize: '0.95rem', fontWeight: 600 }}>Branch {selectedEmployee.branch} • {selectedEmployee.role}</span>
                  <span className="emp-detail-joining" style={{ fontSize: '0.85rem', fontWeight: 500 }}>Joined: {selectedEmployee.joiningDate}</span>
                </div>
              </div>

              {/* 6 Cards - Colorful */}
              <div className="detail-summary-6">
                {getEmployeeStats(selectedEmployee).map((stat, index) => (
                  <div 
                    key={index} 
                    className="detail-summary-item" 
                    style={{ 
                      borderTop: `4px solid ${stat.color}`,
                      background: stat.color + '08'
                    }}
                  >
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#6b7280' }}>{stat.label}</span>
                    <strong style={{ fontSize: '1rem', fontWeight: 800, color: stat.color }}>{stat.value}</strong>
                  </div>
                ))}
              </div>

              {/* Chart Section */}
              <div className="modal-chart-section">
                <div className="modal-chart-header">
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Performance Trend (Self-Comparison)</h4>
                  <div className="modal-chart-type-selector">
                    {chartTypes.map((type) => (
                      <button
                        key={type.id}
                        className={`modal-chart-type-btn ${modalChartType === type.id ? 'active' : ''}`}
                        onClick={() => setModalChartType(type.id)}
                        style={{ fontWeight: 600 }}
                      >
                        <type.icon size={14} />
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>
                {renderEmployeeChart()}
              </div>

              {/* Monthly Breakdown */}
              <div className="monthly-breakdown">
                <div className="monthly-header">
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Monthly Breakdown</h4>
                  <span className="monthly-count" style={{ fontWeight: 600 }}>{Object.keys(selectedEmployee.monthlyData).length} months</span>
                </div>
                <div className="monthly-scroll">
                  <table className="monthly-table">
                    <thead>
                      <tr>
                        <th style={{ fontWeight: 800 }}>Month</th>
                        <th style={{ fontWeight: 800 }}>Accounts</th>
                        <th style={{ fontWeight: 800 }}>Recovery</th>
                        <th style={{ fontWeight: 800 }}>Commission</th>
                        <th style={{ fontWeight: 800 }}>Leaves</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(selectedEmployee.monthlyData).map(([month, data]) => (
                        <tr key={month}>
                          <td className="month-name" style={{ fontWeight: 600 }}>{getMonthName(month)}</td>
                          <td className="month-accounts" style={{ fontWeight: 700, color: '#1E1B4B' }}>{data.accountsOpened}</td>
                          <td style={{ fontWeight: 600 }}>PKR {data.recoveryAmount.toLocaleString()}</td>
                          <td style={{ fontWeight: 600 }}>PKR {data.commission.toLocaleString()}</td>
                          <td style={{ fontWeight: 600, color: data.leaves > 2 ? '#dc2626' : '#1a1a2e' }}>{data.leaves}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="empreport-modal-footer">
              <button className="empreport-btn-cancel" onClick={closeModal} style={{ fontWeight: 700 }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeReport;