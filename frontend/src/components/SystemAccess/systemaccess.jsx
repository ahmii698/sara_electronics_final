// src/components/SystemAccess/SystemAccess.jsx

import React, { useState, useEffect } from 'react';
import { 
  Search, Users, User, Shield, Briefcase, Mail, Phone, 
  CreditCard, MapPin, Building, CheckCircle, XCircle,
  Eye, RefreshCw, AlertCircle, UserCheck, UserX,
  Download, Printer, ChevronDown, ChevronRight, X
} from 'lucide-react';
import './SystemAccess.css';
import { API_URL } from '../../../config';

const SystemAccess = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState({
    admin: [],
    manager: [],
    employee: []
  });
  const [summary, setSummary] = useState({
    total_admin: 0,
    total_manager: 0,
    total_employee: 0,
    total_users: 0
  });
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('all');
  const [userBranch, setUserBranch] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [expandedRoles, setExpandedRoles] = useState({
    admin: true,
    manager: true,
    employee: true
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setUserBranch(user.branch);
      setUserRole(user.role);
    }
    fetchUsers();
  }, []);

  // ✅ FETCH USERS - Branch wise (har koi sirf apni branch ke users)
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      
      // ✅ Agar user branch hai toh branch_id bhejo (Admin bhi)
      let url = `${API_URL}/system-access`;
      if (userBranch) {
        url += `?branch_id=${userBranch}`;
      }
      
      console.log('🔍 Fetching users for branch:', userBranch || 'All');
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      const data = await response.json();
      console.log('System Access Data:', data);

      if (data.success) {
        setUsers(data.data);
        setSummary(data.summary);
      } else {
        setError(data.message || 'Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleRoleExpand = (role) => {
    setExpandedRoles(prev => ({
      ...prev,
      [role]: !prev[role]
    }));
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  // ✅ FILTER USERS
  // Admins aren't tied to a single branch — they manage all branches — so an
  // admin should still show up no matter which branch is currently selected.
  // Managers/Employees DO belong to one branch, so they still get branch-filtered.
  const filterUsers = (usersList, applyBranchFilter = true) => {
    let filtered = usersList;
    
    // ✅ Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(user => 
        user.name?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.cnic?.toLowerCase().includes(searchLower) ||
        user.phone?.toLowerCase().includes(searchLower)
      );
    }

    // ✅ Branch filter (skipped entirely for admins)
    if (applyBranchFilter) {
      if (userBranch) {
        filtered = filtered.filter(user => 
          user.branch_id === parseInt(userBranch)
        );
      } else if (branchFilter !== 'all') {
        filtered = filtered.filter(user => 
          user.branch_id === parseInt(branchFilter)
        );
      }
    }

    return filtered;
  };

  // ✅ Branch-only filter (no search) — used to compute the summary cards so
  // the numbers always match what's actually visible for the current branch,
  // regardless of what backend "summary" totals were fetched.
  const filterByBranch = (usersList, applyBranchFilter = true) => {
    let filtered = usersList;

    if (applyBranchFilter) {
      if (userBranch) {
        filtered = filtered.filter(user => user.branch_id === parseInt(userBranch));
      } else if (branchFilter !== 'all') {
        filtered = filtered.filter(user => user.branch_id === parseInt(branchFilter));
      }
    }

    return filtered;
  };

  const getStatusBadge = (isActive) => {
    return isActive ? (
      <span className="status-badge active">
        <CheckCircle size={12} /> Active
      </span>
    ) : (
      <span className="status-badge inactive">
        <XCircle size={12} /> Inactive
      </span>
    );
  };

  const getRoleBadge = (role) => {
    const colors = {
      admin: { bg: '#dbeafe', color: '#1e40af' },
      manager: { bg: '#fef3c7', color: '#92400e' },
      employee: { bg: '#d1fae5', color: '#065f46' }
    };
    const config = colors[role] || colors.employee;
    return (
      <span className="role-badge" style={{ background: config.bg, color: config.color }}>
        {role?.toUpperCase()}
      </span>
    );
  };

  const openUserModal = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const closeUserModal = () => {
    setShowUserModal(false);
    setSelectedUser(null);
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-PK', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCNIC = (cnic) => {
    if (!cnic) return '-';
    const clean = cnic.replace(/[^0-9]/g, '');
    if (clean.length === 13) {
      return `${clean.slice(0, 5)}-${clean.slice(5, 12)}-${clean.slice(12)}`;
    }
    return cnic;
  };

  // ✅ TABLE RENDER FUNCTION
  const renderUserTable = (role, title, usersList, Icon) => {
    const filtered = filterUsers(usersList, role !== 'admin');
    const isExpanded = expandedRoles[role];
    const count = filtered.length;

    if (count === 0 && !search) {
      return null;
    }

    return (
      <div className="role-section">
        <div className="role-header" onClick={() => toggleRoleExpand(role)}>
          <div className="role-header-left">
            <Icon size={20} className="role-icon" />
            <h3 className="role-title">{title}</h3>
            <span className="role-count">{count}</span>
          </div>
          <div className="role-header-right">
            {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </div>
        </div>
        
        {isExpanded && (
          <div className="role-content">
            {filtered.length === 0 ? (
              <div className="no-users-message">
                <AlertCircle size={20} />
                <span>No {title?.toLowerCase()} found matching your search</span>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="user-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      {role !== 'admin' && <th>Branch</th>}
                      {role !== 'admin' && <th>Salary</th>}
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((user, index) => (
                      <tr key={user.id} onClick={() => openUserModal(user)}>
                        <td className="text-center">{index + 1}</td>
                        <td>
                          <div className="user-name-cell">
                            <div className="user-avatar-small" style={{
                              background: user.role === 'admin' ? '#dbeafe' : 
                                        user.role === 'manager' ? '#fef3c7' : '#d1fae5',
                              color: user.role === 'admin' ? '#1e40af' : 
                                     user.role === 'manager' ? '#92400e' : '#065f46'
                            }}>
                              {user.name?.charAt(0) || 'U'}
                            </div>
                            <span className="user-name-text">{user.name || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="user-email-text">{user.email || 'N/A'}</td>
                        <td>{user.phone || 'N/A'}</td>
                        {role !== 'admin' && (
                          <td>
                            <span className="branch-tag">
                              <Building size={12} />
                              {user.branch_name || 'N/A'}
                            </span>
                          </td>
                        )}
                        {role !== 'admin' && (
                          <td>PKR {user.salary?.toLocaleString() || '0'}</td>
                        )}
                        <td>{getStatusBadge(user.is_active)}</td>
                        <td>
                          <button className="btn-view-detail" onClick={(e) => {
                            e.stopPropagation();
                            openUserModal(user);
                          }}>
                            <Eye size={16} />
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // ===== USER DETAIL MODAL =====
  const UserDetailModal = () => {
    if (!selectedUser) return null;
    
    const user = selectedUser;

    return (
      <div className="modal-overlay" onClick={closeUserModal}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-header-left">
              <User size={24} className="modal-icon" />
              <div>
                <h3 className="modal-title">User Details</h3>
                <p className="modal-subtitle">{user.name || 'N/A'}</p>
              </div>
            </div>
            <button className="modal-close" onClick={closeUserModal}>
              <X size={24} />
            </button>
          </div>

          <div className="modal-body">
            <div className="profile-summary">
              <div className="profile-avatar" style={{
                background: user.role === 'admin' ? '#dbeafe' : 
                          user.role === 'manager' ? '#fef3c7' : '#d1fae5',
                color: user.role === 'admin' ? '#1e40af' : 
                       user.role === 'manager' ? '#92400e' : '#065f46'
              }}>
                {user.name?.charAt(0) || 'U'}
              </div>
              <div className="profile-info">
                <div className="profile-name">{user.name || 'N/A'}</div>
                <div className="profile-role">{getRoleBadge(user.role)}</div>
                <div className="profile-status">{getStatusBadge(user.is_active)}</div>
              </div>
            </div>

            <div className="details-grid">
              <div className="detail-item-full">
                <span className="detail-label">Full Name</span>
                <span className="detail-value">{user.name || 'N/A'}</span>
              </div>
              <div className="detail-item-full">
                <span className="detail-label">Email</span>
                <span className="detail-value">{user.email || 'N/A'}</span>
              </div>
              <div className="detail-item-full">
                <span className="detail-label">Phone</span>
                <span className="detail-value">{user.phone || 'N/A'}</span>
              </div>
              <div className="detail-item-full">
                <span className="detail-label">CNIC</span>
                <span className="detail-value">{formatCNIC(user.cnic)}</span>
              </div>
              <div className="detail-item-full">
                <span className="detail-label">Address</span>
                <span className="detail-value">{user.address || 'N/A'}</span>
              </div>
              {user.role !== 'admin' && (
                <div className="detail-item-full">
                  <span className="detail-label">Branch</span>
                  <span className="detail-value">{user.branch_name || 'N/A'}</span>
                </div>
              )}
              {user.role !== 'admin' && (
                <div className="detail-item-full">
                  <span className="detail-label">Salary</span>
                  <span className="detail-value">PKR {user.salary?.toLocaleString() || '0'}</span>
                </div>
              )}
              <div className="detail-item-full">
                <span className="detail-label">Joined Date</span>
                <span className="detail-value">{formatDate(user.created_at)}</span>
              </div>
              <div className="detail-item-full">
                <span className="detail-label">Last Updated</span>
                <span className="detail-value">{formatDate(user.updated_at)}</span>
              </div>
            </div>

            <div className="documents-section">
              <h4 className="documents-title">Documents</h4>
              <div className="documents-grid">
                <div className="document-item">
                  <span className="document-label">CNIC Front</span>
                  {user.cnic_front ? (
                    <a href={user.cnic_front} target="_blank" rel="noopener noreferrer" className="document-link">
                      View Document →
                    </a>
                  ) : (
                    <span className="document-na">Not Uploaded</span>
                  )}
                </div>
                <div className="document-item">
                  <span className="document-label">CNIC Back</span>
                  {user.cnic_back ? (
                    <a href={user.cnic_back} target="_blank" rel="noopener noreferrer" className="document-link">
                      View Document →
                    </a>
                  ) : (
                    <span className="document-na">Not Uploaded</span>
                  )}
                </div>
                <div className="document-item">
                  <span className="document-label">Agreement Form</span>
                  {user.agreement_form ? (
                    <a href={user.agreement_form} target="_blank" rel="noopener noreferrer" className="document-link">
                      View Document →
                    </a>
                  ) : (
                    <span className="document-na">Not Uploaded</span>
                  )}
                </div>
                <div className="document-item">
                  <span className="document-label">Voice Consent</span>
                  {user.voice_consent ? (
                    <a href={user.voice_consent} target="_blank" rel="noopener noreferrer" className="document-link">
                      Play Audio →
                    </a>
                  ) : (
                    <span className="document-na">Not Uploaded</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button className="btn-close-modal" onClick={closeUserModal}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="system-access-container">
        <div className="loading-state">
          <RefreshCw size={40} className="spinning" />
          <p>Loading system access data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="system-access-container">
        <div className="error-state">
          <AlertCircle size={40} />
          <h3>Error Loading Data</h3>
          <p>{error}</p>
          <button className="btn-retry" onClick={fetchUsers}>
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ✅ Branch label for header
  const branchLabel = userBranch ? `Branch ${userBranch}` : 'All Branches';

  // ✅ Real summary counts — computed from the branch-filtered lists themselves,
  // so these always match what's shown below (not a possibly-stale backend total)
  const branchAdmins = filterByBranch(users.admin, false); // admins: all branches
  const branchManagers = filterByBranch(users.manager);
  const branchEmployees = filterByBranch(users.employee);
  const displaySummary = {
    total_admin: branchAdmins.length,
    total_manager: branchManagers.length,
    total_employee: branchEmployees.length,
    total_users: branchAdmins.length + branchManagers.length + branchEmployees.length
  };

  return (
    <div className="system-access-container">
      {showUserModal && <UserDetailModal />}

      {/* Header */}
      <div className="system-access-header">
        <div className="header-left">
          <div className="header-title-group">
            <h2>System Access</h2>
            <span className="live-badge">
              <Users size={12} /> Live
            </span>
          </div>
          <p className="header-subtitle">
            {userBranch 
              ? `Showing users for ${branchLabel}` 
              : 'Manage and view all system users'}
          </p>
        </div>
        <button className="btn-refresh" onClick={fetchUsers}>
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card admin-card">
          <div className="summary-icon" style={{ background: '#dbeafe', color: '#1e40af' }}>
            <Shield size={22} />
          </div>
          <div className="summary-info">
            <span className="summary-label">Total Admins</span>
            <span className="summary-value">{displaySummary.total_admin}</span>
          </div>
        </div>
        <div className="summary-card manager-card">
          <div className="summary-icon" style={{ background: '#fef3c7', color: '#92400e' }}>
            <Briefcase size={22} />
          </div>
          <div className="summary-info">
            <span className="summary-label">Total Managers</span>
            <span className="summary-value">{displaySummary.total_manager}</span>
          </div>
        </div>
        <div className="summary-card employee-card">
          <div className="summary-icon" style={{ background: '#d1fae5', color: '#065f46' }}>
            <User size={22} />
          </div>
          <div className="summary-info">
            <span className="summary-label">Total Employees</span>
            <span className="summary-value">{displaySummary.total_employee}</span>
          </div>
        </div>
        <div className="summary-card total-card">
          <div className="summary-icon" style={{ background: '#ede9fe', color: '#5b21b6' }}>
            <Users size={22} />
          </div>
          <div className="summary-info">
            <span className="summary-label">Total Users</span>
            <span className="summary-value">{displaySummary.total_users}</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="system-controls">
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search by name, email, CNIC or phone..."
            value={search}
            onChange={handleSearch}
            className="search-input"
          />
        </div>
        
        {/* ✅ Branch filters - Sirf tab dikhe jab userBranch nahi hai */}
        {!userBranch && (
          <div className="branch-filters">
            <button 
              className={`filter-btn ${branchFilter === 'all' ? 'active' : ''}`}
              onClick={() => setBranchFilter('all')}
            >
              All Branches
            </button>
            <button 
              className={`filter-btn ${branchFilter === '1' ? 'active' : ''}`}
              onClick={() => setBranchFilter('1')}
            >
              Branch 1
            </button>
            <button 
              className={`filter-btn ${branchFilter === '2' ? 'active' : ''}`}
              onClick={() => setBranchFilter('2')}
            >
              Branch 2
            </button>
          </div>
        )}
        
        {/* ✅ Agar user branch hai toh branch info show karo (sirf yahan ek hi jagah) */}
        {userBranch && (
          <div className="branch-info-badge">
            <Building size={14} />
            <span>Branch {userBranch} (Your Current Branch)</span>
          </div>
        )}
      </div>

      {/* Role Sections - TABLE FORMAT */}
      <div className="roles-container">
        {renderUserTable('admin', 'Admins', users.admin, Shield)}
        {renderUserTable('manager', 'Managers', users.manager, Briefcase)}
        {renderUserTable('employee', 'Employees', users.employee, User)}
      </div>

      {/* Export */}
      <div className="system-footer">
        <button className="btn-export" onClick={() => window.print()}>
          <Printer size={16} />
          Print Report
        </button>
        <span className="total-record-text">
          Total {displaySummary.total_users} users across all roles
        </span>
      </div>
    </div>
  );
};

export default SystemAccess;