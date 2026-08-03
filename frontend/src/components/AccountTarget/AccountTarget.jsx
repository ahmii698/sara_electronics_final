// src/components/AccountTarget/AccountTarget.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, Target, TrendingUp, TrendingDown, Calendar, 
  Building, CheckCircle, AlertCircle, RefreshCw,
  Search, Eye, DollarSign, Award, Briefcase
} from 'lucide-react';
import './AccountTarget.css';
import { API_URL } from '../../../config';

const AccountTarget = () => {
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [userBranch, setUserBranch] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [targetData, setTargetData] = useState({});
  const [editingTarget, setEditingTarget] = useState({});
  const [savingTarget, setSavingTarget] = useState({});

  // ✅ Get current month
  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  // ✅ Sirf user info load karo aur selectedMonth set karo yahan.
  // fetchData() YAHAN se call nahi karte — kyunke setSelectedMonth() turant
  // apply nahi hota (React state update async hai), is liye fetchData()
  // agar yahin call ho to wo abhi bhi selectedMonth = '' (empty) use karega
  // aur API ko "month=" (khaali) chala jayega — isi wajah se current month
  // ke accounts hamesha 0 show ho rahe thay.
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setUserRole(user.role);
      setUserBranch(user.branch);
    }
    setSelectedMonth(getCurrentMonth());
  }, []);

  // ✅ jab bhi selectedMonth (ya userBranch) sahi set/badal jaye,
  // tabhi fetchData() chalao — is se hamesha updated/current month API
  // call mein jayega, empty nahi.
  useEffect(() => {
    if (selectedMonth) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, userBranch]);

  // ✅ FETCH DATA - accounts count + targets (ab dono database se aate hain)
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Fetch employees
      let url = `${API_URL}/users?role=employee`;
      if (userBranch) {
        url += `&branch_id=${userBranch}`;
      }
      
      const empResponse = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      const empData = await empResponse.json();

      // ✅ NEW: is month ke sare targets ek saath fetch karo (database se)
      let targetsUrl = `${API_URL}/target-performance?month=${selectedMonth}`;
      if (userBranch) {
        targetsUrl += `&branch_id=${userBranch}`;
      }

      let targetsMap = {};
      try {
        const targetsResponse = await fetch(targetsUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
        const targetsResult = await targetsResponse.json();
        if (targetsResult.success) {
          targetsMap = targetsResult.data || {};
        }
      } catch (err) {
        console.error('Error fetching targets:', err);
      }
      
      if (empData.success) {
        const employeesList = empData.data.data || [];
        
        // Fetch account counts for each employee
        const employeesWithCounts = await Promise.all(
          employeesList.map(async (emp) => {
            const month = selectedMonth;
            
            const countUrl = `${API_URL}/accounts/employee-count?employee_id=${emp.id}&month=${month}`;
            
            let currentMonthAccounts = 0;
            let totalAccounts = 0;
            
            try {
              const countResponse = await fetch(countUrl, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Accept': 'application/json'
                }
              });
              const countData = await countResponse.json();
              if (countData.success) {
                currentMonthAccounts = countData.current_month || 0;
                totalAccounts = countData.total || 0;
              }
            } catch (err) {
              console.error('Error fetching counts:', err);
            }
            
            // ✅ NEW: target ab localStorage se nahi, database se aa raha hai
            const target = targetsMap[emp.id] ? parseInt(targetsMap[emp.id].target) : 0;
            
            return {
              id: emp.id,
              name: emp.name,
              email: emp.email,
              phone: emp.phone,
              branch: emp.branch_id,
              salary: emp.salary,
              currentMonthAccounts: currentMonthAccounts,
              totalAccounts: totalAccounts,
              target: target,
              remaining: Math.max(target - currentMonthAccounts, 0),
              progress: target > 0 ? Math.round((currentMonthAccounts / target) * 100) : 0
            };
          })
        );
        
        setEmployees(employeesWithCounts);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setLoading(false);
  }, [userBranch, selectedMonth]);

  // ✅ Handle target change
  const handleTargetChange = (employeeId, value) => {
    setEditingTarget(prev => ({
      ...prev,
      [employeeId]: value
    }));
  };

  // ✅ Save target — ab database mein POST hota hai (target_performance table)
  const saveTarget = async (employeeId) => {
    const value = editingTarget[employeeId];
    if (!value || parseInt(value) <= 0) {
      alert('Please enter a valid target');
      return;
    }

    setSavingTarget(prev => ({ ...prev, [employeeId]: true }));

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/target-performance`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          employee_id: employeeId,
          month: selectedMonth,
          target: parseInt(value)
        })
      });

      const data = await response.json();

      if (data.success) {
        // Update employees list
        setEmployees(prev => prev.map(emp => {
          if (emp.id === employeeId) {
            const target = parseInt(value);
            const currentMonthAccounts = emp.currentMonthAccounts;
            return {
              ...emp,
              target: target,
              remaining: Math.max(target - currentMonthAccounts, 0),
              progress: target > 0 ? Math.round((currentMonthAccounts / target) * 100) : 0
            };
          }
          return emp;
        }));

        setEditingTarget(prev => ({ ...prev, [employeeId]: '' }));
        alert('✅ Target saved successfully!');
      } else {
        alert(data.message || 'Failed to save target');
      }
    } catch (error) {
      console.error('Error saving target:', error);
      alert('Network error. Please try again.');
    }

    setSavingTarget(prev => ({ ...prev, [employeeId]: false }));
  };

  // ✅ Refresh data
  const handleRefresh = () => {
    fetchData();
  };

  // ✅ Change month
  // Ab sirf state update karna kaafi hai — upar wala useEffect
  // (selectedMonth ki dependency ke sath) khud fetchData() chala dega
  // jab selectedMonth badal jayega. setTimeout wala hack ki zaroorat
  // nahi rahi.
  const handleMonthChange = (e) => {
    setSelectedMonth(e.target.value);
  };

  // ✅ Get month name
  const getMonthName = (monthStr) => {
    if (!monthStr) return '';
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  // ✅ Get available months (last 12 months)
  const getAvailableMonths = () => {
    const months = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
    }
    return months;
  };

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(search.toLowerCase())
  );

  // ✅ Stats
  const totalEmployees = filteredEmployees.length;
  const totalTargets = filteredEmployees.reduce((sum, emp) => sum + emp.target, 0);
  const totalAchieved = filteredEmployees.reduce((sum, emp) => sum + emp.currentMonthAccounts, 0);
  const totalRemaining = filteredEmployees.reduce((sum, emp) => sum + emp.remaining, 0);
  const overallProgress = totalTargets > 0 ? Math.round((totalAchieved / totalTargets) * 100) : 0;

  const branchLabel = userBranch ? `Branch ${userBranch}` : 'All Branches';

  const statCards = [
    {
      label: 'Total Employees',
      value: totalEmployees,
      icon: Users,
      color: '#4338ca',
      bg: 'rgba(67, 56, 202, 0.1)'
    },
    {
      label: 'Total Targets',
      value: totalTargets,
      icon: Target,
      color: '#C9A84C',
      bg: 'rgba(201, 168, 76, 0.12)'
    },
    {
      label: 'Accounts Achieved',
      value: totalAchieved,
      icon: TrendingUp,
      color: '#22c55e',
      bg: 'rgba(34, 197, 94, 0.1)'
    },
    {
      label: 'Remaining',
      value: totalRemaining,
      icon: TrendingDown,
      color: '#dc2626',
      bg: 'rgba(220, 38, 38, 0.1)'
    },
    {
      label: 'Overall Progress',
      value: `${overallProgress}%`,
      icon: Award,
      color: '#8B5CF6',
      bg: 'rgba(139, 92, 246, 0.1)'
    }
  ];

  if (loading && employees.length === 0) {
    return (
      <div className="account-target-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading account targets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="account-target-container">
      <div className="target-header">
        <div className="header-left">
          <div className="header-title-group">
            <h2>Account Target</h2>
            <span className="live-badge">
              <Target size={12} /> Active
            </span>
          </div>
          <div className="branch-label">
            <Building size={14} />
            <span>{branchLabel}</span>
          </div>
        </div>
        <div className="header-actions">
          <div className="month-selector">
            <Calendar size={16} />
            <select
              value={selectedMonth}
              onChange={handleMonthChange}
              className="month-select"
            >
              {getAvailableMonths().map(month => (
                <option key={month} value={month}>
                  {getMonthName(month)}
                </option>
              ))}
            </select>
          </div>
          <button className="btn-refresh-small" onClick={handleRefresh} title="Refresh">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* ===== STATS CARDS ===== */}
      <div className="target-stats-grid">
        {statCards.map((card, index) => (
          <div key={index} className="target-stat-card">
            <div className="target-stat-icon" style={{ background: card.bg, color: card.color }}>
              <card.icon size={20} />
            </div>
            <div className="target-stat-info">
              <span className="target-stat-label">{card.label}</span>
              <span className="target-stat-value" style={{ color: card.color }}>{card.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ===== SEARCH ===== */}
      <div className="target-controls">
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search employee..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="target-summary">
          <span>Showing {filteredEmployees.length} employees</span>
          <span className="target-month">• {getMonthName(selectedMonth)}</span>
        </div>
      </div>

      {/* ===== TABLE ===== */}
      <div className="target-table-wrap">
        <table className="target-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Employee</th>
              <th>Accounts (Current Month)</th>
              <th>Total Accounts</th>
              <th>Target</th>
              <th>Achieved</th>
              <th>Remaining</th>
              <th>Progress</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.length === 0 ? (
              <tr>
                <td colSpan="9" className="no-data">
                  <AlertCircle size={24} />
                  <p>No employees found for {branchLabel}</p>
                </td>
              </tr>
            ) : (
              filteredEmployees.map((emp, index) => (
                <tr key={emp.id} className={emp.progress >= 100 ? 'achieved-row' : ''}>
                  <td>{index + 1}</td>
                  <td>
                    <div className="employee-name-cell">
                      <div className="emp-avatar" style={{ background: '#ede9fe', color: '#1E1B4B' }}>
                        {emp.name.charAt(0)}
                      </div>
                      <div>
                        <div className="emp-name">{emp.name}</div>
                        <div className="emp-details">
                          <span className="emp-branch">Branch {emp.branch}</span>
                          <span className="emp-salary">PKR {emp.salary?.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="account-count achieved">
                      {emp.currentMonthAccounts}
                    </span>
                  </td>
                  <td>
                    <span className="account-count total">
                      {emp.totalAccounts}
                    </span>
                  </td>
                  <td>
                    <input
                      type="number"
                      className="target-input"
                      placeholder="Set target"
                      value={editingTarget[emp.id] !== undefined ? editingTarget[emp.id] : (emp.target || '')}
                      onChange={(e) => handleTargetChange(emp.id, e.target.value)}
                      min="0"
                    />
                  </td>
                  <td>
                    <span className="achieved-count">
                      {emp.currentMonthAccounts}
                    </span>
                  </td>
                  <td>
                    <span className="remaining-count" style={{ 
                      color: emp.remaining > 0 ? '#dc2626' : '#22c55e'
                    }}>
                      {emp.remaining}
                    </span>
                  </td>
                  <td>
                    <div className="progress-bar-wrapper">
                      <div className="progress-bar-track">
                        <div 
                          className={`progress-bar-fill ${emp.progress >= 100 ? 'complete' : ''}`}
                          style={{ width: `${Math.min(emp.progress, 100)}%` }}
                        />
                      </div>
                      <span className="progress-text">{emp.progress}%</span>
                    </div>
                  </td>
                  <td>
                    <button
                      className="btn-save-target"
                      onClick={() => saveTarget(emp.id)}
                      disabled={!editingTarget[emp.id] || parseInt(editingTarget[emp.id]) <= 0 || savingTarget[emp.id]}
                    >
                      <CheckCircle size={14} />
                      {savingTarget[emp.id] ? 'Saving...' : 'Save'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ===== PROGRESS SUMMARY ===== */}
      {filteredEmployees.length > 0 && (
        <div className="target-footer">
          <div className="footer-left">
            <span>Total Target: <strong>{totalTargets}</strong></span>
            <span>• Achieved: <strong style={{ color: '#22c55e' }}>{totalAchieved}</strong></span>
            <span>• Remaining: <strong style={{ color: '#dc2626' }}>{totalRemaining}</strong></span>
          </div>
          <div className="footer-right">
            <div className="overall-progress">
              <span>Overall Progress</span>
              <div className="progress-bar-track">
                <div 
                  className={`progress-bar-fill ${overallProgress >= 100 ? 'complete' : ''}`}
                  style={{ width: `${Math.min(overallProgress, 100)}%` }}
                />
              </div>
              <span className="overall-progress-text">{overallProgress}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountTarget;