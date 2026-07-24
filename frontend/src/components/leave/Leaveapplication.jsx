// src/components/LeaveApplication/LeaveApplication.jsx

import React, { useState, useEffect } from 'react';
import {
  Calendar, User, FileText, Send, CheckCircle,
  AlertCircle, Building
} from 'lucide-react';
import './LeaveApplication.css';
import { API_URL } from '../../../config';

const LeaveApplication = () => {
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [userBranch, setUserBranch] = useState(null);

  const [formData, setFormData] = useState({
    user_id: '',
    leave_date: '',
    reason: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: '...' }

  // Recent leave records (so the person can see what was just recorded)
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setUserBranch(user.branch);
    }
    fetchEmployees();
    fetchRecentLeaves();
  }, []);

  const fetchEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/users?paginate=0`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      const data = await response.json();

      if (data.success) {
        let list = [];
        if (Array.isArray(data.data)) {
          list = data.data;
        } else if (data.data && Array.isArray(data.data.data)) {
          list = data.data.data;
        } else if (Array.isArray(data)) {
          list = data;
        }

        const filtered = list.filter(u => u.role === 'employee' || u.role === 'manager');
        setEmployees(filtered.length > 0 ? filtered : list);
      } else {
        setEmployees([]);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      setEmployees([]);
    }
    setLoadingEmployees(false);
  };

  const fetchRecentLeaves = async () => {
    setLoadingRecent(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/leaves`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      const data = await response.json();

      if (data.success) {
        setRecentLeaves(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching leaves:', error);
    }
    setLoadingRecent(false);
  };

  // ✅ Sirf apni branch ke employees/managers dropdown mein dikhao
  // (Admin ka bhi ab login-selected branch session mein set hoti hai,
  // isliye yeh Admin/Manager dono ke liye barabar kaam karta hai)
  const getBranchScopedEmployees = () => {
    if (userBranch) {
      return employees.filter(emp => parseInt(emp.branch_id) === parseInt(userBranch));
    }
    return employees;
  };

  // ✅ Recent Leave Records bhi sirf apni branch ke employees ke dikhao
  const getBranchScopedRecentLeaves = () => {
    let list = recentLeaves;
    if (userBranch) {
      list = list.filter(leave => parseInt(leave.employee?.branch_id) === parseInt(userBranch));
    }
    // sirf latest 4 records
    return list.slice(0, 4);
  };

  const filteredEmployees = getBranchScopedEmployees();
  const filteredRecentLeaves = getBranchScopedRecentLeaves();

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (!formData.user_id || !formData.leave_date || !formData.reason.trim()) {
      setMessage({ type: 'error', text: 'Please fill in employee, date and reason.' });
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/leaves`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Leave recorded successfully!' });
        setFormData({ user_id: '', leave_date: '', reason: '' });
        fetchRecentLeaves();
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to record leave.' });
      }
    } catch (error) {
      console.error('Error submitting leave:', error);
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    }
    setSubmitting(false);
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-PK', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="leaveapp-page">
      <div className="leaveapp-page-header">
        <h2>Record Leave</h2>
        <p>Record a leave day for an employee</p>
      </div>

      <div className="leaveapp-content-grid">
        {/* ===== FORM CARD ===== */}
        <div className="leaveapp-form-card">
          <form onSubmit={handleSubmit}>
            <div className="leaveapp-form-group">
              <label>
                <User size={16} /> Employee
              </label>
              <select
                value={formData.user_id}
                onChange={(e) => handleChange('user_id', e.target.value)}
                className="leaveapp-form-input"
                disabled={loadingEmployees}
              >
                <option value="">
                  {loadingEmployees ? 'Loading employees...' : 'Select employee...'}
                </option>
                {filteredEmployees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} {emp.branch_id ? `(Branch ${emp.branch_id})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="leaveapp-form-group">
              <label>
                <Calendar size={16} /> Leave Date
              </label>
              <input
                type="date"
                value={formData.leave_date}
                onChange={(e) => handleChange('leave_date', e.target.value)}
                className="leaveapp-form-input"
              />
            </div>

            <div className="leaveapp-form-group">
              <label>
                <FileText size={16} /> Reason
              </label>
              <textarea
                value={formData.reason}
                onChange={(e) => handleChange('reason', e.target.value)}
                className="leaveapp-form-input leaveapp-form-textarea"
                placeholder="e.g. Medical leave, Family emergency, Personal work..."
                rows={4}
              />
            </div>

            {message && (
              <div className={`leaveapp-message leaveapp-message-${message.type}`}>
                {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                <span>{message.text}</span>
              </div>
            )}

            <button type="submit" className="leaveapp-submit-btn" disabled={submitting}>
              <Send size={16} />
              {submitting ? 'Recording...' : 'Record Leave'}
            </button>
          </form>
        </div>

        {/* ===== RECENT LEAVE RECORDS ===== */}
        <div className="leaveapp-recent-card">
          <h3>Recent Leave Records</h3>
          {loadingRecent ? (
            <div className="leaveapp-loading">
              <div className="leaveapp-spinner"></div>
            </div>
          ) : filteredRecentLeaves.length === 0 ? (
            <div className="leaveapp-empty">
              <AlertCircle size={22} />
              <p>No leave records yet</p>
            </div>
          ) : (
            <div className="leaveapp-recent-list">
              {filteredRecentLeaves.map(leave => (
                <div key={leave.id} className="leaveapp-recent-item">
                  <div className="leaveapp-recent-top">
                    <div className="leaveapp-recent-name">
                      {leave.employee?.name || 'Unknown'}
                      {leave.employee?.branch_id && (
                        <span className="leaveapp-recent-branch">
                          <Building size={11} /> Branch {leave.employee.branch_id}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="leaveapp-recent-date">{formatDate(leave.leave_date)}</div>
                  <div className="leaveapp-recent-reason">{leave.reason}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaveApplication;