// src/components/Layout/Sidebar.jsx

import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Home, Package, DollarSign, Users as UsersIcon, FileText, 
  LogOut, ChevronDown, ChevronRight, UserPlus, Receipt, 
  BarChart3, Clock, LayoutDashboard, AlertTriangle, 
  TrendingUp, PlusCircle, Menu, X, Calendar, 
  UserCheck, Award, Settings, Shield, Building,
  Bell, Target
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
  // ✅ FINANCE SUB-ITEMS - Admin only
  // ============================================
  const financeItems = isAdmin ? [
    { path: '/finance/salary', label: 'Employee Salary' },
    { path: '/finance/fixed', label: 'Fixed Expenses' }
  ] : [];

  // ============================================
  // ✅ UPDATED ORDER - Selected Recovery REMOVED
  // Dashboard -> Finance -> Account Target -> Extra Expenses ->
  // Employee Report -> Employee Performance -> Users -> Add Account ->
  // Alert -> Recovery -> Aging Accounts -> Overdue Accounts ->
  // Employee Leave -> Add Employees -> System Access
  // ============================================
  const menuItems = [
    {
      type: 'link',
      path: '/',
      icon: Home,
      label: 'Dashboard',
      show: isAdmin
    },
    {
      type: 'dropdown',
      key: 'finance',
      icon: DollarSign,
      label: 'Finance',
      items: financeItems,
      show: isAdmin && financeItems.length > 0
    },
    {
      type: 'link',
      path: '/account-target',
      icon: Target,
      label: 'Account Target',
      show: isAdmin || isManager
    },
    {
      type: 'link',
      path: '/extra-expenses',
      icon: PlusCircle,
      label: 'Extra Expenses',
      show: isAdmin || isManager
    },
    {
      type: 'link',
      path: '/employee-report',
      icon: BarChart3,
      label: 'Employee Report',
      show: isAdmin || isManager
    },
    {
      type: 'link',
      path: '/employee-performance',
      icon: TrendingUp,
      label: 'Employee Performance',
      show: isEmployee || isAdmin || isManager
    },
    {
      type: 'link',
      path: '/users',
      icon: UsersIcon,
      label: 'Users',
      show: isAdmin || isManager
    },
    {
      type: 'link',
      path: '/add-account',
      icon: UserPlus,
      label: 'Add Account',
      show: isAdmin || isManager
    },
    {
      type: 'link',
      path: '/alert',
      icon: Bell,
      label: 'Alert',
      show: isAdmin || isManager
    },
    {
      type: 'link',
      path: '/installments',
      icon: FileText,
      label: 'Recovery',
      show: isAdmin || isManager
    },
    // ✅ Selected Recovery REMOVED
    {
      type: 'link',
      path: '/overdue-installments',
      icon: Clock,
      label: 'Aging Accounts',
      show: isAdmin || isManager
    },
    {
      type: 'link',
      path: '/aging-report',
      icon: AlertTriangle,
      label: 'Overdue Accounts',
      show: isAdmin || isManager
    },
    {
      type: 'link',
      path: '/apply-leave',
      icon: Calendar,
      label: 'Employee Leave',
      show: isAdmin || isManager
    },
    {
      type: 'link',
      path: '/employees/add',
      icon: UsersIcon,
      label: 'Add Employees',
      show: isAdmin || isManager
    },
    {
      type: 'link',
      path: '/system-access',
      icon: Shield,
      label: 'System Access',
      show: isAdmin
    }
  ];

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
          {menuItems.map((item) => {
            if (!item.show) return null;

            // ✅ Finance dropdown
            if (item.type === 'dropdown') {
              return (
                <div className="nav-dropdown" key={item.key}>
                  <div
                    className={`nav-item dropdown-toggle ${isFinanceOpen ? 'active' : ''}`}
                    onClick={toggleFinance}
                  >
                    <item.icon size={20} />
                    <span>{item.label}</span>
                    {isFinanceOpen ? (
                      <ChevronDown size={18} className="dropdown-icon" />
                    ) : (
                      <ChevronRight size={18} className="dropdown-icon" />
                    )}
                  </div>

                  <div className={`sub-menu ${isFinanceOpen ? 'open' : ''}`}>
                    {item.items.map((sub) => (
                      <NavLink
                        key={sub.path}
                        to={sub.path}
                        className={({ isActive }) => `sub-nav-item ${isActive ? 'active' : ''}`}
                        onClick={closeSidebar}
                      >
                        <span>{sub.label}</span>
                      </NavLink>
                    ))}
                  </div>
                </div>
              );
            }

            // ✅ Normal nav link
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
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