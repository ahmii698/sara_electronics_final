import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Login from './components/Login/Login';
import Inventory from './components/Inventory/Inventory';
import Salary from './components/Finance/Salary';
import FixedExpense from './components/Finance/FixedExpense';
import ExtraExpense from './components/Finance/ExtraExpense';
import AddAccount from './components/Accounts/AddAccount';
import Recovery from './components/Recovery/Recovery';
import AddEmployee from './components/Employees/AddEmployee';
import EmployeeExpenses from './components/Employees/EmployeeExpenses';
import EmployeeReport from './components/Employees/EmployeeReport';
import OverdueInstallments from './components/OverdueInstallments/OverdueInstallments';
import AgingReport from './components/Reports/AgingReport';
import EmployeePerformanceReport from './components/Reports/EmployeePerformanceReport';
import UsersManagement from './components/Users/Users';
import Installments from './components/Installments/Installments'; // ✅ ADD THIS
import Leaveapplication from './components/leave/Leaveapplication'; // ✅ ADD THIS - Leave Application
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import './App.css';

// ✅ Employee sirf inhi paths pe ja sakta hai — Apply Leave yahan add ki
const EMPLOYEE_ALLOWED_PATHS = ['/employee-performance', '/apply-leave'];

const ProtectedRoute = ({ children, allowedRoles }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Employee - sirf allowed paths (Performance + Apply Leave)
  if (user.role === 'employee') {
    if (EMPLOYEE_ALLOWED_PATHS.includes(location.pathname)) {
      return children;
    }
    return <Navigate to="/employee-performance" />;
  }

  // Manager - dashboard par nahi ja sakta
  if (user.role === 'manager' && location.pathname === '/') {
    return <Navigate to="/add-account" />;
  }

  // Manager - Finance restricted (Salary aur Fixed, Extra ab bahar hai)
  if (user.role === 'manager') {
    const restrictedPaths = ['/finance/salary', '/finance/fixed'];
    if (restrictedPaths.includes(location.pathname)) {
      return <Navigate to="/add-account" />;
    }
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/add-account" />;
  }

  return children;
};

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  return (
    <BrowserRouter>
      {isLoggedIn ? (
        <div className="app-container">
          <Sidebar />
          <div className="main-content">
            <Header />
            <div className="page-content">
              <Routes>
                <Route 
                  path="/" 
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <Home />
                    </ProtectedRoute>
                  } 
                />

                <Route path="/inventory" element={<Inventory />} />

                <Route 
                  path="/finance/salary" 
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <Salary />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/finance/fixed" 
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <FixedExpense />
                    </ProtectedRoute>
                  } 
                />

                <Route path="/extra-expenses" element={<ExtraExpense />} />
                <Route path="/add-account" element={<AddAccount />} />
                <Route path="/recovery" element={<Recovery />} />
                <Route path="/employees/add" element={<AddEmployee />} />
                <Route path="/employee-expenses" element={<EmployeeExpenses />} />
                <Route path="/employee-report" element={<EmployeeReport />} />
                <Route path="/employee-performance" element={<EmployeePerformanceReport />} />
                <Route path="/overdue-installments" element={<OverdueInstallments />} />
                <Route path="/aging-report" element={<AgingReport />} />

                {/* ===== USERS ROUTE - ADMIN/MANAGER KE LIYE ===== */}
                <Route path="/users" element={<UsersManagement />} />

                {/* ===== INSTALLMENTS ROUTE - ADMIN/MANAGER KE LIYE ===== */}
                <Route path="/installments" element={<Installments />} />

                {/* ===== LEAVE APPLICATION ROUTE - ADMIN/MANAGER/EMPLOYEE SABKE LIYE ===== */}
                <Route path="/apply-leave" element={<Leaveapplication />} />

                <Route path="/login" element={<Navigate to="/" />} />
              </Routes>
            </div>
          </div>
        </div>
      ) : (
        <Routes>
          <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      )}
    </BrowserRouter>
  );
};

export default App;