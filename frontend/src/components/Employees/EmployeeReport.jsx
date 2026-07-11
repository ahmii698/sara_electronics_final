import React, { useState, useEffect } from 'react';
import { Search, Users, DollarSign, Calendar, Clock, TrendingUp, TrendingDown, Filter, Download, Eye, Building, Award, Fuel, Briefcase, User, BarChart, LineChart, PieChart, X, Activity, CheckCircle, AlertCircle, AreaChart, ChevronDown } from 'lucide-react';
import './EmployeeReport.css';

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

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setUserRole(user.role);
      setUserBranch(user.branch);
    }
  }, []);

  const [employees, setEmployees] = useState([
    {
      id: 1,
      name: 'Ahmed Khan',
      branch: 1,
      role: 'employee',
      joiningDate: '2025-01-15',
      salary: 45000,
      monthlyData: {
        '2026-01': { accountsOpened: 12, recoveryAmount: 45000, leaves: 2, commission: 24000, fuelExpense: 1500, extraEarnings: 5000, overdueAccounts: 3 },
        '2026-02': { accountsOpened: 15, recoveryAmount: 52000, leaves: 1, commission: 30000, fuelExpense: 1800, extraEarnings: 7000, overdueAccounts: 2 },
        '2026-03': { accountsOpened: 10, recoveryAmount: 38000, leaves: 3, commission: 20000, fuelExpense: 1200, extraEarnings: 3000, overdueAccounts: 4 },
        '2026-04': { accountsOpened: 18, recoveryAmount: 65000, leaves: 0, commission: 36000, fuelExpense: 2000, extraEarnings: 8000, overdueAccounts: 1 },
        '2026-05': { accountsOpened: 14, recoveryAmount: 48000, leaves: 2, commission: 28000, fuelExpense: 1600, extraEarnings: 4500, overdueAccounts: 2 },
        '2026-06': { accountsOpened: 20, recoveryAmount: 72000, leaves: 1, commission: 40000, fuelExpense: 2200, extraEarnings: 10000, overdueAccounts: 0 },
      },
      totalAccounts: 89,
      totalRecovery: 320000,
      totalCommission: 178000,
      totalLeaves: 9,
      totalFuel: 10300,
      totalExtra: 37500,
    },
    {
      id: 2,
      name: 'Sara Ali',
      branch: 2,
      role: 'manager',
      joiningDate: '2025-03-01',
      salary: 38000,
      monthlyData: {
        '2026-01': { accountsOpened: 8, recoveryAmount: 32000, leaves: 1, commission: 16000, fuelExpense: 1000, extraEarnings: 2000, overdueAccounts: 1 },
        '2026-02': { accountsOpened: 10, recoveryAmount: 40000, leaves: 2, commission: 20000, fuelExpense: 1300, extraEarnings: 3500, overdueAccounts: 2 },
        '2026-03': { accountsOpened: 12, recoveryAmount: 45000, leaves: 0, commission: 24000, fuelExpense: 1500, extraEarnings: 4000, overdueAccounts: 0 },
        '2026-04': { accountsOpened: 9, recoveryAmount: 35000, leaves: 3, commission: 18000, fuelExpense: 1100, extraEarnings: 2500, overdueAccounts: 3 },
        '2026-05': { accountsOpened: 11, recoveryAmount: 42000, leaves: 1, commission: 22000, fuelExpense: 1400, extraEarnings: 3000, overdueAccounts: 1 },
        '2026-06': { accountsOpened: 15, recoveryAmount: 55000, leaves: 0, commission: 30000, fuelExpense: 1800, extraEarnings: 5000, overdueAccounts: 0 },
      },
      totalAccounts: 65,
      totalRecovery: 249000,
      totalCommission: 130000,
      totalLeaves: 7,
      totalFuel: 8100,
      totalExtra: 20000,
    },
    {
      id: 3,
      name: 'Usman Malik',
      branch: 1,
      role: 'employee',
      joiningDate: '2025-06-01',
      salary: 52000,
      monthlyData: {
        '2026-01': { accountsOpened: 5, recoveryAmount: 18000, leaves: 4, commission: 10000, fuelExpense: 800, extraEarnings: 1000, overdueAccounts: 5 },
        '2026-02': { accountsOpened: 7, recoveryAmount: 25000, leaves: 2, commission: 14000, fuelExpense: 1000, extraEarnings: 2000, overdueAccounts: 3 },
        '2026-03': { accountsOpened: 8, recoveryAmount: 28000, leaves: 3, commission: 16000, fuelExpense: 1100, extraEarnings: 2500, overdueAccounts: 4 },
        '2026-04': { accountsOpened: 10, recoveryAmount: 35000, leaves: 1, commission: 20000, fuelExpense: 1300, extraEarnings: 3000, overdueAccounts: 2 },
        '2026-05': { accountsOpened: 6, recoveryAmount: 20000, leaves: 5, commission: 12000, fuelExpense: 900, extraEarnings: 1500, overdueAccounts: 6 },
        '2026-06': { accountsOpened: 9, recoveryAmount: 30000, leaves: 2, commission: 18000, fuelExpense: 1200, extraEarnings: 2500, overdueAccounts: 3 },
      },
      totalAccounts: 45,
      totalRecovery: 156000,
      totalCommission: 90000,
      totalLeaves: 17,
      totalFuel: 6300,
      totalExtra: 12500,
    },
    {
      id: 4,
      name: 'Fatima Noor',
      branch: 2,
      role: 'employee',
      joiningDate: '2025-08-01',
      salary: 41000,
      monthlyData: {
        '2026-01': { accountsOpened: 6, recoveryAmount: 22000, leaves: 2, commission: 12000, fuelExpense: 900, extraEarnings: 1500, overdueAccounts: 2 },
        '2026-02': { accountsOpened: 8, recoveryAmount: 28000, leaves: 1, commission: 16000, fuelExpense: 1100, extraEarnings: 2000, overdueAccounts: 1 },
        '2026-03': { accountsOpened: 11, recoveryAmount: 42000, leaves: 0, commission: 22000, fuelExpense: 1500, extraEarnings: 3500, overdueAccounts: 0 },
        '2026-04': { accountsOpened: 7, recoveryAmount: 25000, leaves: 3, commission: 14000, fuelExpense: 1000, extraEarnings: 2000, overdueAccounts: 3 },
        '2026-05': { accountsOpened: 9, recoveryAmount: 32000, leaves: 2, commission: 18000, fuelExpense: 1200, extraEarnings: 2500, overdueAccounts: 2 },
        '2026-06': { accountsOpened: 12, recoveryAmount: 48000, leaves: 0, commission: 24000, fuelExpense: 1600, extraEarnings: 4000, overdueAccounts: 0 },
      },
      totalAccounts: 53,
      totalRecovery: 197000,
      totalCommission: 106000,
      totalLeaves: 8,
      totalFuel: 7300,
      totalExtra: 15500,
    },
  ]);

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

  const getFilteredEmployees = () => {
    let filtered = employees;
    if (userBranch) {
      filtered = filtered.filter(emp => emp.branch === parseInt(userBranch));
    }
    if (branchFilter !== 'all' && !userBranch) {
      filtered = filtered.filter(emp => emp.branch === parseInt(branchFilter));
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
      accounts: months.map(m => emp.monthlyData[m].accountsOpened),
      recovery: months.map(m => emp.monthlyData[m].recoveryAmount),
      commission: months.map(m => emp.monthlyData[m].commission),
      overdue: months.map(m => emp.monthlyData[m].overdueAccounts || 0),
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

  // ===== RENDER CHART WITH 3 BARS (Accounts, Recovery, Overdue) - FIXED =====
  const renderEmployeeChart = () => {
    if (!selectedEmployee) return null;
    
    const empData = getEmployeeChartData(selectedEmployee);
    
    // ALAG ALAG MAX VALUES
    const maxAccounts = Math.max(...empData.accounts, 1);
    const maxRecovery = Math.max(...empData.recovery.map(v => v/1000), 1);
    const maxOverdue = Math.max(...empData.overdue, 1);

    // HAR CHEEZ KA APNA HEIGHT CALCULATION
    const getAccountsHeight = (val) => (val / maxAccounts) * 140;
    const getRecoveryHeight = (val) => ((val/1000) / maxRecovery) * 140;
    const getOverdueHeight = (val) => (val / maxOverdue) * 140;

    if (modalChartType === 'bar') {
      return (
        <div className="modal-chart-container">
          <div className="chart-bar-container-3">
            {empData.labels.map((label, index) => (
              <div key={index} className="chart-bar-group-3">
                <div className="chart-bars-3">
                  {/* Accounts Bar - Gold */}
                  <div className="chart-bar-wrapper-3">
                    <div 
                      className="chart-bar-3 bar-accounts" 
                      style={{ height: `${getAccountsHeight(empData.accounts[index])}px` }}
                    >
                      <span className="bar-value-3">{empData.accounts[index]}</span>
                    </div>
                    <span className="bar-label-3">Acc</span>
                  </div>
                  {/* Recovery Bar - Dark */}
                  <div className="chart-bar-wrapper-3">
                    <div 
                      className="chart-bar-3 bar-recovery" 
                      style={{ height: `${getRecoveryHeight(empData.recovery[index])}px` }}
                    >
                      <span className="bar-value-3">{(empData.recovery[index]/1000).toFixed(1)}k</span>
                    </div>
                    <span className="bar-label-3">Rec</span>
                  </div>
                  {/* Overdue Bar - Red */}
                  <div className="chart-bar-wrapper-3">
                    <div 
                      className="chart-bar-3 bar-overdue" 
                      style={{ height: `${getOverdueHeight(empData.overdue[index])}px` }}
                    >
                      <span className="bar-value-3">{empData.overdue[index]}</span>
                    </div>
                    <span className="bar-label-3">OD</span>
                  </div>
                </div>
                <div className="chart-bar-labels-3">
                  <span className="chart-label-3">{label}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="chart-legend-3">
            <span><span className="legend-dot-3 gold"></span> Accounts (max: {maxAccounts})</span>
            <span><span className="legend-dot-3 dark"></span> Recovery (max: {maxRecovery.toFixed(1)}k)</span>
            <span><span className="legend-dot-3 red"></span> Overdue (max: {maxOverdue})</span>
          </div>
        </div>
      );
    }

    // Line chart - ab alag scales se
    if (modalChartType === 'line') {
      return (
        <div className="modal-chart-container">
          <div className="chart-line-container">
            <svg viewBox="0 0 600 220" className="chart-svg">
              {[0, 50, 100, 150, 200].map((y) => (
                <line key={y} x1="0" y1={220 - y} x2="600" y2={220 - y} stroke="#e5e7eb" strokeWidth="1" />
              ))}
              {/* Accounts Line - Gold */}
              <polyline
                points={empData.accounts.map((val, i) => 
                  `${(i / (empData.accounts.length - 1)) * 600},${220 - (val / maxAccounts) * 190}`
                ).join(' ')}
                fill="none"
                stroke="#C9A84C"
                strokeWidth="3"
              />
              {/* Recovery Line - Dark */}
              <polyline
                points={empData.recovery.map((val, i) => 
                  `${(i / (empData.recovery.length - 1)) * 600},${220 - ((val/1000) / maxRecovery) * 190}`
                ).join(' ')}
                fill="none"
                stroke="#1A2A4A"
                strokeWidth="3"
                strokeDasharray="5,5"
              />
              {/* Overdue Line - Red */}
              <polyline
                points={empData.overdue.map((val, i) => 
                  `${(i / (empData.overdue.length - 1)) * 600},${220 - (val / maxOverdue) * 190}`
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
            <div className="chart-legend-3">
              <span><span className="legend-dot-3 gold"></span> Accounts</span>
              <span><span className="legend-dot-3 dark"></span> Recovery (PKR'000)</span>
              <span><span className="legend-dot-3 red"></span> Overdue</span>
            </div>
          </div>
        </div>
      );
    }

    // Pie chart
    if (modalChartType === 'pie') {
      const totalAccounts = empData.accounts.reduce((a, b) => a + b, 0);
      const totalRecovery = empData.recovery.reduce((a, b) => a + b, 0);
      const totalOverdue = empData.overdue.reduce((a, b) => a + b, 0);
      const pieData = [
        { label: 'Total Accounts', value: totalAccounts, color: '#C9A84C' },
        { label: 'Total Recovery', value: totalRecovery / 1000, color: '#1A2A4A' },
        { label: 'Total Overdue', value: totalOverdue, color: '#dc2626' },
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
                  {totalOverdue} OD
                </text>
              </svg>
            </div>
            <div className="chart-legend-3">
              <span><span className="legend-dot-3 gold"></span> Accounts ({totalAccounts})</span>
              <span><span className="legend-dot-3 dark"></span> Recovery ({(totalRecovery/1000).toFixed(1)}k)</span>
              <span><span className="legend-dot-3 red"></span> Overdue ({totalOverdue})</span>
            </div>
          </div>
        </div>
      );
    }

    // Area chart
    if (modalChartType === 'area') {
      return (
        <div className="modal-chart-container">
          <div className="chart-area-container-custom">
            <svg viewBox="0 0 600 220" className="chart-svg">
              {/* Accounts Area */}
              <polygon
                points={`0,220 ${empData.accounts.map((val, i) => 
                  `${(i / (empData.accounts.length - 1)) * 600},${220 - (val / maxAccounts) * 190}`
                ).join(' ')} 600,220`}
                fill="rgba(201, 168, 76, 0.3)"
                stroke="#C9A84C"
                strokeWidth="2"
              />
              {/* Recovery Area */}
              <polygon
                points={`0,220 ${empData.recovery.map((val, i) => 
                  `${(i / (empData.recovery.length - 1)) * 600},${220 - ((val/1000) / maxRecovery) * 190}`
                ).join(' ')} 600,220`}
                fill="rgba(26, 42, 74, 0.3)"
                stroke="#1A2A4A"
                strokeWidth="2"
              />
              {/* Overdue Area */}
              <polygon
                points={`0,220 ${empData.overdue.map((val, i) => 
                  `${(i / (empData.overdue.length - 1)) * 600},${220 - (val / maxOverdue) * 190}`
                ).join(' ')} 600,220`}
                fill="rgba(220, 38, 38, 0.25)"
                stroke="#dc2626"
                strokeWidth="2"
              />
              {empData.labels.map((label, i) => (
                <text key={i} x={(i / (empData.labels.length - 1)) * 600} y="215" fontSize="10" fill="#6b7280" textAnchor="middle">{label}</text>
              ))}
            </svg>
            <div className="chart-legend-3">
              <span><span className="legend-dot-3 gold"></span> Accounts</span>
              <span><span className="legend-dot-3 dark"></span> Recovery (PKR'000)</span>
              <span><span className="legend-dot-3 red"></span> Overdue</span>
            </div>
          </div>
        </div>
      );
    }

    // Stacked chart
    if (modalChartType === 'stacked') {
      return (
        <div className="modal-chart-container">
          <div className="chart-stacked-container-3">
            {empData.labels.map((label, index) => {
              const accH = getAccountsHeight(empData.accounts[index]);
              const recH = getRecoveryHeight(empData.recovery[index]);
              const odH = getOverdueHeight(empData.overdue[index]);
              return (
                <div key={index} className="stacked-bar-group-3">
                  <div className="stacked-bar-wrapper-3">
                    <div 
                      className="stacked-bar-3 rec-bar-3" 
                      style={{ height: `${recH}px` }}
                    >
                      <span className="stacked-value-3">{(empData.recovery[index]/1000).toFixed(1)}k</span>
                    </div>
                    <div 
                      className="stacked-bar-3 od-bar-3" 
                      style={{ height: `${odH}px` }}
                    >
                      <span className="stacked-value-3">{empData.overdue[index]}</span>
                    </div>
                    <div 
                      className="stacked-bar-3 acc-bar-3" 
                      style={{ height: `${accH}px` }}
                    >
                      <span className="stacked-value-3">{empData.accounts[index]}</span>
                    </div>
                  </div>
                  <span className="stacked-label-3">{label}</span>
                </div>
              );
            })}
          </div>
          <div className="chart-legend-3">
            <span><span className="legend-dot-3 gold"></span> Accounts</span>
            <span><span className="legend-dot-3 dark"></span> Recovery (PKR'000)</span>
            <span><span className="legend-dot-3 red"></span> Overdue</span>
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
  const totalEmployees = displayEmployees.length;

  const getCurrentMonthAccounts = (emp) => {
    const now = new Date();
    const currentMonthNum = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const key = `${currentYear}-${String(currentMonthNum).padStart(2, '0')}`;
    return emp.monthlyData[key]?.accountsOpened || 0;
  };

  const getDueAccounts = (emp) => {
    let dueCount = 0;
    Object.values(emp.monthlyData).forEach(data => {
      if (data.recoveryAmount > 0) dueCount++;
    });
    return dueCount;
  };

  const getEmployeeStats = (emp) => {
    const currentAccounts = getCurrentMonthAccounts(emp);
    const dueAccounts = getDueAccounts(emp);
    const monthlyRecovery = emp.monthlyData[`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`]?.recoveryAmount || 0;

    return [
      { label: 'Total Accounts', value: emp.totalAccounts, color: '#1E1B4B' },
      { label: `New Accounts (${currentMonth})`, value: currentAccounts, color: '#2563eb' },
      { label: 'Monthly Recovery', value: `PKR ${monthlyRecovery.toLocaleString()}`, color: '#C9A84C' },
      { label: 'Due Accounts', value: dueAccounts, color: '#f59e0b' },
      { label: 'Salary', value: `PKR ${emp.salary.toLocaleString()}`, color: '#065f46' },
      { label: 'Commission', value: `PKR ${emp.totalCommission.toLocaleString()}`, color: '#2563eb' },
      { label: 'Leaves', value: emp.totalLeaves, color: '#dc2626' },
    ];
  };

  const isEmployee = userRole === 'employee';

  const summaryCards = isEmployee ? [
    { label: 'Total Accounts', value: totalAccounts, icon: Briefcase, color: '#1E1B4B', className: 'accounts' },
    { label: 'Recovery Due', value: `PKR ${totalRecovery.toLocaleString()}`, icon: DollarSign, color: '#C9A84C', className: 'recovery' },
    { label: 'Overdue', value: displayEmployees.filter(e => e.totalLeaves > 0).length, icon: AlertCircle, color: '#dc2626', className: 'overdue' },
  ] : [
    { label: 'Total Employees', value: totalEmployees, icon: Users, color: '#1E1B4B', className: 'users' },
    { label: 'Total Recovery', value: `PKR ${totalRecovery.toLocaleString()}`, icon: DollarSign, color: '#C9A84C', className: 'recovery' },
    { label: 'Total Commission', value: `PKR ${totalCommission.toLocaleString()}`, icon: Award, color: '#2563eb', className: 'commission' },
    { label: 'Total Accounts', value: totalAccounts, icon: Briefcase, color: '#065f46', className: 'accounts' },
  ];

  const getEmployeeName = (id) => {
    const emp = employees.find(e => e.id === id);
    return emp ? emp.name : 'Select Employee';
  };

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

      {/* Summary Cards */}
      <div className={`summary-cards ${isEmployee ? 'employee-cards' : ''}`}>
        {summaryCards.map((card, index) => (
          <div key={index} className="summary-card" style={{ borderTopColor: card.color }}>
            <div className={`summary-icon ${card.className}`}>
              <card.icon size={20} />
            </div>
            <div className="summary-info">
              <span className="summary-label">{card.label}</span>
              <span className="summary-value">{card.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="employee-table-wrap">
        <div className="table-header-bar">
          <div className="table-header-left">
            <span>Employee Performance</span>
            <span className="record-count">{displayEmployees.length} records</span>
          </div>
        </div>
        <div className="table-scroll">
          <table className="employee-report-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Employee</th>
                <th>Accounts</th>
                <th>Recovery</th>
                <th>Commission</th>
                <th>Leaves</th>
                <th>Actions</th>
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
                displayEmployees.map((emp, index) => (
                  <tr key={emp.id}>
                    <td className="text-gray">{index + 1}</td>
                    <td>
                      <div className="emp-name-cell">
                        <div className="emp-avatar">{emp.name.charAt(0)}</div>
                        {emp.name}
                      </div>
                    </td>
                    <td className="highlight-number">{emp.totalAccounts}</td>
                    <td>PKR {emp.totalRecovery.toLocaleString()}</td>
                    <td>PKR {emp.totalCommission.toLocaleString()}</td>
                    <td>{emp.totalLeaves}</td>
                    <td>
                      <button className="btn-view-detail" onClick={() => openDetailModal(emp)}>
                        <Eye size={15} />
                        View
                      </button>
                    </td>
                  </tr>
                ))
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
                <h3>Employee Report - {selectedEmployee.name}</h3>
              </div>
              <button className="empreport-modal-close" onClick={closeModal}>
                <X size={24} />
              </button>
            </div>

            <div className="empreport-modal-body">
              <div className="employee-detail-header">
                <div className="emp-detail-avatar">{selectedEmployee.name.charAt(0)}</div>
                <div className="emp-detail-info">
                  <h4>{selectedEmployee.name}</h4>
                  <span className="emp-detail-branch">Branch {selectedEmployee.branch} • {selectedEmployee.role}</span>
                  <span className="emp-detail-joining">Joined: {selectedEmployee.joiningDate}</span>
                </div>
              </div>

              {/* 7 Cards */}
              <div className="detail-summary-7">
                {getEmployeeStats(selectedEmployee).map((stat, index) => (
                  <div key={index} className="detail-summary-item" style={{ borderTopColor: stat.color }}>
                    <span>{stat.label}</span>
                    <strong>{stat.value}</strong>
                  </div>
                ))}
              </div>

              {/* Chart Section */}
              <div className="modal-chart-section">
                <div className="modal-chart-header">
                  <h4>Performance Trend (Self-Comparison)</h4>
                  <div className="modal-chart-type-selector">
                    {chartTypes.map((type) => (
                      <button
                        key={type.id}
                        className={`modal-chart-type-btn ${modalChartType === type.id ? 'active' : ''}`}
                        onClick={() => setModalChartType(type.id)}
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
                  <h4>Monthly Breakdown</h4>
                  <span className="monthly-count">{Object.keys(selectedEmployee.monthlyData).length} months</span>
                </div>
                <div className="monthly-scroll">
                  <table className="monthly-table">
                    <thead>
                      <tr>
                        <th>Month</th>
                        <th>Accounts</th>
                        <th>Recovery</th>
                        <th>Commission</th>
                        <th>Leaves</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(selectedEmployee.monthlyData).map(([month, data]) => (
                        <tr key={month}>
                          <td className="month-name">{getMonthName(month)}</td>
                          <td className="month-accounts">{data.accountsOpened}</td>
                          <td>PKR {data.recoveryAmount.toLocaleString()}</td>
                          <td>PKR {data.commission.toLocaleString()}</td>
                          <td>{data.leaves}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="empreport-modal-footer">
              <button className="empreport-btn-cancel" onClick={closeModal}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeReport;