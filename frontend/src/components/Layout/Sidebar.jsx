// src/components/Layout/Sidebar.jsx

import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Home, Package, DollarSign, Users as UsersIcon, FileText, 
  LogOut, ChevronDown, ChevronRight, UserPlus, Receipt, 
  BarChart3, Clock, LayoutDashboard, AlertTriangle, 
  TrendingUp, PlusCircle, Menu, X, Calendar, 
  UserCheck, Award, Settings, Shield, Building
} from 'lucide-react';
import './Sidebar.css';
import logo from '../../assets/logo.jpeg';

const Sidebar = () => {
  const navigate = useNavigate();
  const [isFinanceOpen, setIsFinanceOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userBranch, setUserBranch] = useState(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setUserRole(user.role);
      setUserBranch(user.branch);
    }

    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 480);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
    window.location.reload();
  };

  const toggleFinance = (e) => {
    e.stopPropagation();
    setIsFinanceOpen(!isFinanceOpen);
  };

  const toggleSidebar = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const closeSidebar = () => {
    if (isMobile) {
      setIsMobileOpen(false);
    }
  };

  const isAdmin = userRole === 'admin';
  const isManager = userRole === 'manager';
  const isEmployee = userRole === 'employee';

  // ============================================
  // ✅ DASHBOARD - Admin only
  // ============================================
  const navItems = [];
  if (isAdmin) {
    navItems.push({
      path: '/',
      icon: Home,
      label: 'Dashboard'
    });
  }

  // ============================================
  // ✅ MY PERFORMANCE - All can see
  // ============================================
  if (isEmployee || isAdmin || isManager) {
    navItems.push({
      path: '/employee-performance',
      icon: TrendingUp,
      label: 'My Performance'
    });
  }

  // ============================================
  // ✅ APPLY LEAVE - All can see (Admin, Manager, Employee)
  // ============================================
  if (isEmployee || isAdmin || isManager) {
    navItems.push({
      path: '/apply-leave',
      icon: Calendar,
      label: 'Apply Leave'
    });
  }

  // ============================================
  // ✅ FINANCE DROPDOWN - Admin only
  // ============================================
  const financeItems = isAdmin ? [
    { path: '/finance/salary', label: 'Employee Salary' },
    { path: '/finance/fixed', label: 'Fixed Expenses' }
  ] : [];

  // ============================================
  // ✅ OTHER ITEMS - Admin & Manager
  // ============================================
  const otherItems = [];
  if (isAdmin || isManager) {
    otherItems.push(
      { path: '/extra-expenses', icon: PlusCircle, label: 'Extra Expenses' },
      { path: '/employee-report', icon: BarChart3, label: 'Employee Report' },
      { path: '/overdue-installments', icon: Clock, label: 'Overdue Installments' },
      { path: '/aging-report', icon: AlertTriangle, label: 'Aging Report' },
      { path: '/add-account', icon: UserPlus, label: 'Add Account' },
      { path: '/installments', icon: FileText, label: 'Recovery' },
      { path: '/users', icon: UsersIcon, label: 'Users' },
      { path: '/employees/add', icon: UsersIcon, label: 'Employees' }
    );
  }

  // ============================================
  // ✅ SYSTEM ACCESS - SIRF ADMIN KO DIKHEGA
  // ============================================
  // 👇 System Access ko ALAG SE PUSH KARO
  if (isAdmin) {
    otherItems.push({
      path: '/system-access',
      icon: Shield,
      label: 'System Access'
    });
  }

  return (
    <>
      {/* Mobile Toggle Button */}
      <button className="sidebar-toggle" onClick={toggleSidebar}>
        {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <div className={`sidebar ${isMobile ? (isMobileOpen ? 'open' : '') : ''}`}>
        <div className="sidebar-logo">
          <img src={logo} alt="SARA Electronics" className="logo-image" />
          <h1 className="brand-title">SARA <span>Electronics</span></h1>
          <p className="brand-subtitle">
            {isEmployee ? 'EMPLOYEE PANEL' : isAdmin ? 'ADMIN PANEL' : 'MANAGER PANEL'}
          </p>
          {userBranch && (
            <p className="brand-branch">Branch {userBranch}</p>
          )}
        </div>

        <nav className="sidebar-nav">
          {/* Regular Nav Items */}
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={closeSidebar}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}

          {/* Finance Dropdown (Admin only) */}
          {isAdmin && financeItems.length > 0 && (
            <div className="nav-dropdown">
              <div 
                className={`nav-item dropdown-toggle ${isFinanceOpen ? 'active' : ''}`} 
                onClick={toggleFinance}
              >
                <DollarSign size={20} />
                <span>Finance</span>
                {isFinanceOpen ? <ChevronDown size={18} className="dropdown-icon" /> : <ChevronRight size={18} className="dropdown-icon" />}
              </div>
              
              <div className={`sub-menu ${isFinanceOpen ? 'open' : ''}`}>
                {financeItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) => `sub-nav-item ${isActive ? 'active' : ''}`}
                    onClick={closeSidebar}
                  >
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          )}

          {/* Other Items (Admin & Manager) */}
          {otherItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={closeSidebar}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user-info">
            <span className="user-role">{userRole?.toUpperCase()}</span>
            {userBranch && <span className="user-branch">Branch {userBranch}</span>}
          </div>
          <div className="nav-item logout-btn" onClick={handleLogout}>
            <LogOut size={20} />
            <span>Logout</span>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isMobile && isMobileOpen && (
        <div className="sidebar-overlay open" onClick={toggleSidebar}></div>
      )}
    </>
  );
};

export default Sidebar;