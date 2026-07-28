// src/components/SystemAccess/SystemAccess.jsx

import React, { useState, useEffect } from 'react';
import { 
  Search, Users, User, Shield, Briefcase, Mail, Phone, 
  CreditCard, MapPin, Building, CheckCircle, XCircle,
  Eye, RefreshCw, AlertCircle, UserCheck, UserX,
  Download, Printer, ChevronDown, ChevronRight, X,
  Key, Lock, Unlock, UserCog
} from 'lucide-react';
import './SystemAccess.css';
import { API_URL } from '../../../config';
import ExportButton from '../common/ExportButton';

const SystemAccess = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState({
    admin: [],
    manager: [],
    employee: [],
    systemAccess: []
  });
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('all');
  const [userBranch, setUserBranch] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    admin: true,
    manager: true,
    employee: true,
    systemAccess: true
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [error, setError] = useState(null);

  // NAYA: Grant/Revoke access ke baad ek chhota sa success/error message
  const [actionMessage, setActionMessage] = useState(null);

  useEffect(() => {
    if (actionMessage) {
      const timer = setTimeout(() => setActionMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [actionMessage]);

  // ============================================
  // NAYA: GRANT / REVOKE SYSTEM ACCESS
  // ============================================
  const handleToggleAccess = async (userItem) => {
    const grantingAccess = !userItem.has_system_access;
    const confirmMsg = grantingAccess
      ? `${userItem.name} ko system access de diya jaye?`
      : `${userItem.name} ka system access wapas le liya jaye?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/system-access/${userItem.id}/toggle`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ has_system_access: grantingAccess })
      });

      const data = await response.json();

      if (data.success) {
        setUsers(prev => {
          const updatedEmployees = prev.employee.map(e =>
            e.id === userItem.id ? { ...e, has_system_access: grantingAccess } : e
          );
          return {
            ...prev,
            employee: updatedEmployees,
            systemAccess: updatedEmployees.filter(e => !!e.has_system_access)
          };
        });

        setActionMessage({
          type: 'success',
          text: grantingAccess
            ? `${userItem.name} ko system access de diya gaya.`
            : `${userItem.name} ka system access wapas le liya gaya.`
        });
      } else {
        setActionMessage({
          type: 'error',
          text: data.message || 'Access update nahi ho saka.'
        });
      }
    } catch (err) {
      console.error('Toggle access error:', err);
      setActionMessage({ type: 'error', text: 'Network error. Please try again.' });
    }
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      // ✅ FIX: Login.jsx mein session object ka key "branch" hai, "branch_id" nahi.
      // Pehle "user.branch_id" padha ja raha tha jo hamesha undefined tha
      // (chahe admin ho, manager ho ya employee), isliye userBranch state
      // kabhi set hi nahi hoti thi aur branch-wise filtering kaam nahi kar rahi thi
      // — dono branches ka data mix ho ke dikh raha tha.
      setUserBranch(user.branch);
      setUserRole(user.role);
    }
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');

      const url = `${API_URL}/users?paginate=0`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      const data = await response.json();
      console.log('Users Data:', data);

      if (data.success) {
        const allUsers = data.data || [];

        const admins = allUsers.filter(u => u.role === 'admin');
        const managers = allUsers.filter(u => u.role === 'manager');
        const employees = allUsers.filter(u => u.role === 'employee');

        const systemAccessUsers = employees.filter(u => !!u.has_system_access);

        setUsers({
          admin: admins,
          manager: managers,
          employee: employees,
          systemAccess: systemAccessUsers
        });
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

  const toggleSectionExpand = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  const filterUsers = (usersList, applyBranchFilter = true) => {
    let filtered = usersList;

    if (applyBranchFilter) {
      if (userBranch) {
        filtered = filtered.filter(user => String(user.branch_id) === String(userBranch));
      } else if (branchFilter !== 'all') {
        filtered = filtered.filter(user => String(user.branch_id) === String(branchFilter));
      }
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(user =>
        user.name?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.cnic?.toLowerCase().includes(searchLower) ||
        user.phone?.toLowerCase().includes(searchLower)
      );
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

  const getAccessBadge = (hasAccess) => {
    return hasAccess ? (
      <span className="status-badge active" style={{ background: '#dbeafe', color: '#1e40af' }}>
        <Key size={12} /> Access Granted
      </span>
    ) : (
      <span className="status-badge inactive" style={{ background: '#fef3c7', color: '#92400e' }}>
        <Lock size={12} /> No Access
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

  // ✅ UPDATED: ab creator ki email bhi naam ke neeche dikhegi
  const getCreatedByDisplay = (user) => {
    const creator = user.created_by;

    // Relation load nahi hui / creator record delete ho chuka / purana record hai
    if (!creator || typeof creator !== 'object') {
      return <span className="document-na">System / N/A</span>;
    }

    const roleLabel = creator.role
      ? creator.role.charAt(0).toUpperCase() + creator.role.slice(1)
      : '';
    const branchLabel = creator.branch_id ? ` - Branch ${creator.branch_id}` : '';

    return (
      <span style={{ display: 'inline-flex', flexDirection: 'column', gap: '2px' }}>
        <span className="branch-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <UserCog size={12} />
          {creator.name} {roleLabel && `(${roleLabel}${branchLabel})`}
        </span>
        {creator.email && (
          <span style={{ fontSize: '12px', color: '#6b7280' }}>
            {creator.email}
          </span>
        )}
      </span>
    );
  };

  // ✅ NAYA: export ke liye plain text (React element nahi) - "Created By" field ka
  const getCreatedByText = (user) => {
    const creator = user.created_by;
    if (!creator || typeof creator !== 'object') return 'System / N/A';
    const roleLabel = creator.role
      ? creator.role.charAt(0).toUpperCase() + creator.role.slice(1)
      : '';
    const branchLabel = creator.branch_id ? ` - Branch ${creator.branch_id}` : '';
    return `${creator.name || ''}${roleLabel ? ` (${roleLabel}${branchLabel})` : ''}`.trim();
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

  // ✅ UPDATED: naya parameter 'showCreatedBy' add kiya gaya
  const renderUserTable = (section, title, usersList, Icon, showAccess = false, showBranch = true, applyBranchFilter = true, showAccessAction = false, showCreatedBy = false) => {
    const filtered = filterUsers(usersList, applyBranchFilter);
    const isExpanded = expandedSections[section];
    const count = filtered.length;

    if (count === 0 && !search) {
      return null;
    }

    if (section === 'systemAccess') {
      const accessUsers = filtered.filter(u => !!u.has_system_access);
      if (accessUsers.length === 0 && !search) return null;
    }

    return (
      <div className="role-section">
        <div className="role-header" onClick={() => toggleSectionExpand(section)}>
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
                      {showBranch && section !== 'admin' && <th>Branch</th>}
                      {showAccess && <th>System Access</th>}
                      {showCreatedBy && <th>Created By</th>}
                      <th>Status</th>
                      <th>Actions</th>
                      {showAccessAction && <th>Access Control</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((user, index) => {
                      if (section === 'systemAccess' && !user.has_system_access) {
                        return null;
                      }
                      return (
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
                          {showBranch && section !== 'admin' && (
                            <td>
                              <span className="branch-tag">
                                <Building size={12} />
                                {user.branch_name || `Branch ${user.branch_id}` || 'N/A'}
                              </span>
                            </td>
                          )}
                          {showAccess && (
                            <td>{getAccessBadge(user.has_system_access)}</td>
                          )}
                          {showCreatedBy && (
                            <td>{getCreatedByDisplay(user)}</td>
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
                          {showAccessAction && (
                            <td>
                              <button
                                className="btn-view-detail"
                                style={
                                  user.has_system_access
                                    ? { background: '#fee2e2', color: '#b91c1c', borderColor: '#fecaca' }
                                    : { background: '#dcfce7', color: '#166534', borderColor: '#bbf7d0' }
                                }
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleAccess(user);
                                }}
                              >
                                {user.has_system_access ? (
                                  <>
                                    <Lock size={16} />
                                    Revoke Access
                                  </>
                                ) : (
                                  <>
                                    <Unlock size={16} />
                                    Grant Access
                                  </>
                                )}
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

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
                {user.role === 'employee' && (
                  <div className="profile-access">{getAccessBadge(user.has_system_access)}</div>
                )}
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
                  <span className="detail-value">{user.branch_name || `Branch ${user.branch_id}` || 'N/A'}</span>
                </div>
              )}
              {user.role !== 'admin' && (
                <div className="detail-item-full">
                  <span className="detail-label">Salary</span>
                  <span className="detail-value">PKR {user.salary?.toLocaleString() || '0'}</span>
                </div>
              )}
              {user.role === 'employee' && (
                <div className="detail-item-full">
                  <span className="detail-label">System Access</span>
                  <span className="detail-value">
                    {user.has_system_access ? 'Granted' : 'Not Granted'}
                  </span>
                </div>
              )}
              {/* ✅ NEW: Modal mein bhi Created By dikhao */}
              <div className="detail-item-full">
                <span className="detail-label">Created By</span>
                <span className="detail-value">{getCreatedByDisplay(user)}</span>
              </div>
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
                      View Document
                    </a>
                  ) : (
                    <span className="document-na">Not Uploaded</span>
                  )}
                </div>
                <div className="document-item">
                  <span className="document-label">CNIC Back</span>
                  {user.cnic_back ? (
                    <a href={user.cnic_back} target="_blank" rel="noopener noreferrer" className="document-link">
                      View Document
                    </a>
                  ) : (
                    <span className="document-na">Not Uploaded</span>
                  )}
                </div>
                <div className="document-item">
                  <span className="document-label">Agreement Form</span>
                  {user.agreement_form ? (
                    <a href={user.agreement_form} target="_blank" rel="noopener noreferrer" className="document-link">
                      View Document
                    </a>
                  ) : (
                    <span className="document-na">Not Uploaded</span>
                  )}
                </div>
                <div className="document-item">
                  <span className="document-label">Voice Consent</span>
                  {user.voice_consent ? (
                    <a href={user.voice_consent} target="_blank" rel="noopener noreferrer" className="document-link">
                      Play Audio
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

  const branchLabel = userBranch ? `Branch ${userBranch}` : 'All Branches';

  const filteredAdmins = filterUsers(users.admin, false);
  const filteredManagers = filterUsers(users.manager, true);
  const filteredEmployees = filterUsers(users.employee, true);
  const filteredAdminsCount = filteredAdmins.length;
  const filteredManagersCount = filteredManagers.length;
  const filteredEmployeesCount = filteredEmployees.length;
  const filteredSystemAccessCount = filterUsers(users.systemAccess, true).length;
  const filteredTotalUsers = filteredAdminsCount + filteredManagersCount + filteredEmployeesCount;

  // ✅ NAYA: export ke liye teeno lists ko ek flat array mein combine karna,
  // plain strings ke sath (koi React element nahi jaata Excel/PDF mein)
  const exportData = [
    ...filteredAdmins.map(u => ({
      name: u.name || 'N/A',
      email: u.email || 'N/A',
      phone: u.phone || 'N/A',
      role: 'Admin',
      branch: 'N/A',
      systemAccess: '-',
      status: u.is_active ? 'Active' : 'Inactive',
      createdBy: getCreatedByText(u)
    })),
    ...filteredManagers.map(u => ({
      name: u.name || 'N/A',
      email: u.email || 'N/A',
      phone: u.phone || 'N/A',
      role: 'Manager',
      branch: u.branch_name || (u.branch_id ? `Branch ${u.branch_id}` : 'N/A'),
      systemAccess: '-',
      status: u.is_active ? 'Active' : 'Inactive',
      createdBy: getCreatedByText(u)
    })),
    ...filteredEmployees.map(u => ({
      name: u.name || 'N/A',
      email: u.email || 'N/A',
      phone: u.phone || 'N/A',
      role: 'Employee',
      branch: u.branch_name || (u.branch_id ? `Branch ${u.branch_id}` : 'N/A'),
      systemAccess: u.has_system_access ? 'Granted' : 'No Access',
      status: u.is_active ? 'Active' : 'Inactive',
      createdBy: getCreatedByText(u)
    }))
  ];

  const exportColumns = [
    { header: 'Name', key: 'name' },
    { header: 'Email', key: 'email' },
    { header: 'Phone', key: 'phone' },
    { header: 'Role', key: 'role' },
    { header: 'Branch', key: 'branch' },
    { header: 'System Access', key: 'systemAccess' },
    { header: 'Status', key: 'status' },
    { header: 'Created By', key: 'createdBy' },
  ];

  return (
    <div className="system-access-container">
      {showUserModal && <UserDetailModal />}

      {actionMessage && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '10px',
            marginBottom: '16px',
            fontWeight: 600,
            background: actionMessage.type === 'success' ? '#dcfce7' : '#fee2e2',
            color: actionMessage.type === 'success' ? '#166534' : '#b91c1c',
            border: `1px solid ${actionMessage.type === 'success' ? '#bbf7d0' : '#fecaca'}`
          }}
        >
          {actionMessage.text}
        </div>
      )}

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
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <ExportButton
            data={exportData}
            columns={exportColumns}
            filename="system-access-report"
            title="System Access Report"
          />
          <button className="btn-refresh" onClick={fetchUsers}>
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>
      </div>

      <div className="summary-cards">
        <div className="summary-card admin-card">
          <div className="summary-icon" style={{ background: '#dbeafe', color: '#1e40af' }}>
            <Shield size={22} />
          </div>
          <div className="summary-info">
            <span className="summary-label">Total Admins</span>
            <span className="summary-value">{filteredAdminsCount}</span>
          </div>
        </div>
        <div className="summary-card manager-card">
          <div className="summary-icon" style={{ background: '#fef3c7', color: '#92400e' }}>
            <Briefcase size={22} />
          </div>
          <div className="summary-info">
            <span className="summary-label">Total Managers</span>
            <span className="summary-value">{filteredManagersCount}</span>
          </div>
        </div>
        <div className="summary-card employee-card">
          <div className="summary-icon" style={{ background: '#d1fae5', color: '#065f46' }}>
            <User size={22} />
          </div>
          <div className="summary-info">
            <span className="summary-label">Total Employees</span>
            <span className="summary-value">{filteredEmployeesCount}</span>
          </div>
        </div>
        <div className="summary-card system-access-card">
          <div className="summary-icon" style={{ background: '#dbeafe', color: '#1e40af' }}>
            <Key size={22} />
          </div>
          <div className="summary-info">
            <span className="summary-label">System Access</span>
            <span className="summary-value">{filteredSystemAccessCount}</span>
          </div>
        </div>
      </div>

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
        
        {userBranch && (
          <div className="branch-info-badge">
            <Building size={14} />
            <span>Branch {userBranch} (Your Current Branch)</span>
          </div>
        )}
      </div>

      <div className="roles-container">
        {renderUserTable('admin', 'Admins', users.admin, Shield, false, false, false, false, false)}
        
        {renderUserTable('manager', 'Managers', users.manager, Briefcase, false, true, true, false, true)}
        
        {renderUserTable('employee', 'All Employees', users.employee, User, true, true, true, true, true)}
        
        {renderUserTable('systemAccess', 'System Access List', users.systemAccess, Key, true, true, true, true, true)}
      </div>

      <div className="system-footer">
        <button className="btn-export" onClick={() => window.print()}>
          <Printer size={16} />
          Print Report
        </button>
        <span className="total-record-text">
          Total {filteredTotalUsers} users | {filteredSystemAccessCount} with system access
        </span>
      </div>
    </div>
  );
};

export default SystemAccess;