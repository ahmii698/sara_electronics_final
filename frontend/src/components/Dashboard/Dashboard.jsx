// src/components/Dashboard/Dashboard.jsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Users, Package, DollarSign, TrendingUp, BarChart, 
  LineChart, PieChart, Activity, Award, AlertTriangle, 
  Calendar, ChevronDown, ChevronUp, RefreshCw, Sparkles,
  CheckCircle, Clock, AlertCircle, Building, Filter, ExternalLink
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart as ReLineChart, Line,
  AreaChart as ReAreaChart, Area,
  PieChart as RePieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';
import './Dashboard.css';
import { API_URL } from '../../../config';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - i);

const formatYYYYMM = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const getLast6MonthsStart = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - 5, 1);
};

const generateMonthLabels = (startDate, count) => {
  const labels = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
    labels.push(`${MONTH_NAMES[d.getMonth()]} ${String(d.getFullYear()).slice(-2)}`);
  }
  return labels;
};

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userBranch, setUserBranch] = useState(null);
  const [selectedChart, setSelectedChart] = useState('bar');
  const [showBranchOverview, setShowBranchOverview] = useState(false);
  const [upcomingExpenses, setUpcomingExpenses] = useState([]);
  
  // ✅ Dismissed reminders state
  const [dismissedReminders, setDismissedReminders] = useState([]);

  // ===== Chart Filter State =====
  const [filterMode, setFilterMode] = useState('last6');
  const [singleMonth, setSingleMonth] = useState(new Date().getMonth() + 1);
  const [singleYear, setSingleYear] = useState(CURRENT_YEAR);
  const [customMonth, setCustomMonth] = useState(new Date().getMonth() + 1);
  const [customYear, setCustomYear] = useState(CURRENT_YEAR);
  const [appliedFilter, setAppliedFilter] = useState({ mode: 'last6' });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setUserRole(user.role);
      setUserBranch(user.branch_id || user.branch);
    }
    
    // ✅ Load dismissed reminders from localStorage
    const savedDismissed = localStorage.getItem('dismissedReminders');
    if (savedDismissed) {
      setDismissedReminders(JSON.parse(savedDismissed));
    }
    
    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter change hone par dobara data fetch karo
  useEffect(() => {
    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedFilter]);

  // ===== Build query string for dashboard endpoint based on filter =====
  const buildDashboardParams = useCallback((user) => {
    const params = new URLSearchParams();

    if (user && user.branch_id && user.role !== 'admin') {
      params.set('branch_id', user.branch_id);
    }

    if (appliedFilter.mode === 'single') {
      params.set('month', `${appliedFilter.year}-${String(appliedFilter.month).padStart(2, '0')}`);
    } else if (appliedFilter.mode === 'custom') {
      const start = new Date(appliedFilter.year, appliedFilter.month - 1, 1);
      const end = new Date(appliedFilter.year, appliedFilter.month - 1 + 5, 1);
      params.set('start', formatYYYYMM(start));
      params.set('end', formatYYYYMM(end));
    }

    return params.toString();
  }, [appliedFilter]);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));
      const query = buildDashboardParams(user);

      const [dashboardRes, expensesRes] = await Promise.all([
        fetch(`${API_URL}/reports/dashboard${query ? `?${query}` : ''}`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        }),
        fetch(`${API_URL}/expenses/fixed${userBranch ? `?branch_id=${userBranch}` : ''}`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        })
      ]);

      const [dashboardJson, expensesData] = await Promise.all([
        dashboardRes.json(),
        expensesRes.json()
      ]);

      if (dashboardJson.success) {
        setDashboardData(dashboardJson.data);
      } else {
        setError(dashboardJson.message || 'Failed to load dashboard');
      }

      if (expensesData.success) {
        const expenses = (expensesData.data || []).map(exp => ({
          id: exp.id,
          name: exp.name,
          amount: parseFloat(exp.amount) || 0,
          branch: exp.branch_id,
          dueDate: exp.due_date || '',
          paid: !!exp.paid,
          lastPaid: exp.last_paid || 'Never'
        }));

        const allExpenses = expenses.filter(e => e.dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcoming = allExpenses.map(e => {
          let dayMatch = e.dueDate.match(/(\d+)/);
          let dueDay = dayMatch ? parseInt(dayMatch[0]) : 1;
          let dueDate = new Date(today.getFullYear(), today.getMonth(), dueDay);
          if (dueDate < today) {
            dueDate = new Date(today.getFullYear(), today.getMonth() + 1, dueDay);
          }
          const daysLeft = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
          return { ...e, dueDateObj: dueDate, daysLeft, dueDay };
        });

        const filtered = upcoming.filter(e => e.daysLeft === 1);
        filtered.sort((a, b) => a.daysLeft - b.daysLeft);
        setUpcomingExpenses(filtered);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [userBranch, buildDashboardParams]);

  const handleRefresh = useCallback(() => {
    fetchAllData();
  }, [fetchAllData]);

  // ✅ Handle dismiss reminder (OK button)
  const handleDismissReminder = (expenseId) => {
    const updatedDismissed = [...dismissedReminders, expenseId];
    setDismissedReminders(updatedDismissed);
    localStorage.setItem('dismissedReminders', JSON.stringify(updatedDismissed));
  };

  // ✅ Handle mark as paid
  const handleMarkAsPaid = async (expenseId) => {
    try {
      const token = localStorage.getItem('token');
      const expense = upcomingExpenses.find(e => e.id === expenseId);
      if (!expense) return;

      const response = await fetch(`${API_URL}/expenses/fixed/${expenseId}/pay`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: expense.amount }),
      });

      const data = await response.json();
      if (data.success) {
        setUpcomingExpenses(prev => prev.filter(e => e.id !== expenseId));
        handleDismissReminder(expenseId);
        alert('✅ Expense marked as paid!');
        handleRefresh();
      } else {
        alert('❌ Failed to mark as paid: ' + data.message);
      }
    } catch (error) {
      console.error('Error paying expense:', error);
      alert('Network error. Please try again.');
    }
  };

  // ✅ FIXED: Handle redirect to Fixed Expenses (inside Finance)
  const handleRedirectToFixedExpenses = () => {
    // ✅ CORRECT PATH - Match with App.jsx route
    window.location.href = '/finance/fixed';
  };

  // ✅ Filter out dismissed expenses
  const visibleUpcomingExpenses = upcomingExpenses.filter(
    expense => !dismissedReminders.includes(expense.id)
  );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency', currency: 'PKR', minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatCompactCurrency = (amount) => {
    const value = amount || 0;
    if (value >= 1000000) return `Rs ${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `Rs ${(value / 1000).toFixed(0)}K`;
    return `Rs ${value}`;
  };

  const chartTypes = [
    { id: 'bar', label: 'Bar Chart', icon: BarChart },
    { id: 'line', label: 'Line Chart', icon: LineChart },
    { id: 'pie', label: 'Pie Chart', icon: PieChart },
    { id: 'area', label: 'Area Chart', icon: Activity },
  ];

  const tooltipFormatter = (value, name) => {
    if (name === 'Monthly Sales' || name === 'Monthly Recovery') {
      return [formatCurrency(value), name];
    }
    return [value, name];
  };

  const tooltipStyle = {
    borderRadius: 12, border: '1px solid #eef0f4',
    boxShadow: '0 10px 24px rgba(10, 22, 40, 0.14)',
    fontSize: '0.85rem', fontWeight: 600,
  };

  const axisTick = { fontSize: 12, fill: '#6b7280', fontWeight: 600 };

  const ChartLegend = () => (
    <div className="chart-legend-horizontal">
      <span><span className="legend-dot accounts"></span> New Accounts</span>
      <span><span className="legend-dot sales"></span> Monthly Sales</span>
      <span><span className="legend-dot recovery"></span> Monthly Recovery</span>
    </div>
  );

  const chartData = useMemo(() => {
    return dashboardData?.performance_data || [];
  }, [dashboardData]);

  const chartTitle = useMemo(() => {
    if (appliedFilter.mode === 'single') {
      return `Performance Overview (${MONTH_NAMES[appliedFilter.month - 1]} ${appliedFilter.year})`;
    }
    if (appliedFilter.mode === 'custom') {
      const start = new Date(appliedFilter.year, appliedFilter.month - 1, 1);
      const end = new Date(appliedFilter.year, appliedFilter.month - 1 + 5, 1);
      return `Performance Overview (${MONTH_NAMES[start.getMonth()]} ${start.getFullYear()} - ${MONTH_NAMES[end.getMonth()]} ${end.getFullYear()})`;
    }
    return 'Performance Overview (Last 6 Months)';
  }, [appliedFilter]);

  const applyLast6 = () => setAppliedFilter({ mode: 'last6' });
  const applySingle = () => setAppliedFilter({ mode: 'single', month: singleMonth, year: singleYear });
  const applyCustom = () => setAppliedFilter({ mode: 'custom', month: customMonth, year: customYear });

  const renderChart = () => {
    if (!dashboardData) return null;
    const data = chartData;
    if (data.length === 0) {
      return <div className="chart-empty">No performance data available</div>;
    }

    if (selectedChart === 'bar') {
      return (
        <div className="chart-bar-container-multi">
          <ChartLegend />
          <ResponsiveContainer width="100%" height={320}>
            <ReAreaChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="accountsSmoothGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4338ca" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#4338ca" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="salesSmoothGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C9A84C" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#C9A84C" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="recoverySmoothGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 6" vertical={false} stroke="#eef0f4" />
              <XAxis dataKey="month" tick={axisTick} axisLine={false} tickLine={false} />
              <YAxis yAxisId="sales" tick={axisTick} axisLine={false} tickLine={false}
                tickFormatter={formatCompactCurrency} domain={[0, 'dataMax']} width={70} />
              <YAxis yAxisId="accounts" hide domain={[0, 'dataMax']} />
              <YAxis yAxisId="recovery" hide domain={[0, 'dataMax']} />
              <Tooltip formatter={tooltipFormatter} contentStyle={tooltipStyle} />
              <Area yAxisId="accounts" type="monotone" dataKey="accounts" name="New Accounts"
                stroke="#4338ca" strokeWidth={3.5} fill="url(#accountsSmoothGrad)" dot={false} activeDot={{ r: 6 }} />
              <Area yAxisId="sales" type="monotone" dataKey="sales" name="Monthly Sales"
                stroke="#C9A84C" strokeWidth={3.5} fill="url(#salesSmoothGrad)" dot={false} activeDot={{ r: 6 }} />
              <Area yAxisId="recovery" type="monotone" dataKey="recovery" name="Monthly Recovery"
                stroke="#22c55e" strokeWidth={3.5} fill="url(#recoverySmoothGrad)" dot={false} activeDot={{ r: 6 }} />
            </ReAreaChart>
          </ResponsiveContainer>
        </div>
      );
    }

    if (selectedChart === 'line') {
      return (
        <div className="chart-line-container">
          <ChartLegend />
          <ResponsiveContainer width="100%" height={300}>
            <ReLineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef0f4" />
              <XAxis dataKey="month" tick={axisTick} axisLine={false} tickLine={false} />
              <YAxis yAxisId="accounts" hide domain={[0, 'dataMax']} />
              <YAxis yAxisId="sales" hide domain={[0, 'dataMax']} />
              <YAxis yAxisId="recovery" hide domain={[0, 'dataMax']} />
              <Tooltip formatter={tooltipFormatter} contentStyle={tooltipStyle} />
              <Line yAxisId="accounts" type="monotone" dataKey="accounts" name="New Accounts" stroke="#1E1B4B" strokeWidth={3} dot={{ r: 4, fill: '#1E1B4B', strokeWidth: 0 }} activeDot={{ r: 6 }} />
              <Line yAxisId="sales" type="monotone" dataKey="sales" name="Monthly Sales" stroke="#C9A84C" strokeWidth={3} strokeDasharray="8 4" dot={{ r: 4, fill: '#C9A84C', strokeWidth: 0 }} activeDot={{ r: 6 }} />
              <Line yAxisId="recovery" type="monotone" dataKey="recovery" name="Monthly Recovery" stroke="#22c55e" strokeWidth={3} strokeDasharray="4 4" dot={{ r: 4, fill: '#22c55e', strokeWidth: 0 }} activeDot={{ r: 6 }} />
            </ReLineChart>
          </ResponsiveContainer>
        </div>
      );
    }

    if (selectedChart === 'pie') {
      const total = data.reduce((sum, d) => sum + (d.accounts || 0), 0);
      const colors = ['#1E1B4B', '#C9A84C', '#4A3520', '#8B7355', '#6B5B8B', '#2563eb'];
      return (
        <div className="chart-pie-container">
          <div className="pie-chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie data={data} dataKey="accounts" nameKey="month" innerRadius="62%" outerRadius="95%" paddingAngle={3} stroke="none">
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} Accounts`, '']} contentStyle={tooltipStyle} />
              </RePieChart>
            </ResponsiveContainer>
            <div className="pie-center-label">
              <span className="pie-center-total">Total</span>
              <span className="pie-center-count">{total} Accounts</span>
            </div>
          </div>
          <div className="chart-legend pie-legend">
            {data.map((item, index) => (
              <span key={index}>
                <span className="legend-dot" style={{ background: colors[index % colors.length] }}></span>
                {item.month}
              </span>
            ))}
          </div>
        </div>
      );
    }

    if (selectedChart === 'area') {
      return (
        <div className="chart-area-container">
          <ChartLegend />
          <ResponsiveContainer width="100%" height={300}>
            <ReAreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="accountsAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1E1B4B" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#1E1B4B" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="salesAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C9A84C" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#C9A84C" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="recoveryAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef0f4" />
              <XAxis dataKey="month" tick={axisTick} axisLine={false} tickLine={false} />
              <YAxis yAxisId="accounts" hide domain={[0, 'dataMax']} />
              <YAxis yAxisId="sales" hide domain={[0, 'dataMax']} />
              <YAxis yAxisId="recovery" hide domain={[0, 'dataMax']} />
              <Tooltip formatter={tooltipFormatter} contentStyle={tooltipStyle} />
              <Area yAxisId="accounts" type="monotone" dataKey="accounts" name="New Accounts" stroke="#1E1B4B" strokeWidth={2} fill="url(#accountsAreaGrad)" />
              <Area yAxisId="sales" type="monotone" dataKey="sales" name="Monthly Sales" stroke="#C9A84C" strokeWidth={2} fill="url(#salesAreaGrad)" />
              <Area yAxisId="recovery" type="monotone" dataKey="recovery" name="Monthly Recovery" stroke="#22c55e" strokeWidth={2} fill="url(#recoveryAreaGrad)" />
            </ReAreaChart>
          </ResponsiveContainer>
        </div>
      );
    }

    return null;
  };

  if (loading && !dashboardData) {
    return (
      <div className="dashboard-container">
        <div className="loading-state">
          <RefreshCw size={40} className="spinning" />
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error-state">
          <AlertTriangle size={40} />
          <h3>Error Loading Dashboard</h3>
          <p>{error}</p>
          <button className="btn-retry" onClick={handleRefresh}>
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="dashboard-container">
        <div className="empty-state"><p>No data available</p></div>
      </div>
    );
  }

  const data = dashboardData;

  const getBranchDisplayName = () => {
    if (userBranch) return `Branch ${userBranch}`;
    return data.branch_name || 'All Branches';
  };

  const stats = [
    { label: 'Total Customers', value: data.total_customers?.toLocaleString() || '0', icon: Users, subtitle: getBranchDisplayName() },
    { label: `New Accounts (${new Date().toLocaleString('default', { month: 'long' })})`, value: data.new_accounts || 0, icon: Calendar, subtitle: 'This month' },
    { label: 'Total Sales', value: formatCurrency(data.total_sales || 0), icon: DollarSign, subtitle: 'Lifetime revenue' },
    { label: 'Monthly Recovery', value: formatCurrency(data.monthly_recovery || 0), icon: TrendingUp, subtitle: `${new Date().toLocaleString('default', { month: 'long' })} recovery` },
  ];

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="header-left">
          <h2>Dashboard</h2>
          {userBranch && <span className="branch-indicator">{getBranchDisplayName()}</span>}
        </div>
        <button className="btn-refresh" onClick={handleRefresh} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      {/* ===== STATS GRID ===== */}
      <div className="stats-grid-4">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card-4">
            <div className="stat-card-4-top">
              <div className="stat-card-4-icon"><stat.icon size={18} /></div>
              <span className="stat-card-4-label">{stat.label}</span>
            </div>
            <span className="stat-card-4-value">{stat.value}</span>
            {stat.subtitle && <span className="stat-card-4-sub">{stat.subtitle}</span>}
          </div>
        ))}
      </div>

      {/* ===== PERFORMANCE CHART ===== */}
      <div className="chart-section">
        <div className="chart-header">
          <h3>
            <Sparkles size={18} className="chart-header-icon" />
            {chartTitle}
          </h3>
          <div className="chart-type-selector">
            {chartTypes.map((type) => (
              <button
                key={type.id}
                className={`chart-type-btn ${selectedChart === type.id ? 'active' : ''}`}
                onClick={() => setSelectedChart(type.id)}
              >
                <type.icon size={16} />
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* ===== Chart Filter Bar ===== */}
        <div className="chart-filter-bar">
          <div className="filter-mode-selector">
            <button className={`filter-mode-btn ${filterMode === 'last6' ? 'active' : ''}`}
              onClick={() => { setFilterMode('last6'); applyLast6(); }}>
              <Filter size={14} /> Last 6 Months
            </button>
            <button className={`filter-mode-btn ${filterMode === 'single' ? 'active' : ''}`}
              onClick={() => setFilterMode('single')}>
              Single Month
            </button>
            <button className={`filter-mode-btn ${filterMode === 'custom' ? 'active' : ''}`}
              onClick={() => setFilterMode('custom')}>
              Custom 6 Months
            </button>
          </div>

          {filterMode === 'single' && (
            <div className="filter-controls">
              <select value={singleMonth} onChange={(e) => setSingleMonth(Number(e.target.value))}>
                {MONTH_NAMES.map((m, idx) => (
                  <option key={m} value={idx + 1}>{m}</option>
                ))}
              </select>
              <select value={singleYear} onChange={(e) => setSingleYear(Number(e.target.value))}>
                {YEAR_OPTIONS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <button className="btn-apply-filter" onClick={applySingle}>Apply</button>
            </div>
          )}

          {filterMode === 'custom' && (
            <div className="filter-controls">
              <span className="filter-hint">Start:</span>
              <select value={customMonth} onChange={(e) => setCustomMonth(Number(e.target.value))}>
                {MONTH_NAMES.map((m, idx) => (
                  <option key={m} value={idx + 1}>{m}</option>
                ))}
              </select>
              <select value={customYear} onChange={(e) => setCustomYear(Number(e.target.value))}>
                {YEAR_OPTIONS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <button className="btn-apply-filter" onClick={applyCustom}>Apply</button>
            </div>
          )}
        </div>

        <div className="chart-container">
          {renderChart()}
        </div>
      </div>

      {/* ===== TOP PERFORMERS + REVENUE COMPARISON ===== */}
      <div className="performers-revenue-grid">
        <div className="performers-section fixed-height">
          <h3><Award size={20} /> Top Performers - This Month</h3>
          <div className="performer-card">
            <h4>{getBranchDisplayName()}</h4>
            <table className="performer-table">
              <thead>
                <tr><th>Rank</th><th>Employee</th><th>Accounts</th></tr>
              </thead>
              <tbody>
                {data.top_performers && data.top_performers.length > 0 ? (
                  data.top_performers.map((emp, index) => (
                    <tr key={index}>
                      <td className="rank-col">
                        <span className={`rank-badge ${index === 0 ? 'rank-gold' : index === 1 ? 'rank-silver' : index === 2 ? 'rank-bronze' : ''}`}>
                          {index + 1}
                        </span>
                      </td>
                      <td>{emp.name}</td>
                      <td className="count-col">{emp.accounts}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="3" className="no-data">No performers this month</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="revenue-section">
          <div className="revenue-header" onClick={() => setShowBranchOverview(!showBranchOverview)}>
            <h3><DollarSign size={20} /> Revenue Comparison</h3>
            <button className="expand-btn">
              {showBranchOverview ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          </div>

          <div className="revenue-bars">
            <div className="branch-row">
              <span>{getBranchDisplayName()}</span>
              <div className="bar-track"><div className="bar-fill dark" style={{ width: '100%' }}></div></div>
              <span>{formatCurrency(data.total_revenue || 0)}</span>
            </div>
          </div>

          {showBranchOverview && data.branch_overview && (
            <div className="branch-overview-expanded">
              <div className="branch-overview-header"><h4>Branch Overview</h4></div>
              <div className="branch-overview-details">
                <div className="overview-item">
                  <span className="overview-label">Total Revenue</span>
                  <span className="overview-value">{formatCurrency(data.branch_overview.total_revenue || 0)}</span>
                </div>
                <div className="overview-item">
                  <span className="overview-label">Fixed Expenses</span>
                  <span className="overview-value">{formatCurrency(data.branch_overview.fixed_expenses || 0)}</span>
                </div>
                <div className="overview-item">
                  <span className="overview-label">Extra Expenses</span>
                  <span className="overview-value">{formatCurrency(data.branch_overview.extra_expenses || 0)}</span>
                </div>
                <div className="overview-item">
                  <span className="overview-label">Salaries</span>
                  <span className="overview-value">{formatCurrency(data.branch_overview.salaries || 0)}</span>
                </div>
                <div className="overview-item profit">
                  <span className="overview-label">Total Expenses</span>
                  <span className="overview-value">{formatCurrency(data.branch_overview.total_expenses || 0)}</span>
                </div>
                <div className="overview-item profit">
                  <span className="overview-label">Net Profit</span>
                  <span className="overview-value profit">{formatCurrency(data.branch_overview.profit || 0)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== UPCOMING FIXED EXPENSES ===== */}
      {visibleUpcomingExpenses.length > 0 && (
        <div className="upcoming-expenses-section">
          <div className="upcoming-expenses-header">
            <div className="header-left">
              <AlertCircle size={18} className="warning-icon" />
              <h3>⚠️ Upcoming Fixed Expenses (Tomorrow)</h3>
              <span className="expense-count">{visibleUpcomingExpenses.length} due tomorrow</span>
            </div>
            <div className="header-right" style={{ display: 'flex', gap: '10px' }}>
              {/* ✅ VIEW ALL EXPENSES - Redirect to Finance > Fixed Expenses */}
              <button 
                className="btn-view-all" 
                onClick={handleRedirectToFixedExpenses}
                style={{
                  padding: '8px 18px',
                  background: '#1E1B4B',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#312e81';
                  e.target.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#1E1B4B';
                  e.target.style.transform = 'scale(1)';
                }}
              >
                <ExternalLink size={16} />
                View All Expenses
              </button>
            </div>
          </div>
          <div className="upcoming-expenses-grid">
            {visibleUpcomingExpenses.map((expense) => (
              <div key={expense.id} className="expense-card urgent">
                <div className="expense-card-left">
                  <div className="expense-icon"><DollarSign size={16} /></div>
                  <div className="expense-info">
                    <span className="expense-name">{expense.name}</span>
                    <span className="expense-amount">{formatCurrency(expense.amount)}</span>
                  </div>
                </div>
                <div className="expense-card-center">
                  <span className="expense-days urgent"><Clock size={12} /> Tomorrow!</span>
                  <span className="expense-due-date">
                    Due: {expense.dueDateObj.toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div className="expense-card-right" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {/* ✅ PAID BUTTON */}
                  <button 
                    className="btn-mark-paid" 
                    onClick={() => handleMarkAsPaid(expense.id)} 
                    title="Mark as Paid"
                    style={{
                      padding: '6px 14px',
                      background: '#22c55e',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#16a34a';
                      e.target.style.transform = 'scale(1.02)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = '#22c55e';
                      e.target.style.transform = 'scale(1)';
                    }}
                  >
                    <CheckCircle size={16} /> Paid
                  </button>

                  {/* ✅ OK BUTTON - Dismiss Reminder */}
                  <button 
                    className="btn-ok-reminder" 
                    onClick={() => handleDismissReminder(expense.id)}
                    title="Dismiss Reminder"
                    style={{
                      padding: '6px 18px',
                      background: '#2563eb',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#1d4ed8';
                      e.target.style.transform = 'scale(1.02)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = '#2563eb';
                      e.target.style.transform = 'scale(1)';
                    }}
                  >
                    OK
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;