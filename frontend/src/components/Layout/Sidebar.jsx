import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Package, DollarSign, Users, FileText, LogOut, ChevronDown, ChevronRight, UserPlus, Receipt, BarChart3, Clock, LayoutDashboard, AlertTriangle, TrendingUp, PlusCircle } from 'lucide-react';
import './Sidebar.css';
import logo from '../../assets/logo.jpeg';

const Sidebar = () => {
  const navigate = useNavigate();
  const [isFinanceOpen, setIsFinanceOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userBranch, setUserBranch] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setUserRole(user.role);
      setUserBranch(user.branch);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
    window.location.reload();
  };

  const toggleFinance = () => {
    setIsFinanceOpen(!isFinanceOpen);
  };

  const isAdmin = userRole === 'admin';
  const isManager = userRole === 'manager';
  const isEmployee = userRole === 'employee';

  return (
    <div className="sidebar">
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
        {/* ===== EMPLOYEE - SIRF MY PERFORMANCE ===== */}
        {isEmployee && (
          <NavLink
            to="/employee-performance"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <TrendingUp size={20} />
            <span>My Performance</span>
          </NavLink>
        )}

        {/* ===== DASHBOARD - SIRF ADMIN ===== */}
        {isAdmin && (
          <NavLink
            to="/"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Home size={20} />
            <span>Dashboard</span>
          </NavLink>
        )}

        {/* ===== FINANCE - SIRF ADMIN ===== */}
        {isAdmin && (
          <div className="nav-dropdown">
            <div className={`nav-item dropdown-toggle ${isFinanceOpen ? 'active' : ''}`} onClick={toggleFinance}>
              <DollarSign size={20} />
              <span>Finance</span>
              {isFinanceOpen ? <ChevronDown size={18} className="dropdown-icon" /> : <ChevronRight size={18} className="dropdown-icon" />}
            </div>
            
            <div className={`sub-menu ${isFinanceOpen ? 'open' : ''}`}>
              <NavLink
                to="/finance/salary"
                className={({ isActive }) => `sub-nav-item ${isActive ? 'active' : ''}`}
              >
                <span>Employee Salary</span>
              </NavLink>
              <NavLink
                to="/finance/fixed"
                className={({ isActive }) => `sub-nav-item ${isActive ? 'active' : ''}`}
              >
                <span>Fixed Expenses</span>
              </NavLink>
            </div>
          </div>
        )}

        {/* ===== EXTRA EXPENSES - ADMIN AUR MANAGER DONO (Finance se bahar) ===== */}
        {(isAdmin || isManager) && (
          <NavLink
            to="/extra-expenses"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <PlusCircle size={20} />
            <span>Extra Expenses</span>
          </NavLink>
        )}

        {/* ===== EMPLOYEE REPORT - ADMIN AUR MANAGER ===== */}
        {(isAdmin || isManager) && (
          <NavLink
            to="/employee-report"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <BarChart3 size={20} />
            <span>Employee Report</span>
          </NavLink>
        )}

        {/* ===== EMPLOYEE PERFORMANCE - ADMIN AUR MANAGER ===== */}
        {(isAdmin || isManager) && (
          <NavLink
            to="/employee-performance"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <TrendingUp size={20} />
            <span>Employee Performance</span>
          </NavLink>
        )}

        {/* ===== OVERDUE INSTALLMENTS - ADMIN AUR MANAGER ===== */}
        {(isAdmin || isManager) && (
          <NavLink
            to="/overdue-installments"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Clock size={20} />
            <span>Overdue Installments</span>
          </NavLink>
        )}

        {/* ===== AGING REPORT - ADMIN AUR MANAGER ===== */}
        {(isAdmin || isManager) && (
          <NavLink
            to="/aging-report"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <AlertTriangle size={20} />
            <span>Aging Report</span>
          </NavLink>
        )}

        {/* ===== ADD ACCOUNT - ADMIN AUR MANAGER ===== */}
        {(isAdmin || isManager) && (
          <NavLink
            to="/add-account"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <UserPlus size={20} />
            <span>Add Account</span>
          </NavLink>
        )}

        {/* ===== RECOVERY - ADMIN AUR MANAGER ===== */}
        {(isAdmin || isManager) && (
          <NavLink
            to="/recovery"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <FileText size={20} />
            <span>Recovery</span>
          </NavLink>
        )}

        {/* ===== EMPLOYEES - ADMIN AUR MANAGER ===== */}
        {(isAdmin || isManager) && (
          <NavLink
            to="/employees/add"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Users size={20} />
            <span>Employees</span>
          </NavLink>
        )}
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
  );
};

export default Sidebar;