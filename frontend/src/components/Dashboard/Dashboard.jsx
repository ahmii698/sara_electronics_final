import React, { useState, useEffect } from 'react';
import StatsCard from './StatsCard';
import { Users, Package, DollarSign, TrendingUp, BarChart, LineChart, PieChart, Activity, Award, AlertTriangle, Building, Home, UserCheck } from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [userRole, setUserRole] = useState(null);
  const [userBranch, setUserBranch] = useState(null);
  const [selectedChart, setSelectedChart] = useState('bar');

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

  const branchData = {
    1: {
      name: 'Branch 1',
      customers: 684,
      products: 1856,
      revenue: 28400000,
      recoveryRate: 92,
      chartData: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        values: [120, 150, 180, 200, 220, 250]
      },
      topPerformers: [
        { name: 'Ahmed Khan', accounts: 45 },
        { name: 'Usman Malik', accounts: 38 },
        { name: 'Bilal Ahmed', accounts: 32 },
      ],
      lowStock: [
        { name: 'Sony LED 65"', stock: 5, category: 'TV' },
        { name: 'Dell Laptop', stock: 8, category: 'Computers' },
        { name: 'Samsung Galaxy S24', stock: 10, category: 'Mobile' },
      ],
      recentTransactions: [
        { customer: 'Ahmed Khan', amount: 12500, due: '2026-04-01' },
        { customer: 'Usman Malik', amount: 8500, due: '2026-04-05' },
        { customer: 'Bilal Ahmed', amount: 22000, due: '2026-04-10' },
      ]
    },
    2: {
      name: 'Branch 2',
      customers: 600,
      products: 1600,
      revenue: 26320000,
      recoveryRate: 78,
      chartData: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        values: [80, 100, 130, 160, 180, 210]
      },
      topPerformers: [
        { name: 'Sara Ali', accounts: 42 },
        { name: 'Fatima Noor', accounts: 36 },
        { name: 'Ali Raza', accounts: 29 },
      ],
      lowStock: [
        { name: 'LG Refrigerator', stock: 12, category: 'Appliances' },
        { name: 'Apple iPhone 15', stock: 15, category: 'Mobile' },
        { name: 'Sony Soundbar', stock: 23, category: 'Audio' },
      ],
      recentTransactions: [
        { customer: 'Sara Ali', amount: 18000, due: '2026-04-02' },
        { customer: 'Fatima Noor', amount: 15000, due: '2026-04-07' },
        { customer: 'Ali Raza', amount: 9500, due: '2026-04-12' },
      ]
    }
  };

  const combinedData = {
    name: 'All Branches',
    customers: 1284,
    products: 3456,
    revenue: 54720000,
    recoveryRate: 87,
    chartData: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      values: [200, 250, 310, 360, 400, 460]
    },
    topPerformers: [
      { name: 'Ahmed Khan', accounts: 45 },
      { name: 'Sara Ali', accounts: 42 },
      { name: 'Usman Malik', accounts: 38 },
    ],
    lowStock: [
      { name: 'Sony LED 65"', stock: 5, category: 'TV' },
      { name: 'Dell Laptop', stock: 8, category: 'Computers' },
      { name: 'Samsung Galaxy S24', stock: 10, category: 'Mobile' },
      { name: 'LG Refrigerator', stock: 12, category: 'Appliances' },
    ],
    recentTransactions: [
      { customer: 'Ahmed Khan', amount: 12500, due: '2026-04-01' },
      { customer: 'Sara Ali', amount: 18000, due: '2026-04-02' },
      { customer: 'Usman Malik', amount: 8500, due: '2026-04-05' },
    ]
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

  const stats = [
    { label: 'Total Customers', value: data.customers.toLocaleString(), icon: Users },
    { label: 'Products in Stock', value: data.products.toLocaleString(), icon: Package },
    { label: 'Revenue', value: `PKR ${(data.revenue).toLocaleString()}`, icon: DollarSign },
    { label: 'Recovery Rate', value: `${data.recoveryRate}%`, icon: TrendingUp },
  ];

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="header-left">
          <h2>Dashboard</h2>
          <p className="branch-label">
            <Building size={16} />
            {data.name}
          </p>
        </div>
        {isAdmin && (
          <select 
            className="branch-select" 
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
          >
            <option value="all">All Branches</option>
            <option value="1">Branch 1</option>
            <option value="2">Branch 2</option>
          </select>
        )}
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

      <div className="stats-grid">
        {stats.map((stat, index) => (
          <StatsCard key={index} {...stat} />
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

      {/* ===== TOP PERFORMERS & LOW STOCK ===== */}
      <div className="performers-stock-grid">
        <div className="performers-section">
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

        <div className="low-stock-section">
          <h3>
            <AlertTriangle size={20} />
            Low Stock Alert
          </h3>
          <table className="low-stock-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Category</th>
                <th>Stock</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.lowStock.map((product, index) => (
                <tr key={index}>
                  <td>{product.name}</td>
                  <td>{product.category}</td>
                  <td>{product.stock}</td>
                  <td>
                    <span className={`stock-badge ${product.stock < 10 ? 'critical' : 'warning'}`}>
                      {product.stock < 10 ? 'Critical' : 'Warning'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="dashboard-bottom">
        <div className="recent-card">
          <h3>Recent Transactions</h3>
          <div className="transaction-list">
            {data.recentTransactions.map((item, index) => (
              <div key={index} className="transaction-item">
                <div>
                  <p className="customer">{item.customer}</p>
                  <p className="due">Due: {item.due}</p>
                </div>
                <span className="amount">PKR {item.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="recent-card">
          <h3>Branch Overview</h3>
          <div className="branch-overview">
            {selectedBranch === 'all' ? (
              <>
                <div className="branch-row">
                  <span>Branch 1</span>
                  <div className="bar-track">
                    <div className="bar-fill dark" style={{ width: '65%' }}></div>
                  </div>
                  <span>PKR 28,400,000</span>
                </div>
                <div className="branch-row">
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
        </div>
      </div>
    </div>
  );
};

export default Dashboard;