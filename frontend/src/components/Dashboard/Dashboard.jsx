// src/components/Dashboard/Dashboard.jsx

import React, { useState, useEffect } from 'react';
import { 
  Users, Package, DollarSign, TrendingUp, BarChart, 
  LineChart, PieChart, Activity, Award, AlertTriangle, 
  Calendar, ChevronDown, ChevronUp, RefreshCw, Sparkles
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

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userBranch, setUserBranch] = useState(null);
  const [selectedChart, setSelectedChart] = useState('bar');
  const [showBranchOverview, setShowBranchOverview] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setUserRole(user.role);
      setUserBranch(user.branch);
    }
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));
      
      let url = `${API_URL}/reports/dashboard`;
      
      if (user && user.branch && user.role !== 'admin') {
        url += `?branch_id=${user.branch}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      const data = await response.json();
      console.log('Dashboard Data:', data);

      if (data.success) {
        setDashboardData(data.data);
      } else {
        setError(data.message || 'Failed to load dashboard');
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
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

  // Tooltip shows currency for sales/recovery but a plain number for accounts
  const tooltipFormatter = (value, name) => {
    if (name === 'Monthly Sales' || name === 'Monthly Recovery') {
      return [formatCurrency(value), name];
    }
    return [value, name];
  };

  const tooltipStyle = {
    borderRadius: 12,
    border: '1px solid #eef0f4',
    boxShadow: '0 10px 24px rgba(10, 22, 40, 0.14)',
    fontSize: '0.85rem',
    fontWeight: 600,
  };

  const axisTick = { fontSize: 12, fill: '#6b7280', fontWeight: 600 };

  const ChartLegend = () => (
    <div className="chart-legend-horizontal">
      <span><span className="legend-dot accounts"></span> New Accounts</span>
      <span><span className="legend-dot sales"></span> Monthly Sales</span>
      <span><span className="legend-dot recovery"></span> Monthly Recovery</span>
    </div>
  );

  const renderChart = () => {
    if (!dashboardData) return null;

    const data = dashboardData.performance_data || [];
    if (data.length === 0) {
      return <div className="chart-empty">No performance data available</div>;
    }

    // Each metric gets its own hidden Y axis so it is scaled against its OWN
    // max, not a shared/guessed max — this keeps small-value bars (accounts,
    // recovery) visible even when sales spikes into the thousands/lakhs.
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
              <YAxis
                yAxisId="sales"
                tick={axisTick}
                axisLine={false}
                tickLine={false}
                tickFormatter={formatCompactCurrency}
                domain={[0, 'dataMax']}
                width={70}
              />
              <YAxis yAxisId="accounts" hide domain={[0, 'dataMax']} />
              <YAxis yAxisId="recovery" hide domain={[0, 'dataMax']} />
              <Tooltip formatter={tooltipFormatter} contentStyle={tooltipStyle} />
              <Area
                yAxisId="accounts"
                type="monotone"
                dataKey="accounts"
                name="New Accounts"
                stroke="#4338ca"
                strokeWidth={3.5}
                fill="url(#accountsSmoothGrad)"
                dot={false}
                activeDot={{ r: 6 }}
              />
              <Area
                yAxisId="sales"
                type="monotone"
                dataKey="sales"
                name="Monthly Sales"
                stroke="#C9A84C"
                strokeWidth={3.5}
                fill="url(#salesSmoothGrad)"
                dot={false}
                activeDot={{ r: 6 }}
              />
              <Area
                yAxisId="recovery"
                type="monotone"
                dataKey="recovery"
                name="Monthly Recovery"
                stroke="#22c55e"
                strokeWidth={3.5}
                fill="url(#recoverySmoothGrad)"
                dot={false}
                activeDot={{ r: 6 }}
              />
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
                <Pie
                  data={data}
                  dataKey="accounts"
                  nameKey="month"
                  innerRadius="62%"
                  outerRadius="95%"
                  paddingAngle={3}
                  stroke="none"
                >
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

  if (loading) {
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
          <button className="btn-retry" onClick={fetchDashboardData}>
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
        <div className="empty-state">
          <p>No data available</p>
        </div>
      </div>
    );
  }

  const data = dashboardData;

  const stats = [
    { 
      label: 'Total Customers', 
      value: data.total_customers?.toLocaleString() || '0', 
      icon: Users,
      subtitle: data.branch_name
    },
    { 
      label: `New Accounts (${new Date().toLocaleString('default', { month: 'long' })})`, 
      value: data.new_accounts || 0, 
      icon: Calendar,
      subtitle: 'This month'
    },
    { 
      label: 'Total Sales', 
      value: formatCurrency(data.total_sales || 0), 
      icon: DollarSign,
      subtitle: 'Lifetime revenue'
    },
    { 
      label: 'Monthly Recovery', 
      value: formatCurrency(data.monthly_recovery || 0), 
      icon: TrendingUp,
      subtitle: `${new Date().toLocaleString('default', { month: 'long' })} recovery`
    },
  ];

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="header-left">
          <h2>Dashboard</h2>
        </div>
        <button className="btn-refresh" onClick={fetchDashboardData}>
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      <div className="stats-grid-4">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card-4">
            <div className="stat-card-4-top">
              <div className="stat-card-4-icon">
                <stat.icon size={18} />
              </div>
              <span className="stat-card-4-label">{stat.label}</span>
            </div>
            <span className="stat-card-4-value">{stat.value}</span>
            {stat.subtitle && <span className="stat-card-4-sub">{stat.subtitle}</span>}
          </div>
        ))}
      </div>

      <div className="chart-section">
        <div className="chart-header">
          <h3>
            <Sparkles size={18} className="chart-header-icon" />
            Performance Overview (Last 6 Months)
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
        <div className="chart-container">
          {renderChart()}
        </div>
      </div>

      <div className="performers-revenue-grid">
        <div className="performers-section fixed-height">
          <h3>
            <Award size={20} />
            Top Performers - This Month
          </h3>
          <div className="performer-card">
            <h4>{data.branch_name}</h4>
            <table className="performer-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Employee</th>
                  <th>Accounts</th>
                </tr>
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
                  <tr>
                    <td colSpan="3" className="no-data">No performers this month</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="revenue-section">
          <div className="revenue-header" onClick={() => setShowBranchOverview(!showBranchOverview)}>
            <h3>
              <DollarSign size={20} />
              Revenue Comparison
            </h3>
            <button className="expand-btn">
              {showBranchOverview ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          </div>
          
          <div className="revenue-bars">
            <div className="branch-row">
              <span>{data.branch_name}</span>
              <div className="bar-track">
                <div className="bar-fill dark" style={{ width: '100%' }}></div>
              </div>
              <span>{formatCurrency(data.total_revenue || 0)}</span>
            </div>
          </div>

          {showBranchOverview && data.branch_overview && (
            <div className="branch-overview-expanded">
              <div className="branch-overview-header">
                <h4>Branch Overview</h4>
              </div>
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
    </div>
  );
};

export default Dashboard;