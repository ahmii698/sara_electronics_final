import React, { useState, useEffect } from 'react';
import StatsCard from './StatsCard';
import { Users, Package, DollarSign, TrendingUp, BarChart, LineChart, PieChart, Activity, Award, AlertTriangle, Building, Home, UserCheck, Calendar, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [userRole, setUserRole] = useState(null);
  const [userBranch, setUserBranch] = useState(null);
  const [selectedChart, setSelectedChart] = useState('bar');
  const [showBranchOverview, setShowBranchOverview] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setUserRole(user.role);
      setUserBranch(user.branch);
      if (user.role === 'admin' && user.branch) {
        setSelectedBranch(user.branch);
      }
    }
  }, []);

  // ===== GET CURRENT MONTH =====
  const getCurrentMonth = () => {
    const now = new Date();
    return now.toLocaleString('default', { month: 'long' });
  };

  const currentMonth = getCurrentMonth();

  const branchData = {
    1: {
      name: 'Branch 1',
      customers: 684,
      products: 1856,
      revenue: 28400000,
      recoveryRate: 92,
      newAccounts: 18,
      monthlyRecovery: 420000,
      chartData: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        values: [120, 150, 180, 200, 220, 250]
      },
      topPerformers: [
        { name: 'Ahmed Khan', accounts: 45 },
        { name: 'Usman Malik', accounts: 38 },
        { name: 'Bilal Ahmed', accounts: 32 },
      ],
      branchOverview: {
        rent: 450000,
        salaries: 1200000,
        utilities: 180000,
        otherExpenses: 150000,
        profit: 26420000
      }
    },
    2: {
      name: 'Branch 2',
      customers: 600,
      products: 1600,
      revenue: 26320000,
      recoveryRate: 78,
      newAccounts: 12,
      monthlyRecovery: 350000,
      chartData: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        values: [80, 100, 130, 160, 180, 210]
      },
      topPerformers: [
        { name: 'Sara Ali', accounts: 42 },
        { name: 'Fatima Noor', accounts: 36 },
        { name: 'Ali Raza', accounts: 29 },
      ],
      branchOverview: {
        rent: 380000,
        salaries: 980000,
        utilities: 150000,
        otherExpenses: 120000,
        profit: 24690000
      }
    }
  };

  const combinedData = {
    name: 'All Branches',
    customers: 1284,
    products: 3456,
    revenue: 54720000,
    recoveryRate: 87,
    newAccounts: 30,
    monthlyRecovery: 770000,
    chartData: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      values: [200, 250, 310, 360, 400, 460]
    },
    topPerformers: [
      { name: 'Ahmed Khan', accounts: 45 },
      { name: 'Sara Ali', accounts: 42 },
      { name: 'Usman Malik', accounts: 38 },
    ],
    branchOverview: {
      rent: 830000,
      salaries: 2180000,
      utilities: 330000,
      otherExpenses: 270000,
      profit: 51110000
    }
  };

  const getBranchData = () => {
    if (selectedBranch === 'all') {
      return combinedData;
    }
    return branchData[selectedBranch] || branchData[1];
  };

  const data = getBranchData();
  const isAdmin = userRole === 'admin';

  const chartTypes = [
    { id: 'bar', label: 'Bar Chart', icon: BarChart },
    { id: 'line', label: 'Line Chart', icon: LineChart },
    { id: 'pie', label: 'Pie Chart', icon: PieChart },
    { id: 'area', label: 'Area Chart', icon: Activity },
  ];

  const renderChart = () => {
    const maxValue = Math.max(...data.chartData.values, 1);

    if (selectedChart === 'bar') {
      return (
        <div className="chart-bar-container">
          {data.chartData.labels.map((label, index) => (
            <div key={index} className="chart-bar-group">
              <div className="chart-bars">
                <div className="chart-bar-wrapper">
                  <div 
                    className="chart-bar bar-gold" 
                    style={{ height: `${(data.chartData.values[index] / maxValue) * 160}px` }}
                  >
                    <span className="bar-value">{data.chartData.values[index]}</span>
                  </div>
                  <span className="bar-label">{label}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (selectedChart === 'line') {
      return (
        <div className="chart-line-container">
          <svg viewBox="0 0 600 220" className="chart-svg">
            {[0, 50, 100, 150, 200].map((y) => (
              <line key={y} x1="0" y1={220 - y} x2="600" y2={220 - y} stroke="#e5e7eb" strokeWidth="1" />
            ))}
            <polyline
              points={data.chartData.values.map((val, i) => 
                `${(i / (data.chartData.values.length - 1)) * 600},${220 - (val / maxValue) * 180}`
              ).join(' ')}
              fill="none"
              stroke="#1E1B4B"
              strokeWidth="3"
            />
            {data.chartData.labels.map((label, i) => (
              <text 
                key={i} 
                x={(i / (data.chartData.labels.length - 1)) * 600} 
                y="215" 
                fontSize="11" 
                fill="#6b7280" 
                textAnchor="middle"
              >
                {label}
              </text>
            ))}
            <text x="5" y="15" fontSize="9" fill="#9ca3af">{maxValue}</text>
            <text x="5" y="218" fontSize="9" fill="#9ca3af">0</text>
          </svg>
          <div className="chart-legend">
            <span><span className="legend-dot dark"></span> {data.name}</span>
          </div>
        </div>
      );
    }

    if (selectedChart === 'pie') {
      const total = data.chartData.values.reduce((a, b) => a + b, 0);
      let cumulative = 0;

      return (
        <div className="chart-pie-container">
          <div className="pie-chart">
            <svg viewBox="0 0 220 220">
              {data.chartData.values.map((val, index) => {
                const percentage = (val / total) * 100;
                const dashArray = (percentage / 100) * 534.07;
                const offset = cumulative;
                cumulative += dashArray;
                const colors = ['#1E1B4B', '#C9A84C', '#4A3520', '#8B7355', '#6B5B8B'];
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
                PKR {(total * 1000).toLocaleString()}
              </text>
            </svg>
          </div>
          <div className="chart-legend pie-legend">
            {data.chartData.labels.map((label, index) => (
              <span key={index}>
                <span className="legend-dot" style={{ background: ['#1E1B4B', '#C9A84C', '#4A3520', '#8B7355', '#6B5B8B'][index % 5] }}></span>
                {label}
              </span>
            ))}
          </div>
        </div>
      );
    }

    if (selectedChart === 'area') {
      return (
        <div className="chart-area-container">
          <svg viewBox="0 0 600 220" className="chart-svg">
            <polygon
              points={`0,220 ${data.chartData.values.map((val, i) => 
                `${(i / (data.chartData.values.length - 1)) * 600},${220 - (val / maxValue) * 180}`
              ).join(' ')} 600,220`}
              fill="rgba(30, 27, 75, 0.2)"
              stroke="#1E1B4B"
              strokeWidth="2"
            />
            {data.chartData.labels.map((label, i) => (
              <text 
                key={i} 
                x={(i / (data.chartData.labels.length - 1)) * 600} 
                y="215" 
                fontSize="11" 
                fill="#6b7280" 
                textAnchor="middle"
              >
                {label}
              </text>
            ))}
          </svg>
          <div className="chart-legend">
            <span><span className="legend-dot dark"></span> {data.name}</span>
          </div>
        </div>
      );
    }

    return null;
  };

  // ===== 4 CARDS WITH COLORS =====
  const stats = [
    { 
      label: 'Total Customers', 
      value: data.customers.toLocaleString(), 
      icon: Users,
      subtitle: `Branch ${selectedBranch === 'all' ? 'All Branches' : selectedBranch}`,
      color: '#2563eb',
      bg: 'rgba(37, 99, 235, 0.1)'
    },
    { 
      label: `New Accounts (${currentMonth})`, 
      value: data.newAccounts || 0, 
      icon: Calendar,
      subtitle: 'This month',
      color: '#8B5CF6',
      bg: 'rgba(139, 92, 246, 0.1)'
    },
    { 
      label: 'Total Sales', 
      value: `PKR ${(data.revenue).toLocaleString()}`, 
      icon: DollarSign,
      subtitle: 'Lifetime revenue',
      color: '#22c55e',
      bg: 'rgba(34, 197, 94, 0.1)'
    },
    { 
      label: 'Monthly Recovery', 
      value: `PKR ${(data.monthlyRecovery || 0).toLocaleString()}`, 
      icon: TrendingUp,
      subtitle: `${currentMonth} recovery`,
      color: '#C9A84C',
      bg: 'rgba(201, 168, 76, 0.1)'
    },
  ];

  // ===== BRANCH OVERVIEW WITH BREAKDOWN =====
  const renderBranchOverview = () => {
    const overview = data.branchOverview;
    if (!overview) return null;

    const isProfit = overview.profit > 0;

    return (
      <div className="branch-overview-details">
        <div className="overview-item expense">
          <span className="overview-label">Rent</span>
          <span className="overview-value">PKR {overview.rent.toLocaleString()}</span>
        </div>
        <div className="overview-item expense">
          <span className="overview-label">Salaries</span>
          <span className="overview-value">PKR {overview.salaries.toLocaleString()}</span>
        </div>
        <div className="overview-item expense">
          <span className="overview-label">Utilities</span>
          <span className="overview-value">PKR {overview.utilities.toLocaleString()}</span>
        </div>
        <div className="overview-item expense">
          <span className="overview-label">Other Expenses</span>
          <span className="overview-value">PKR {overview.otherExpenses.toLocaleString()}</span>
        </div>
        <div className={`overview-item ${isProfit ? 'profit' : 'loss'}`}>
          <span className="overview-label">Net Profit</span>
          <span className={`overview-value ${isProfit ? 'profit' : 'loss'}`}>
            {isProfit ? '💰' : '📉'} PKR {overview.profit.toLocaleString()}
          </span>
        </div>
      </div>
    );
  };

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
            {data.name}
          </p>
        </div>
       
        {userRole === 'manager' && userBranch && (
          <span className="manager-badge">
            <Home size={14} /> Branch {userBranch}
          </span>
        )}
        {userRole === 'employee' && userBranch && (
          <span className="manager-badge">
            <UserCheck size={14} /> Branch {userBranch}
          </span>
        )}
      </div>

      {/* ===== 4 STATS CARDS - COLORFUL ===== */}
      <div className="stats-grid-4">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card-4" style={{ borderLeft: `4px solid ${stat.color}` }}>
            <div className="stat-card-4-icon" style={{ background: stat.bg, color: stat.color }}>
              <stat.icon size={24} />
            </div>
            <div className="stat-card-4-info">
              <span className="stat-card-4-label">{stat.label}</span>
              <span className="stat-card-4-value" style={{ color: stat.color }}>{stat.value}</span>
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

      {/* ===== TOP PERFORMERS & REVENUE COMPARISON SIDE BY SIDE ===== */}
      <div className="performers-revenue-grid">
        {/* Top Performers - FIXED SIZE */}
        <div className="performers-section fixed-height">
          <h3>
            <Award size={20} />
            Top Performers - This Month
          </h3>
          <div className="performer-card">
            <h4>{data.name}</h4>
            <table className="performer-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Employee</th>
                  <th>Accounts</th>
                </tr>
              </thead>
              <tbody>
                {data.topPerformers.map((emp, index) => (
                  <tr key={index}>
                    <td className="rank-col">{index + 1}</td>
                    <td>{emp.name}</td>
                    <td className="count-col">{emp.accounts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Revenue Comparison with Expand */}
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
            {selectedBranch === 'all' ? (
              <>
                <div className="branch-row" onClick={() => setSelectedBranch('1')} style={{ cursor: 'pointer' }}>
                  <span>Branch 1</span>
                  <div className="bar-track">
                    <div className="bar-fill dark" style={{ width: '65%' }}></div>
                  </div>
                  <span>PKR 28,400,000</span>
                </div>
                <div className="branch-row" onClick={() => setSelectedBranch('2')} style={{ cursor: 'pointer' }}>
                  <span>Branch 2</span>
                  <div className="bar-track">
                    <div className="bar-fill gold" style={{ width: '60%' }}></div>
                  </div>
                  <span>PKR 26,320,000</span>
                </div>
              </>
            ) : (
              <div className="branch-row">
                <span>{data.name}</span>
                <div className="bar-track">
                  <div className="bar-fill dark" style={{ width: '100%' }}></div>
                </div>
                <span>PKR {data.revenue.toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Expanded Branch Overview - INSIDE revenue card */}
          {showBranchOverview && (
            <div className="branch-overview-expanded">
              <div className="branch-overview-header">
                <h4>Branch Overview</h4>
              </div>
              {renderBranchOverview()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;