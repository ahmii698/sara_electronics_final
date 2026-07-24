// src/components/Dashboard/Dashboard.jsx

import React, { useState, useEffect } from 'react';
import { 
  Users, Package, DollarSign, TrendingUp, BarChart, 
  LineChart, PieChart, Activity, Award, AlertTriangle, 
  Building, Home, UserCheck, Calendar, Clock, 
  ChevronDown, ChevronUp, RefreshCw 
} from 'lucide-react';
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

  const chartTypes = [
    { id: 'bar', label: 'Bar Chart', icon: BarChart },
    { id: 'line', label: 'Line Chart', icon: LineChart },
    { id: 'pie', label: 'Pie Chart', icon: PieChart },
    { id: 'area', label: 'Area Chart', icon: Activity },
  ];

  const renderChart = () => {
    if (!dashboardData) return null;
    
    const data = dashboardData.performance_data || [];
    if (data.length === 0) {
      return <div className="chart-empty">No performance data available</div>;
    }
    
    const maxAccounts = Math.max(...data.map(d => d.accounts || 0), 1);
    const maxSales = Math.max(...data.map(d => d.sales || 0), 1);
    const maxRecovery = Math.max(...data.map(d => d.recovery || 0), 1);
    const maxValue = Math.max(maxAccounts, maxSales / 1000, maxRecovery / 1000, 1);

    if (selectedChart === 'bar') {
      return (
        <div className="chart-bar-container-multi">
          <div className="chart-legend-horizontal">
            <span><span className="legend-dot accounts"></span> New Accounts</span>
            <span><span className="legend-dot sales"></span> Monthly Sales</span>
            <span><span className="legend-dot recovery"></span> Monthly Recovery</span>
          </div>
          <div className="chart-bars-multi">
            {data.map((item, index) => (
              <div key={index} className="chart-bar-group-multi">
                <div className="chart-bars-stacked">
                  <div 
                    className="chart-bar accounts-bar" 
                    style={{ height: `${(item.accounts / maxValue) * 140}px` }}
                    title={`Accounts: ${item.accounts}`}
                  >
                    <span className="bar-value">{item.accounts}</span>
                  </div>
                  <div 
                    className="chart-bar sales-bar" 
                    style={{ height: `${(item.sales / (maxValue * 1000)) * 140}px` }}
                    title={`Sales: ${formatCurrency(item.sales)}`}
                  >
                    <span className="bar-value">{formatCurrency(item.sales)}</span>
                  </div>
                  <div 
                    className="chart-bar recovery-bar" 
                    style={{ height: `${(item.recovery / (maxValue * 1000)) * 140}px` }}
                    title={`Recovery: ${formatCurrency(item.recovery)}`}
                  >
                    <span className="bar-value">{formatCurrency(item.recovery)}</span>
                  </div>
                </div>
                <span className="bar-label">{item.month}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (selectedChart === 'line') {
      return (
        <div className="chart-line-container">
          <div className="chart-legend-horizontal">
            <span><span className="legend-dot accounts"></span> New Accounts</span>
            <span><span className="legend-dot sales"></span> Monthly Sales</span>
            <span><span className="legend-dot recovery"></span> Monthly Recovery</span>
          </div>
          <svg viewBox="0 0 600 220" className="chart-svg">
            {[0, 50, 100, 150, 200].map((y) => (
              <line key={y} x1="0" y1={220 - y} x2="600" y2={220 - y} stroke="#e5e7eb" strokeWidth="1" />
            ))}
            <polyline
              points={data.map((val, i) => 
                `${(i / (data.length - 1 || 1)) * 600},${220 - (val.accounts / maxValue) * 180}`
              ).join(' ')}
              fill="none"
              stroke="#1E1B4B"
              strokeWidth="3"
            />
            <polyline
              points={data.map((val, i) => 
                `${(i / (data.length - 1 || 1)) * 600},${220 - (val.sales / (maxValue * 1000)) * 180}`
              ).join(' ')}
              fill="none"
              stroke="#C9A84C"
              strokeWidth="3"
              strokeDasharray="8 4"
            />
            <polyline
              points={data.map((val, i) => 
                `${(i / (data.length - 1 || 1)) * 600},${220 - (val.recovery / (maxValue * 1000)) * 180}`
              ).join(' ')}
              fill="none"
              stroke="#22c55e"
              strokeWidth="3"
              strokeDasharray="4 4"
            />
            {data.map((item, i) => (
              <text 
                key={i} 
                x={(i / (data.length - 1 || 1)) * 600} 
                y="215" 
                fontSize="11" 
                fill="#6b7280" 
                textAnchor="middle"
              >
                {item.month}
              </text>
            ))}
          </svg>
        </div>
      );
    }

    if (selectedChart === 'pie') {
      const total = data.reduce((sum, d) => sum + d.accounts, 0);
      let cumulative = 0;
      const colors = ['#1E1B4B', '#C9A84C', '#4A3520', '#8B7355', '#6B5B8B', '#2563eb'];

      return (
        <div className="chart-pie-container">
          <div className="pie-chart">
            <svg viewBox="0 0 220 220">
              {data.map((item, index) => {
                const percentage = total > 0 ? (item.accounts / total) * 100 : 0;
                const dashArray = (percentage / 100) * 534.07;
                const offset = cumulative;
                cumulative += dashArray;
                return (
                  <circle
                    key={index}
                    cx="110" cy="110" r="85"
                    fill="none"
                    stroke={colors[index % colors.length]}
                    strokeWidth="45"
                    strokeDasharray={`${dashArray} 534.07`}
                    strokeDashoffset={`-${offset}`}
                    transform="rotate(-90 110 110)"
                  />
                );
              })}
              <text x="110" y="105" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#0A1628">
                Total
              </text>
              <text x="110" y="125" textAnchor="middle" fontSize="11" fill="#6b7280">
                {total} Accounts
              </text>
            </svg>
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
          <div className="chart-legend-horizontal">
            <span><span className="legend-dot accounts"></span> New Accounts</span>
            <span><span className="legend-dot sales"></span> Monthly Sales</span>
            <span><span className="legend-dot recovery"></span> Monthly Recovery</span>
          </div>
          <svg viewBox="0 0 600 220" className="chart-svg">
            <polygon
              points={`0,220 ${data.map((val, i) => 
                `${(i / (data.length - 1 || 1)) * 600},${220 - (val.accounts / maxValue) * 180}`
              ).join(' ')} 600,220`}
              fill="rgba(30, 27, 75, 0.2)"
              stroke="#1E1B4B"
              strokeWidth="2"
            />
            <polygon
              points={`0,220 ${data.map((val, i) => 
                `${(i / (data.length - 1 || 1)) * 600},${220 - (val.sales / (maxValue * 1000)) * 180}`
              ).join(' ')} 600,220`}
              fill="rgba(201, 168, 76, 0.2)"
              stroke="#C9A84C"
              strokeWidth="2"
            />
            <polygon
              points={`0,220 ${data.map((val, i) => 
                `${(i / (data.length - 1 || 1)) * 600},${220 - (val.recovery / (maxValue * 1000)) * 180}`
              ).join(' ')} 600,220`}
              fill="rgba(34, 197, 94, 0.2)"
              stroke="#22c55e"
              strokeWidth="2"
            />
            {data.map((item, i) => (
              <text 
                key={i} 
                x={(i / (data.length - 1 || 1)) * 600} 
                y="215" 
                fontSize="11" 
                fill="#6b7280" 
                textAnchor="middle"
              >
                {item.month}
              </text>
            ))}
          </svg>
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
  const branchLabel = data.branch_name || 'All Branches';

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
          <div className="header-title-group">
            <h2>Dashboard</h2>
            <span className="live-badge">
              <Clock size={12} /> Live
            </span>
          </div>
          <p className="branch-label">
            <Building size={16} />
            {branchLabel}
          </p>
        </div>
        <button className="btn-refresh" onClick={fetchDashboardData}>
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      <div className="stats-grid-4">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card-4">
            <div className="stat-card-4-icon">
              <stat.icon size={24} />
            </div>
            <div className="stat-card-4-info">
              <span className="stat-card-4-label">{stat.label}</span>
              <span className="stat-card-4-value">{stat.value}</span>
              <span className="stat-card-4-sub">{stat.subtitle}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="chart-section">
        <div className="chart-header">
          <h3>Performance Overview (Last 6 Months)</h3>
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
                      <td className="rank-col">{index + 1}</td>
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