import React, { useState, useEffect } from 'react';
import { Search, Users, DollarSign, Calendar, Clock, TrendingUp, TrendingDown, Filter, Download, Eye, Building, Award, Fuel, Briefcase, User, BarChart, LineChart, PieChart, X, Activity, CheckCircle, AlertCircle } from 'lucide-react';
import './EmployeeReport.css';

const EmployeeReport = () => {
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [userBranch, setUserBranch] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [modalChartType, setModalChartType] = useState('bar');

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
      monthlyData: {
        '2026-01': { accountsOpened: 12, recoveryAmount: 45000, leaves: 2, commission: 24000, fuelExpense: 1500, extraEarnings: 5000 },
        '2026-02': { accountsOpened: 15, recoveryAmount: 52000, leaves: 1, commission: 30000, fuelExpense: 1800, extraEarnings: 7000 },
        '2026-03': { accountsOpened: 10, recoveryAmount: 38000, leaves: 3, commission: 20000, fuelExpense: 1200, extraEarnings: 3000 },
        '2026-04': { accountsOpened: 18, recoveryAmount: 65000, leaves: 0, commission: 36000, fuelExpense: 2000, extraEarnings: 8000 },
        '2026-05': { accountsOpened: 14, recoveryAmount: 48000, leaves: 2, commission: 28000, fuelExpense: 1600, extraEarnings: 4500 },
        '2026-06': { accountsOpened: 20, recoveryAmount: 72000, leaves: 1, commission: 40000, fuelExpense: 2200, extraEarnings: 10000 },
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
      monthlyData: {
        '2026-01': { accountsOpened: 8, recoveryAmount: 32000, leaves: 1, commission: 16000, fuelExpense: 1000, extraEarnings: 2000 },
        '2026-02': { accountsOpened: 10, recoveryAmount: 40000, leaves: 2, commission: 20000, fuelExpense: 1300, extraEarnings: 3500 },
        '2026-03': { accountsOpened: 12, recoveryAmount: 45000, leaves: 0, commission: 24000, fuelExpense: 1500, extraEarnings: 4000 },
        '2026-04': { accountsOpened: 9, recoveryAmount: 35000, leaves: 3, commission: 18000, fuelExpense: 1100, extraEarnings: 2500 },
        '2026-05': { accountsOpened: 11, recoveryAmount: 42000, leaves: 1, commission: 22000, fuelExpense: 1400, extraEarnings: 3000 },
        '2026-06': { accountsOpened: 15, recoveryAmount: 55000, leaves: 0, commission: 30000, fuelExpense: 1800, extraEarnings: 5000 },
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
      monthlyData: {
        '2026-01': { accountsOpened: 5, recoveryAmount: 18000, leaves: 4, commission: 10000, fuelExpense: 800, extraEarnings: 1000 },
        '2026-02': { accountsOpened: 7, recoveryAmount: 25000, leaves: 2, commission: 14000, fuelExpense: 1000, extraEarnings: 2000 },
        '2026-03': { accountsOpened: 8, recoveryAmount: 28000, leaves: 3, commission: 16000, fuelExpense: 1100, extraEarnings: 2500 },
        '2026-04': { accountsOpened: 10, recoveryAmount: 35000, leaves: 1, commission: 20000, fuelExpense: 1300, extraEarnings: 3000 },
        '2026-05': { accountsOpened: 6, recoveryAmount: 20000, leaves: 5, commission: 12000, fuelExpense: 900, extraEarnings: 1500 },
        '2026-06': { accountsOpened: 9, recoveryAmount: 30000, leaves: 2, commission: 18000, fuelExpense: 1200, extraEarnings: 2500 },
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
      monthlyData: {
        '2026-01': { accountsOpened: 6, recoveryAmount: 22000, leaves: 2, commission: 12000, fuelExpense: 900, extraEarnings: 1500 },
        '2026-02': { accountsOpened: 8, recoveryAmount: 28000, leaves: 1, commission: 16000, fuelExpense: 1100, extraEarnings: 2000 },
        '2026-03': { accountsOpened: 11, recoveryAmount: 42000, leaves: 0, commission: 22000, fuelExpense: 1500, extraEarnings: 3500 },
        '2026-04': { accountsOpened: 7, recoveryAmount: 25000, leaves: 3, commission: 14000, fuelExpense: 1000, extraEarnings: 2000 },
        '2026-05': { accountsOpened: 9, recoveryAmount: 32000, leaves: 2, commission: 18000, fuelExpense: 1200, extraEarnings: 2500 },
        '2026-06': { accountsOpened: 12, recoveryAmount: 48000, leaves: 0, commission: 24000, fuelExpense: 1600, extraEarnings: 4000 },
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

  const filteredEmployees = employees.filter(emp => {
    const searchMatch = emp.name.toLowerCase().includes(search.toLowerCase());
    const branchMatch = branchFilter === 'all' || emp.branch === parseInt(branchFilter);
    let userBranchMatch = true;
    if (userBranch) {
      userBranchMatch = emp.branch === parseInt(userBranch);
    }
    return searchMatch && branchMatch && userBranchMatch;
  });

  const getEmployeeChartData = (emp) => {
    const months = Object.keys(emp.monthlyData).sort();
    const data = {
      labels: months.map(m => getMonthName(m)),
      accounts: months.map(m => emp.monthlyData[m].accountsOpened),
      recovery: months.map(m => emp.monthlyData[m].recoveryAmount),
      commission: months.map(m => emp.monthlyData[m].commission),
    };
    return data;
  };

  const renderEmployeeChart = () => {
    if (!selectedEmployee) return null;
    
    const empData = getEmployeeChartData(selectedEmployee);
    const maxVal = Math.max(...empData.accounts, ...empData.recovery.map(v => v/1000), ...empData.commission.map(v => v/1000), 1);

    if (modalChartType === 'bar') {
      return (
        <div className="modal-chart-container">
          <div className="chart-bar-container">
            {empData.labels.map((label, index) => (
              <div key={index} className="chart-bar-group">
                <div className="chart-bars">
                  <div className="chart-bar-wrapper">
                    <div 
                      className="chart-bar bar-gold" 
                      style={{ height: `${(empData.accounts[index] / maxVal) * 140}px` }}
                    >
                      <span className="bar-value">{empData.accounts[index]}</span>
                    </div>
                    <span className="bar-label">Acc</span>
                  </div>
                  <div className="chart-bar-wrapper">
                    <div 
                      className="chart-bar bar-dark" 
                      style={{ height: `${((empData.recovery[index]) / maxVal / 1000) * 140}px` }}
                    >
                      <span className="bar-value">{(empData.recovery[index]/1000).toFixed(1)}k</span>
                    </div>
                    <span className="bar-label">Rec</span>
                  </div>
                  <div className="chart-bar-wrapper">
                    <div 
                      className="chart-bar bar-light" 
                      style={{ height: `${((empData.commission[index]) / maxVal / 1000) * 140}px` }}
                    >
                      <span className="bar-value">{(empData.commission[index]/1000).toFixed(1)}k</span>
                    </div>
                    <span className="bar-label">Com</span>
                  </div>
                </div>
                <div className="chart-bar-labels">
                  <span className="chart-label">{label}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="chart-legend">
            <span><span className="legend-dot gold"></span> Accounts</span>
            <span><span className="legend-dot dark"></span> Recovery (PKR'000)</span>
            <span><span className="legend-dot light"></span> Commission (PKR'000)</span>
          </div>
        </div>
      );
    }

    if (modalChartType === 'line') {
      return (
        <div className="modal-chart-container">
          <div className="chart-line-container">
            <svg viewBox="0 0 600 200" className="chart-svg">
              {[0, 50, 100, 150, 200].map((y) => (
                <line key={y} x1="0" y1={200 - y} x2="600" y2={200 - y} stroke="#e5e7eb" strokeWidth="1" />
              ))}
              <polyline
                points={empData.accounts.map((val, i) => 
                  `${(i / (empData.accounts.length - 1)) * 600},${200 - (val / maxVal) * 170}`
                ).join(' ')}
                fill="none"
                stroke="#C9A84C"
                strokeWidth="3"
              />
              <polyline
                points={empData.recovery.map((val, i) => 
                  `${(i / (empData.recovery.length - 1)) * 600},${200 - ((val/1000) / maxVal) * 170}`
                ).join(' ')}
                fill="none"
                stroke="#1A2A4A"
                strokeWidth="3"
                strokeDasharray="5,5"
              />
              <polyline
                points={empData.commission.map((val, i) => 
                  `${(i / (empData.commission.length - 1)) * 600},${200 - ((val/1000) / maxVal) * 170}`
                ).join(' ')}
                fill="none"
                stroke="#E8D5A3"
                strokeWidth="3"
              />
              {empData.labels.map((label, i) => (
                <text key={i} x={(i / (empData.labels.length - 1)) * 600} y="195" fontSize="10" fill="#6b7280" textAnchor="middle">{label}</text>
              ))}
            </svg>
            <div className="chart-legend">
              <span><span className="legend-dot gold"></span> Accounts</span>
              <span><span className="legend-dot dark"></span> Recovery (PKR'000)</span>
              <span><span className="legend-dot light"></span> Commission (PKR'000)</span>
            </div>
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
  const modalChartTypes = [
    { id: 'bar', label: 'Bar', icon: BarChart },
    { id: 'line', label: 'Line', icon: LineChart },
  ];

  const totalRecovery = filteredEmployees.reduce((sum, e) => sum + e.totalRecovery, 0);
  const totalCommission = filteredEmployees.reduce((sum, e) => sum + e.totalCommission, 0);
  const totalAccounts = filteredEmployees.reduce((sum, e) => sum + e.totalAccounts, 0);

  return (
    <div className="employee-report-container">
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

      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-icon users"><Users size={20} /></div>
          <div className="summary-info">
            <span className="summary-label">Total Employees</span>
            <span className="summary-value">{filteredEmployees.length}</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon recovery"><DollarSign size={20} /></div>
          <div className="summary-info">
            <span className="summary-label">Total Recovery</span>
            <span className="summary-value">PKR {totalRecovery.toLocaleString()}</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon commission"><Award size={20} /></div>
          <div className="summary-info">
            <span className="summary-label">Total Commission</span>
            <span className="summary-value">PKR {totalCommission.toLocaleString()}</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon accounts"><Briefcase size={20} /></div>
          <div className="summary-info">
            <span className="summary-label">Total Accounts</span>
            <span className="summary-value">{totalAccounts}</span>
          </div>
        </div>
      </div>

      <div className="employee-table-wrap">
        <div className="table-header-bar">
          <div className="table-header-left">
            <span>Employee Performance</span>
            <span className="record-count">{filteredEmployees.length} records</span>
          </div>
        </div>
        <div className="table-scroll">
          <table className="employee-report-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Employee</th>
                <th>Branch</th>
                <th>Role</th>
                <th>Accounts</th>
                <th>Recovery</th>
                <th>Commission</th>
                <th>Leaves</th>
                <th>Fuel</th>
                <th>Extra</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="11" className="no-data">
                    <div className="no-data-content">
                      <AlertCircle size={24} />
                      <p>No employees found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp, index) => (
                  <tr key={emp.id}>
                    <td className="text-gray">{index + 1}</td>
                    <td>
                      <div className="emp-name-cell">
                        <div className="emp-avatar">{emp.name.charAt(0)}</div>
                        {emp.name}
                      </div>
                    </td>
                    <td><span className="branch-badge">Branch {emp.branch}</span></td>
                    <td><span className="role-badge">{emp.role}</span></td>
                    <td className="highlight-number">{emp.totalAccounts}</td>
                    <td>PKR {emp.totalRecovery.toLocaleString()}</td>
                    <td>PKR {emp.totalCommission.toLocaleString()}</td>
                    <td>{emp.totalLeaves}</td>
                    <td>PKR {emp.totalFuel.toLocaleString()}</td>
                    <td>PKR {emp.totalExtra.toLocaleString()}</td>
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

              <div className="detail-summary">
                <div className="detail-summary-item">
                  <span>Accounts</span>
                  <strong>{selectedEmployee.totalAccounts}</strong>
                </div>
                <div className="detail-summary-item">
                  <span>Recovery</span>
                  <strong>PKR {selectedEmployee.totalRecovery.toLocaleString()}</strong>
                </div>
                <div className="detail-summary-item">
                  <span>Commission</span>
                  <strong>PKR {selectedEmployee.totalCommission.toLocaleString()}</strong>
                </div>
                <div className="detail-summary-item">
                  <span>Leaves</span>
                  <strong>{selectedEmployee.totalLeaves}</strong>
                </div>
                <div className="detail-summary-item">
                  <span>Fuel Expense</span>
                  <strong>PKR {selectedEmployee.totalFuel.toLocaleString()}</strong>
                </div>
                <div className="detail-summary-item">
                  <span>Extra Earnings</span>
                  <strong>PKR {selectedEmployee.totalExtra.toLocaleString()}</strong>
                </div>
              </div>

              <div className="modal-chart-section">
                <div className="modal-chart-header">
                  <h4>Performance Trend (Self-Comparison)</h4>
                  <div className="modal-chart-type-selector">
                    {modalChartTypes.map((type) => (
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
                        <th>Fuel</th>
                        <th>Extra</th>
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
                          <td>PKR {data.fuelExpense.toLocaleString()}</td>
                          <td>PKR {data.extraEarnings.toLocaleString()}</td>
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