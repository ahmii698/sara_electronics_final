// src/components/EmployeeReport/EmployeeReport.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, Users, DollarSign, Calendar, Clock, TrendingUp, TrendingDown, 
  Filter, Download, Eye, Building, Award, Fuel, Briefcase, User, 
  BarChart, LineChart, PieChart, X, Activity, CheckCircle, AlertCircle, 
  AreaChart, ChevronDown, CalendarIcon, BookOpen, AlertTriangle, RefreshCw,
  Wallet, Sparkles
} from 'lucide-react';
import './EmployeeReport.css';
import { API_URL } from '../../../config';
import ExportButton from '../common/ExportButton';

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
  const [summary, setSummary] = useState(null);

  // ✅ CHART FILTER STATE - Simplified: Year + Month only
  const [chartYearFilter, setChartYearFilter] = useState('all');
  const [chartMonthFilter, setChartMonthFilter] = useState('all');

  // ✅ Year & Month Filters (for table)
  const [yearFilter, setYearFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');

  // ✅ Salary + Advances data
  const [salaryRecords, setSalaryRecords] = useState([]);
  const [advanceRecords, setAdvanceRecords] = useState([]);
  const [monthDetail, setMonthDetail] = useState(null);

  // ✅ Get user data and fetch immediately
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setUserRole(user.role);
      setUserBranch(user.branch);
    }
    fetchData();
  }, []);

  // ✅ useCallback - function memoize
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const [reportRes, salRes, advRes] = await Promise.all([
        fetch(`${API_URL}/employee-report`, { headers }),
        fetch(`${API_URL}/salary`, { headers }),
        fetch(`${API_URL}/salary/advances`, { headers })
      ]);

      const [data, salData, advData] = await Promise.all([
        reportRes.json(),
        salRes.json(),
        advRes.json()
      ]);

      console.log('Employee Report Data:', data);
      
      if (data.success) {
        const reportData = data.data;
        const employeesList = reportData.data || [];
        const summaryData = reportData.summary || {};
        
        setSummary(summaryData);
        setSalaryRecords(salData.success ? salData.data : []);
        setAdvanceRecords(advData.success ? advData.data : []);
        
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
            totalOverdue: emp.totalOverdue || 0,
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
  }, []);

  // ✅ Refresh function
  const handleRefresh = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const [reportRes, salRes, advRes] = await Promise.all([
        fetch(`${API_URL}/employee-report`, { headers }),
        fetch(`${API_URL}/salary`, { headers }),
        fetch(`${API_URL}/salary/advances`, { headers })
      ]);

      const [data, salData, advData] = await Promise.all([
        reportRes.json(),
        salRes.json(),
        advRes.json()
      ]);
      
      if (data.success) {
        const reportData = data.data;
        const employeesList = reportData.data || [];
        const summaryData = reportData.summary || {};
        
        setSummary(summaryData);
        setSalaryRecords(salData.success ? salData.data : []);
        setAdvanceRecords(advData.success ? advData.data : []);
        
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
            totalOverdue: emp.totalOverdue || 0,
          };
        });
        
        setEmployees(processedEmployees);
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  }, []);

  // ✅ ALL YEARS - 2020 se current year tak
  const getAllYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = 2020; year <= currentYear; year++) {
      years.push(String(year));
    }
    return years;
  };

  // ✅ ALL MONTHS - January to December
  const getAllMonths = () => {
    return ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
  };

  const getMonthName = (monthStr) => {
    if (monthStr === 'all') return 'All Months';
    const date = new Date(2000, parseInt(monthStr) - 1);
    return date.toLocaleString('default', { month: 'long' });
  };

  const getMonthNameFromKey = (monthStr) => {
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

  const getCurrentMonthKey = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  // ✅ Adds `delta` months to a "YYYY-MM" key (delta can be negative)
  const addMonthsToKey = (monthKey, delta) => {
    const [y, m] = monthKey.split('-').map(Number);
    const date = new Date(y, (m - 1) + delta, 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
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

  // ✅ GET FILTERED CHART DATA - hamesha 6 months, sahi anchor point ke sath
  // - Koi filter nahi: aaj ki real date se current month + pichle 5 months (latest-first)
  //   e.g. July chal raha ho to: July, June, May, April, March, Feb
  // - Sirf month select kiya (year ho ya na ho): us month se agle 5 months forward (ascending)
  //   e.g. Feb select kiya to: Feb, March, April, May, June, July
  // - Sirf year select kiya (month 'all'): us year ke andar last 6 months (ya current year
  //   ho to current month tak), latest-first
  const getFilteredChartData = (emp) => {
    let monthKeys = [];

    if (chartMonthFilter !== 'all') {
      // Month selected -> anchor month se agle 5 months forward (ascending order)
      const anchorYear = chartYearFilter !== 'all' ? chartYearFilter : String(new Date().getFullYear());
      const anchorMonthKey = `${anchorYear}-${chartMonthFilter}`;
      monthKeys = Array.from({ length: 6 }, (_, i) => addMonthsToKey(anchorMonthKey, i));
    } else if (chartYearFilter !== 'all') {
      // Sirf year selected -> us year ke last 6 months (agar current year hai to current month tak)
      const now = new Date();
      const isCurrentYear = parseInt(chartYearFilter) === now.getFullYear();
      const endMonthKey = isCurrentYear
        ? `${chartYearFilter}-${String(now.getMonth() + 1).padStart(2, '0')}`
        : `${chartYearFilter}-12`;
      monthKeys = Array.from({ length: 6 }, (_, i) => addMonthsToKey(endMonthKey, -i)); // latest-first
    } else {
      // Default -> aaj ki real date se current month + pichle 5 months, latest-first
      const currentKey = getCurrentMonthKey();
      monthKeys = Array.from({ length: 6 }, (_, i) => addMonthsToKey(currentKey, -i));
    }

    return {
      labels: monthKeys.map(m => getMonthNameFromKey(m)),
      accounts: monthKeys.map(m => emp.monthlyData[m]?.accountsOpened || 0),
      recovery: monthKeys.map(m => emp.monthlyData[m]?.recoveryAmount || 0),
      commission: monthKeys.map(m => emp.monthlyData[m]?.commission || 0),
      overdue: monthKeys.map(m => emp.monthlyData[m]?.overdue || 0),
    };
  };

  // ✅ NEW: Kisi employee ke kisi specific month ka pura salary detail
  const getMonthSalaryDetail = (emp, monthKey) => {
    const salaryRec = salaryRecords.find(s => s.user_id === emp.id && s.month === monthKey);
    const monthAdvances = advanceRecords.filter(a => 
      a.user_id === emp.id && a.date && a.date.slice(0, 7) === monthKey
    );
    const totalAdvances = monthAdvances.reduce((sum, a) => sum + parseFloat(a.amount || 0), 0);

    return {
      baseSalary: emp.salary || 0,
      commission: salaryRec ? parseFloat(salaryRec.commission || 0) : (emp.monthlyData[monthKey]?.commission || 0),
      status: salaryRec ? salaryRec.status : 'pending',
      paidDate: salaryRec ? salaryRec.paid_date : null,
      totalPaid: salaryRec ? parseFloat(salaryRec.total_paid || 0) : 0,
      advances: monthAdvances,
      totalAdvances,
    };
  };

  // ✅ EXPORT DATA - Employee Report ke liye
  const getExportData = () => {
    return displayEmployees.map(emp => {
      const currentOverdue = getCurrentMonthOverdue(emp);
      return {
        name: emp.name || 'N/A',
        email: emp.email || 'N/A',
        phone: emp.phone || 'N/A',
        branch: emp.branch === 1 ? 'Branch 1' : 'Branch 2',
        role: emp.role || 'employee',
        joiningDate: emp.joiningDate || 'N/A',
        salary: emp.salary || 0,
        totalAccounts: emp.totalAccounts || 0,
        totalRecovery: emp.totalRecovery || 0,
        totalCommission: emp.totalCommission || 0,
        totalOverdue: emp.totalOverdue || 0,
        currentMonthOverdue: currentOverdue || 0,
        currentMonth: getCurrentMonth()
      };
    });
  };

  const exportColumns = [
    { header: 'Employee Name', key: 'name' },
    { header: 'Email', key: 'email' },
    { header: 'Phone', key: 'phone' },
    { header: 'Branch', key: 'branch' },
    { header: 'Role', key: 'role' },
    { header: 'Joining Date', key: 'joiningDate' },
    { header: 'Salary', key: 'salary' },
    { header: 'Total Accounts', key: 'totalAccounts' },
    { header: 'Total Recovery', key: 'totalRecovery' },
    { header: 'Total Commission', key: 'totalCommission' },
    { header: 'Total Overdue', key: 'totalOverdue' },
    { header: 'Current Month Overdue', key: 'currentMonthOverdue' },
    { header: 'Month', key: 'currentMonth' },
  ];

  const chartTypes = [
    { id: 'bar', label: 'Bar', icon: BarChart },
    { id: 'line', label: 'Line', icon: LineChart },
    { id: 'pie', label: 'Pie', icon: PieChart },
    { id: 'area', label: 'Area', icon: Activity },
    { id: 'stacked', label: 'Stacked', icon: BarChart },
  ];

  const renderEmployeeChart = () => {
    if (!selectedEmployee) return null;
    
    const empData = getFilteredChartData(selectedEmployee);
    
    if (empData.labels.length === 0) {
      return <div className="chart-empty">No performance data available</div>;
    }
    
    const maxAccounts = Math.max(...empData.accounts, 1);
    const maxRecovery = Math.max(...empData.recovery.map(v => v/1000), 1);
    const maxOverdue = Math.max(...empData.overdue.map(v => v/1000), 1);

    const getAccountsHeight = (val) => (val / maxAccounts) * 140;
    const getRecoveryHeight = (val) => ((val/1000) / maxRecovery) * 140;
    const getOverdueHeight = (val) => ((val/1000) / maxOverdue) * 140;

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
                      className="chart-bar-4 bar-overdue" 
                      style={{ height: `${getOverdueHeight(empData.overdue[index])}px` }}
                    >
                      <span className="bar-value-4">{(empData.overdue[index]/1000).toFixed(1)}k</span>
                    </div>
                    <span className="bar-label-4">Overdue</span>
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
            <span><span className="legend-dot-4 red"></span> Overdue (max: {maxOverdue.toFixed(1)}k)</span>
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
                  `${(i / (empData.accounts.length - 1 || 1)) * 600},${220 - (val / maxAccounts) * 190}`
                ).join(' ')}
                fill="none"
                stroke="#C9A84C"
                strokeWidth="3"
              />
              <polyline
                points={empData.recovery.map((val, i) => 
                  `${(i / (empData.recovery.length - 1 || 1)) * 600},${220 - ((val/1000) / maxRecovery) * 190}`
                ).join(' ')}
                fill="none"
                stroke="#1A2A4A"
                strokeWidth="3"
                strokeDasharray="5,5"
              />
              <polyline
                points={empData.overdue.map((val, i) => 
                  `${(i / (empData.overdue.length - 1 || 1)) * 600},${220 - ((val/1000) / maxOverdue) * 190}`
                ).join(' ')}
                fill="none"
                stroke="#dc2626"
                strokeWidth="3"
                strokeDasharray="2,4"
              />
              {empData.labels.map((label, i) => (
                <text key={i} x={(i / (empData.labels.length - 1 || 1)) * 600} y="215" fontSize="10" fill="#6b7280" textAnchor="middle">{label}</text>
              ))}
            </svg>
            <div className="chart-legend-4">
              <span><span className="legend-dot-4 gold"></span> Accounts</span>
              <span><span className="legend-dot-4 dark"></span> Recovery (PKR'000)</span>
              <span><span className="legend-dot-4 red"></span> Overdue (PKR'000)</span>
            </div>
          </div>
        </div>
      );
    }

    if (modalChartType === 'pie') {
      const totalAccounts = empData.accounts.reduce((a, b) => a + b, 0);
      const totalRecovery = empData.recovery.reduce((a, b) => a + b, 0);
      const totalOverdue = empData.overdue.reduce((a, b) => a + b, 0);
      const pieData = [
        { label: 'Total Accounts', value: totalAccounts || 1, color: '#C9A84C' },
        { label: 'Total Recovery', value: (totalRecovery / 1000) || 1, color: '#1A2A4A' },
        { label: 'Total Overdue', value: (totalOverdue / 1000) || 1, color: '#dc2626' },
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
                  {(totalOverdue/1000).toFixed(1)}k Overdue
                </text>
              </svg>
            </div>
            <div className="chart-legend-4">
              <span><span className="legend-dot-4 gold"></span> Accounts ({totalAccounts})</span>
              <span><span className="legend-dot-4 dark"></span> Recovery ({(totalRecovery/1000).toFixed(1)}k)</span>
              <span><span className="legend-dot-4 red"></span> Overdue ({(totalOverdue/1000).toFixed(1)}k)</span>
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
                  `${(i / (empData.accounts.length - 1 || 1)) * 600},${220 - (val / maxAccounts) * 190}`
                ).join(' ')} 600,220`}
                fill="rgba(201, 168, 76, 0.3)"
                stroke="#C9A84C"
                strokeWidth="2"
              />
              <polygon
                points={`0,220 ${empData.recovery.map((val, i) => 
                  `${(i / (empData.recovery.length - 1 || 1)) * 600},${220 - ((val/1000) / maxRecovery) * 190}`
                ).join(' ')} 600,220`}
                fill="rgba(26, 42, 74, 0.3)"
                stroke="#1A2A4A"
                strokeWidth="2"
              />
              <polygon
                points={`0,220 ${empData.overdue.map((val, i) => 
                  `${(i / (empData.overdue.length - 1 || 1)) * 600},${220 - ((val/1000) / maxOverdue) * 190}`
                ).join(' ')} 600,220`}
                fill="rgba(220, 38, 38, 0.25)"
                stroke="#dc2626"
                strokeWidth="2"
              />
              {empData.labels.map((label, i) => (
                <text key={i} x={(i / (empData.labels.length - 1 || 1)) * 600} y="215" fontSize="10" fill="#6b7280" textAnchor="middle">{label}</text>
              ))}
            </svg>
            <div className="chart-legend-4">
              <span><span className="legend-dot-4 gold"></span> Accounts</span>
              <span><span className="legend-dot-4 dark"></span> Recovery (PKR'000)</span>
              <span><span className="legend-dot-4 red"></span> Overdue (PKR'000)</span>
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
              const odH = getOverdueHeight(empData.overdue[index]);
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
                      className="stacked-bar-4 overdue-bar-4" 
                      style={{ height: `${odH}px` }}
                    >
                      <span className="stacked-value-4">{(empData.overdue[index]/1000).toFixed(1)}k</span>
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
            <span><span className="legend-dot-4 red"></span> Overdue (PKR'000)</span>
          </div>
        </div>
      );
    }

    return null;
  };

  // ✅ Modal khulte hi hamesha 'all'/'all' se start hoga - default logic
  // ab khud aaj ki real date se sahi 6 months nikal leti hai
  const openDetailModal = (emp) => {
    setSelectedEmployee(emp);
    setChartYearFilter('all');
    setChartMonthFilter('all');
    setModalChartType('bar');
    setShowDetailModal(true);
  };

  const closeModal = () => {
    setShowDetailModal(false);
    setSelectedEmployee(null);
  };

  // ✅ GET CURRENT MONTH OVERDUE FOR EMPLOYEE
  const getCurrentMonthOverdue = (emp) => {
    const key = getCurrentMonthKey();
    return emp.monthlyData[key]?.overdue || 0;
  };

  const branchLabel = userBranch ? `Branch ${userBranch}` : 'All Branches';

  const totalRecovery = displayEmployees.reduce((sum, e) => sum + (e.totalRecovery || 0), 0);
  const totalCommission = displayEmployees.reduce((sum, e) => sum + (e.totalCommission || 0), 0);
  const totalAccounts = displayEmployees.reduce((sum, e) => sum + (e.totalAccounts || 0), 0);
  const totalOverdue = displayEmployees.reduce((sum, e) => sum + (e.totalOverdue || 0), 0);
  const totalEmployees = displayEmployees.length;

  const getEmployeeStats = (emp) => {
    const currentAccounts = emp.monthlyData[getCurrentMonthKey()]?.accountsOpened || 0;
    const currentOverdue = getCurrentMonthOverdue(emp);
    const monthlyRecovery = emp.monthlyData[getCurrentMonthKey()]?.recoveryAmount || 0;
    const totalOverdueVal = emp.totalOverdue || 0;

    return [
      { label: 'Total Accounts', value: emp.totalAccounts || 0, color: '#1E1B4B' },
      { label: `New Accounts (${currentMonth})`, value: currentAccounts || 0, color: '#2563eb' },
      { label: 'Monthly Recovery', value: `PKR ${(monthlyRecovery || 0).toLocaleString()}`, color: '#C9A84C' },
      { label: `Overdue (${currentMonth})`, value: `PKR ${(currentOverdue || 0).toLocaleString()}`, color: '#dc2626' },
      { label: 'Total Overdue', value: `PKR ${(totalOverdueVal || 0).toLocaleString()}`, color: '#ef4444' },
      { label: 'Salary', value: `PKR ${(emp.salary || 0).toLocaleString()}`, color: '#065f46' },
      { label: 'Total Commission', value: `PKR ${(emp.totalCommission || 0).toLocaleString()}`, color: '#8B5CF6' },
    ];
  };

  const isEmployee = userRole === 'employee';

  const summaryCards = isEmployee ? [
    { label: 'Total Accounts', value: totalAccounts || 0, icon: Briefcase, color: '#1E1B4B', bg: 'rgba(30,27,75,0.08)', className: 'accounts' },
    { label: 'Recovery Due', value: `PKR ${(totalRecovery || 0).toLocaleString()}`, icon: DollarSign, color: '#C9A84C', bg: 'rgba(201,168,76,0.12)', className: 'recovery' },
    { label: 'Total Overdue', value: `PKR ${(totalOverdue || 0).toLocaleString()}`, icon: AlertTriangle, color: '#dc2626', bg: 'rgba(220,38,38,0.1)', className: 'overdue' },
  ] : [
    { label: 'Total Employees', value: totalEmployees || 0, icon: Users, color: '#1E1B4B', bg: 'rgba(30,27,75,0.08)', className: 'users' },
    { label: 'Total Recovery', value: `PKR ${(totalRecovery || 0).toLocaleString()}`, icon: DollarSign, color: '#C9A84C', bg: 'rgba(201,168,76,0.12)', className: 'recovery' },
    { label: 'Total Accounts', value: totalAccounts || 0, icon: Briefcase, color: '#2563eb', bg: 'rgba(37,99,235,0.1)', className: 'accounts' },
    { label: 'Total Overdue', value: `PKR ${(totalOverdue || 0).toLocaleString()}`, icon: AlertTriangle, color: '#dc2626', bg: 'rgba(220,38,38,0.1)', className: 'overdue' },
    { label: 'Total Commission', value: `PKR ${(totalCommission || 0).toLocaleString()}`, icon: Award, color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)', className: 'commission' },
  ];

  const getEmployeeName = (id) => {
    const emp = employees.find(e => e.id === id);
    return emp ? emp.name : 'Select Employee';
  };

  // ✅ ALL YEARS AND MONTHS
  const allYears = getAllYears();
  const allMonths = getAllMonths();

  // ✅ FAST LOADING - Sirf pehli baar show karega
  if (loading && employees.length === 0) {
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
        <div className="header-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <ExportButton
            data={getExportData()}
            columns={exportColumns}
            filename="employee-report"
            title="Employee Report"
          />
          <button className="btn-refresh-small" onClick={handleRefresh} title="Refresh" style={{
            padding: '8px 12px',
            background: '#f3f4f6',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            cursor: 'pointer',
            color: '#4b5563',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            fontWeight: 600          }}>
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* ✅ YEAR & MONTH FILTERS */}
      <div className="report-controls" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
        <div className="search-wrapper" style={{ flex: 1, minWidth: '200px' }}>
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search employee..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-group" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="filter-item" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span className="filter-label" style={{ fontSize: '0.7rem', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase' }}>Year:</span>
            <select
              className="filter-select"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              style={{ padding: '0.35rem 0.7rem', border: '1.5px solid #e5e7eb', borderRadius: '0.4rem', fontSize: '0.8rem', fontWeight: 600, background: 'white', cursor: 'pointer' }}
            >
              <option value="all">All Years</option>
              {allYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div className="filter-item" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span className="filter-label" style={{ fontSize: '0.7rem', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase' }}>Month:</span>
            <select
              className="filter-select"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              style={{ padding: '0.35rem 0.7rem', border: '1.5px solid #e5e7eb', borderRadius: '0.4rem', fontSize: '0.8rem', fontWeight: 600, background: 'white', cursor: 'pointer' }}
            >
              <option value="all">All Months</option>
              {allMonths.map(month => (
                <option key={month} value={month}>{getMonthName(month)}</option>
              ))}
            </select>
          </div>

          {(yearFilter !== 'all' || monthFilter !== 'all') && (
            <button 
              className="btn-clear-filters"
              onClick={() => { setYearFilter('all'); setMonthFilter('all'); }}
              style={{ padding: '0.3rem 0.8rem', background: '#dbeafe', color: '#1e40af', border: 'none', borderRadius: '0.3rem', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600 }}
            >
              Clear
            </button>
          )}
        </div>

        {!userBranch && (
          <div className="branch-filters" style={{ display: 'flex', gap: '0.3rem' }}>
            <button className={`filter-btn ${branchFilter === 'all' ? 'active' : ''}`} onClick={() => setBranchFilter('all')}>All</button>
            <button className={`filter-btn branch-1 ${branchFilter === '1' ? 'active' : ''}`} onClick={() => setBranchFilter('1')}>Branch 1</button>
            <button className={`filter-btn branch-2 ${branchFilter === '2' ? 'active' : ''}`} onClick={() => setBranchFilter('2')}>Branch 2</button>
          </div>
        )}
      </div>

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
                <th style={{ fontWeight: 800 }}>Overdue ({currentMonth})</th>
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
                  const currentOverdue = getCurrentMonthOverdue(emp);
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
                      <td className="highlight-number" style={{ fontWeight: 800, color: '#1E1B4B' }}>{emp.totalAccounts || 0}</td>
                      <td style={{ fontWeight: 600 }}>PKR {(emp.totalRecovery || 0).toLocaleString()}</td>
                      <td style={{ fontWeight: 600 }}>PKR {(emp.totalCommission || 0).toLocaleString()}</td>
                      <td style={{ fontWeight: 600, color: currentOverdue > 0 ? '#dc2626' : '#1a1a2e' }}>PKR {(currentOverdue || 0).toLocaleString()}</td>
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

              {/* ✅ STATS ORDER CHANGED: Overdue pehle, Commission baad mein */}
              <div className="detail-summary-7">
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

              {/* ✅ CHART SECTION - SIMPLIFIED LIKE FIXED EXPENSES */}
              <div className="modal-chart-section">
                <div className="modal-chart-header">
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                    <Sparkles size={18} style={{ color: '#C9A84C', marginRight: '6px' }} />
                    Performance Trend (Last 6 Months)
                  </h4>
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

                {/* ✅ CHART FILTER - Year + Month (like Fixed Expenses) */}
                {selectedEmployee && Object.keys(selectedEmployee.monthlyData).length > 0 && (
                  <div className="chart-filter-bar" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', padding: '0.5rem 0', marginBottom: '0.5rem', background: '#f8fafc', borderRadius: '0.5rem', padding: '0.5rem 0.75rem' }}>
                    <div className="filter-item" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <span className="filter-label" style={{ fontSize: '0.65rem', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase' }}>Year:</span>
                      <select 
                        className="filter-select"
                        value={chartYearFilter}
                        onChange={(e) => setChartYearFilter(e.target.value)}
                        style={{ padding: '0.25rem 0.5rem', border: '1.5px solid #e5e7eb', borderRadius: '0.3rem', fontSize: '0.75rem', fontWeight: 600, background: 'white', cursor: 'pointer', minWidth: '70px' }}
                      >
                        <option value="all">All Years</option>
                        {allYears.map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                    <div className="filter-item" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <span className="filter-label" style={{ fontSize: '0.65rem', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase' }}>Month:</span>
                      <select 
                        className="filter-select"
                        value={chartMonthFilter}
                        onChange={(e) => setChartMonthFilter(e.target.value)}
                        style={{ padding: '0.25rem 0.5rem', border: '1.5px solid #e5e7eb', borderRadius: '0.3rem', fontSize: '0.75rem', fontWeight: 600, background: 'white', cursor: 'pointer', minWidth: '80px' }}
                      >
                        <option value="all">All Months</option>
                        {allMonths.map(month => (
                          <option key={month} value={month}>{getMonthName(month)}</option>
                        ))}
                      </select>
                    </div>
                    <span className="chart-range-info" style={{ fontSize: '0.7rem', fontWeight: 600, color: '#6b7280', marginLeft: 'auto' }}>
                      Showing {getFilteredChartData(selectedEmployee).labels.length} months
                    </span>
                  </div>
                )}

                <div className="modal-chart-container">
                  {renderEmployeeChart()}
                </div>
              </div>

              {/* ✅ MONTHLY BREAKDOWN */}
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
                        <th style={{ fontWeight: 800 }}>Overdue</th>
                        <th style={{ fontWeight: 800 }}>Commission</th>
                        <th style={{ fontWeight: 800 }}>Salary</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(selectedEmployee.monthlyData).map(([month, data]) => (
                        <tr key={month}>
                          <td className="month-name" style={{ fontWeight: 600 }}>{getMonthNameFromKey(month)}</td>
                          <td className="month-accounts" style={{ fontWeight: 700, color: '#1E1B4B' }}>{data.accountsOpened || 0}</td>
                          <td style={{ fontWeight: 600 }}>PKR {(data.recoveryAmount || 0).toLocaleString()}</td>
                          <td style={{ fontWeight: 600, color: (data.overdue || 0) > 0 ? '#dc2626' : '#1a1a2e' }}>
                            PKR {(data.overdue || 0).toLocaleString()}
                          </td>
                          <td style={{ fontWeight: 600 }}>PKR {(data.commission || 0).toLocaleString()}</td>
                          <td>
                            <button 
                              className="btn-view-detail" 
                              onClick={() => setMonthDetail({ emp: selectedEmployee, month })}
                              style={{ fontWeight: 700, padding: '4px 10px' }}
                            >
                              <Eye size={14} />
                              View
                            </button>
                          </td>
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

      {/* ✅ NEW: Month-wise Salary Detail Modal */}
      {monthDetail && (
        <div className="empreport-modal-overlay" onClick={() => setMonthDetail(null)} style={{ zIndex: 1100 }}>
          <div className="empreport-modal-content empreport-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="empreport-modal-header">
              <div className="empreport-modal-header-left">
                <DollarSign size={20} className="empreport-modal-icon" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                  {getMonthNameFromKey(monthDetail.month)} — Salary Detail
                </h3>
              </div>
              <button className="empreport-modal-close" onClick={() => setMonthDetail(null)}>
                <X size={22} />
              </button>
            </div>

            <div className="empreport-modal-body">
              {(() => {
                const d = getMonthSalaryDetail(monthDetail.emp, monthDetail.month);
                return (
                  <>
                    <div className="employee-detail-header small" style={{ marginBottom: '1rem' }}>
                      <div className="emp-detail-avatar small" style={{ background: '#1E1B4B' }}>
                        {monthDetail.emp.name.charAt(0)}
                      </div>
                      <div className="emp-detail-info">
                        <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{monthDetail.emp.name}</h4>
                        <span className="emp-detail-branch" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                          Branch {monthDetail.emp.branch}
                        </span>
                      </div>
                    </div>

                    <div className="history-summary">
                      <div className="summary-item" style={{ background: 'rgba(30,27,75,0.06)', borderRadius: '0.75rem' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>Salary</span>
                        <strong style={{ fontSize: '1.05rem', color: '#1E1B4B' }}>PKR {d.baseSalary.toLocaleString()}</strong>
                      </div>
                      <div className="summary-item" style={{ background: 'rgba(139,92,246,0.08)', borderRadius: '0.75rem' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>Commission</span>
                        <strong style={{ fontSize: '1.05rem', color: '#8B5CF6' }}>PKR {d.commission.toLocaleString()}</strong>
                      </div>
                      <div className="summary-item" style={{ background: 'rgba(34,197,94,0.08)', borderRadius: '0.75rem' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>Total Paid</span>
                        <strong style={{ fontSize: '1.05rem', color: '#22c55e' }}>PKR {d.totalPaid.toLocaleString()}</strong>
                      </div>
                    </div>

                    {d.advances.length > 0 ? (
                      <div className="advances-section" style={{ marginTop: '1rem' }}>
                        <div className="advances-header">
                          <Wallet size={16} style={{ color: '#92400e' }} />
                          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#92400e' }}>Advances Taken</h4>
                          <span className="advances-total" style={{ fontWeight: 700 }}>
                            Total: PKR {d.totalAdvances.toLocaleString()}
                          </span>
                        </div>
                        <table className="advances-table">
                          <thead>
                            <tr>
                              <th style={{ fontSize: '0.7rem', fontWeight: 700 }}>Date</th>
                              <th style={{ fontSize: '0.7rem', fontWeight: 700 }}>Amount</th>
                              <th style={{ fontSize: '0.7rem', fontWeight: 700 }}>Reason</th>
                            </tr>
                          </thead>
                          <tbody>
                            {d.advances.map((a, i) => (
                              <tr key={i}>
                                <td style={{ fontWeight: 600 }}>{(a.date || '').split(/[T ]/)[0]}</td>
                                <td style={{ color: '#dc2626', fontWeight: 700 }}>-PKR {parseFloat(a.amount || 0).toLocaleString()}</td>
                                <td style={{ fontWeight: 500 }}>{a.reason || 'No reason provided'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p style={{ marginTop: '1rem', color: '#6b7280', fontSize: '0.85rem' }}>
                        Is month koi advance nahi liya gaya.
                      </p>
                    )}

                    <div style={{ marginTop: '1rem', fontWeight: 700, fontSize: '0.85rem' }}>
                      Status:{' '}
                      <span style={{ color: d.status === 'paid' ? '#22c55e' : '#f59e0b' }}>
                        {d.status === 'paid' ? 'Paid' : 'Pending'}
                      </span>
                      {d.paidDate && <span style={{ color: '#6b7280', marginLeft: 8 }}>• Paid on {d.paidDate}</span>}
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="empreport-modal-footer">
              <button className="empreport-btn-cancel" onClick={() => setMonthDetail(null)} style={{ fontWeight: 700 }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeReport;