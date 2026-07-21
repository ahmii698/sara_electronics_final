// src/components/LeaveApplication/LeaveApplication.jsx

import React, { useState, useEffect } from 'react';
import {
  Calendar, User, FileText, Send, CheckCircle,
  AlertCircle, Clock, Building, X
} from 'lucide-react';
import './Leaveapplication.css';
import { API_URL } from '../../../config';

const LeaveApplication = () => {
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);

  const [formData, setFormData] = useState({
    user_id: '',
    leave_date: '',
    reason: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: '...' }

  // ✅ Recent applications (so the person can see what they just submitted)
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  useEffect(() => {
    fetchEmployees();
    fetchRecentLeaves();
  }, []);

  const fetchEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      const data = await response.json();

      if (data.success) {
        const list = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
        setEmployees(list);
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
        setRecentLeaves((data.data || []).slice(0, 8));
      }
    } catch (error) {
      console.error('Error fetching leaves:', error);
    }
    setLoadingRecent(false);
  };

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
        setMessage({ type: 'success', text: 'Leave application submitted successfully!' });
        setFormData({ user_id: '', leave_date: '', reason: '' });
        fetchRecentLeaves();
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to submit leave application.' });
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

  const getStatusBadge = (status) => {
    if (status === 'approved') {
      return <span className="leave-badge leave-badge-approved"><CheckCircle size={13} /> Approved</span>;
    }
    if (status === 'rejected') {
      return <span className="leave-badge leave-badge-rejected"><X size={13} /> Rejected</span>;
    }
    return <span className="leave-badge leave-badge-pending"><Clock size={13} /> Pending</span>;
  };

  return (
    <div className="leave-application-page">
      <div className="leave-page-header">
        <h2>Apply for Leave</h2>
        <p>Submit a leave request for an employee</p>
      </div>

      <div className="leave-content-grid">
        {/* ===== FORM CARD ===== */}
        <div className="leave-form-card">
          <form onSubmit={handleSubmit}>
            <div className="leave-form-group">
              <label>
                <User size={16} /> Employee
              </label>
              <select
                value={formData.user_id}
                onChange={(e) => handleChange('user_id', e.target.value)}
                className="leave-form-input"
                disabled={loadingEmployees}
              >
                <option value="">
                  {loadingEmployees ? 'Loading employees...' : 'Select employee...'}
                </option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} {emp.branch_id ? `(Branch ${emp.branch_id})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="leave-form-group">
              <label>
                <Calendar size={16} /> Leave Date
              </label>
              <input
                type="date"
                value={formData.leave_date}
                onChange={(e) => handleChange('leave_date', e.target.value)}
                className="leave-form-input"
              />
            </div>

            <div className="leave-form-group">
              <label>
                <FileText size={16} /> Reason
              </label>
              <textarea
                value={formData.reason}
                onChange={(e) => handleChange('reason', e.target.value)}
                className="leave-form-input leave-form-textarea"
                placeholder="e.g. Medical leave, Family emergency, Personal work..."
                rows={4}
              />
            </div>

            {message && (
              <div className={`leave-message leave-message-${message.type}`}>
                {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                <span>{message.text}</span>
              </div>
            )}

            <button type="submit" className="leave-submit-btn" disabled={submitting}>
              <Send size={16} />
              {submitting ? 'Submitting...' : 'Submit Leave Application'}
            </button>
          </form>
        </div>

        {/* ===== RECENT APPLICATIONS ===== */}
        <div className="leave-recent-card">
          <h3>Recent Applications</h3>
          {loadingRecent ? (
            <div className="leave-loading">
              <div className="leave-spinner"></div>
            </div>
          ) : recentLeaves.length === 0 ? (
            <div className="leave-empty">
              <AlertCircle size={22} />
              <p>No leave applications yet</p>
            </div>
          ) : (
            <div className="leave-recent-list">
              {recentLeaves.map(leave => (
                <div key={leave.id} className="leave-recent-item">
                  <div className="leave-recent-top">
                    <div className="leave-recent-name">
                      {leave.employee?.name || 'Unknown'}
                      {leave.employee?.branch_id && (
                        <span className="leave-recent-branch">
                          <Building size={11} /> Branch {leave.employee.branch_id}
                        </span>
                      )}
                    </div>
                    {getStatusBadge(leave.status)}
                  </div>
                  <div className="leave-recent-date">{formatDate(leave.leave_date)}</div>
                  <div className="leave-recent-reason">{leave.reason}</div>
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