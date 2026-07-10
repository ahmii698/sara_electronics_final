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
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Employee - Overdue Installments aur Employee Report allow
  if (user.role === 'employee') {
    if (location.pathname === '/overdue-installments' || 
        location.pathname === '/employee-report') {
      return children;
    }
    return <Navigate to="/overdue-installments" />;
  }

  // Manager - dashboard par nahi ja sakta
  if (user.role === 'manager' && location.pathname === '/') {
    return <Navigate to="/add-account" />;
  }

  // Manager - Finance restricted
  if (user.role === 'manager') {
    const restrictedPaths = ['/finance/salary', '/finance/fixed', '/finance/extra'];
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
                <Route 
                  path="/finance/extra" 
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <ExtraExpense />
                    </ProtectedRoute>
                  } 
                />

                <Route path="/add-account" element={<AddAccount />} />
                <Route path="/recovery" element={<Recovery />} />
                <Route path="/employees/add" element={<AddEmployee />} />
                <Route path="/employee-expenses" element={<EmployeeExpenses />} />
                
                {/* ===== EMPLOYEE REPORT - ADMIN, MANAGER, EMPLOYEE SABKO ===== */}
                <Route path="/employee-report" element={<EmployeeReport />} />
                
                {/* ===== OVERDUE INSTALLMENTS - SABKO ===== */}
                <Route path="/overdue-installments" element={<OverdueInstallments />} />

                {/* ===== AGING REPORT - ADMIN AUR MANAGER ===== */}
                <Route path="/aging-report" element={<AgingReport />} />

                {/* ===== EMPLOYEE PERFORMANCE REPORT - ADMIN AUR MANAGER ===== */}
                <Route path="/employee-performance" element={<EmployeePerformanceReport />} />

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