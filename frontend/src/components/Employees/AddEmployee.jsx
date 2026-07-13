import React, { useState, useRef, useEffect } from 'react';
import { UserPlus, Mail, Phone, MapPin, Briefcase, DollarSign, Lock, User, Building, Upload, X, CreditCard, FileText, CheckCircle, AlertCircle, Calendar } from 'lucide-react';
import './AddEmployee.css';

const AddEmployee = () => {
  const [employee, setEmployee] = useState({
    name: '',
    email: '',
    phone: '',
    branch: 1,
    role: 'employee',
    password: '',
    confirmPassword: '',
    address: '',
    salary: 0,
    cnicFront: null,
    cnicBack: null,
    cnicFrontPreview: '',
    cnicBackPreview: '',
    agreement: null,
    agreementPreview: '',
    agreementName: '',
  });

  const [errors, setErrors] = useState({});
  const [userRole, setUserRole] = useState(null);
  const [userBranch, setUserBranch] = useState(null);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const cnicFrontRef = useRef(null);
  const cnicBackRef = useRef(null);
  const agreementRef = useRef(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setUserRole(user.role);
      setUserBranch(user.branch);
      if (user.branch) {
        setEmployee(prev => ({ 
          ...prev, 
          branch: parseInt(user.branch),
          email: '',
          password: '',
          confirmPassword: ''
        }));
      }
    }
  }, []);

  const handleCnicUpload = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === 'front') {
        setEmployee({ ...employee, cnicFront: file, cnicFrontPreview: reader.result });
      } else if (type === 'back') {
        setEmployee({ ...employee, cnicBack: file, cnicBackPreview: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAgreementUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setEmployee({
        ...employee,
        agreement: file,
        agreementPreview: reader.result,
        agreementName: file.name,
      });
    };
    reader.readAsDataURL(file);
    if (agreementRef.current) agreementRef.current.value = '';
  };

  const removeCnicFile = (type) => {
    if (type === 'front') {
      setEmployee({ ...employee, cnicFront: null, cnicFrontPreview: '' });
      if (cnicFrontRef.current) cnicFrontRef.current.value = '';
    } else if (type === 'back') {
      setEmployee({ ...employee, cnicBack: null, cnicBackPreview: '' });
      if (cnicBackRef.current) cnicBackRef.current.value = '';
    }
  };

  const removeAgreement = () => {
    setEmployee({ ...employee, agreement: null, agreementPreview: '', agreementName: '' });
    if (agreementRef.current) agreementRef.current.value = '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'branch' && userBranch) return;
    setEmployee({ ...employee, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const clearForm = () => {
    setEmployee({
      name: '',
      email: '',
      phone: '',
      branch: userBranch ? parseInt(userBranch) : 1,
      role: 'employee',
      password: '',
      confirmPassword: '',
      address: '',
      salary: 0,
      cnicFront: null,
      cnicBack: null,
      cnicFrontPreview: '',
      cnicBackPreview: '',
      agreement: null,
      agreementPreview: '',
      agreementName: '',
    });
    setErrors({});
    setFormSubmitted(false);
    setSuccessMessage('');
    
    if (cnicFrontRef.current) cnicFrontRef.current.value = '';
    if (cnicBackRef.current) cnicBackRef.current.value = '';
    if (agreementRef.current) agreementRef.current.value = '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormSubmitted(true);
    setSuccessMessage('');
    
    const newErrors = {};
    if (!employee.name) newErrors.name = 'Name is required';
    if (!employee.email) newErrors.email = 'Email is required';
    if (!employee.phone) newErrors.phone = 'Phone is required';
    if (!employee.password) newErrors.password = 'Password is required';
    if (employee.password !== employee.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!employee.cnicFront) newErrors.cnicFront = 'CNIC Front image is required';
    if (!employee.cnicBack) newErrors.cnicBack = 'CNIC Back image is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    console.log('Employee Created:', employee);
    setSuccessMessage('✅ Employee created successfully!');
    
    setTimeout(() => {
      clearForm();
    }, 500);
  };

  const branchLabel = userBranch ? `Branch ${userBranch}` : 'All Branches';

  return (
    <div className="employee-form-container">
      <div className="page-header">
        <div className="header-title-group">
          <div className="icon-wrapper">
            <UserPlus size={24} className="icon-primary" />
          </div>
          <h2>Add New Employee</h2>
          <span className="live-badge">
            <Calendar size={12} /> New
          </span>
        </div>
        {userBranch && (
          <div className="branch-badge-header" style={{ fontWeight: 700 }}>
            <Building size={14} />
            <span>{branchLabel}</span>
          </div>
        )}
      </div>

      {successMessage && (
        <div className="success-message" style={{ fontWeight: 600 }}>
          <CheckCircle size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label style={{ fontWeight: 700 }}>Full Name *</label>
            <div className="input-with-icon">
              <User size={18} />
              <input
                type="text"
                name="name"
                className={`form-input ${errors.name ? 'error' : ''}`}
                placeholder="Enter employee name"
                value={employee.name}
                onChange={handleChange}
                autoComplete="off"
                required
                style={{ fontWeight: 500 }}
              />
            </div>
            {errors.name && <span className="error-text" style={{ fontWeight: 600 }}>{errors.name}</span>}
          </div>

          <div className="form-group">
            <label style={{ fontWeight: 700 }}>Email Address *</label>
            <div className="input-with-icon">
              <Mail size={18} />
              <input
                type="email"
                name="email"
                className={`form-input ${errors.email ? 'error' : ''}`}
                placeholder="employee@company.com"
                value={employee.email}
                onChange={handleChange}
                autoComplete="off"
                required
                style={{ fontWeight: 500 }}
              />
            </div>
            {errors.email && <span className="error-text" style={{ fontWeight: 600 }}>{errors.email}</span>}
          </div>

          <div className="form-group">
            <label style={{ fontWeight: 700 }}>Phone Number *</label>
            <div className="input-with-icon">
              <Phone size={18} />
              <input
                type="tel"
                name="phone"
                className={`form-input ${errors.phone ? 'error' : ''}`}
                placeholder="03XX-XXXXXXX"
                value={employee.phone}
                onChange={handleChange}
                autoComplete="off"
                required
                style={{ fontWeight: 500 }}
              />
            </div>
            {errors.phone && <span className="error-text" style={{ fontWeight: 600 }}>{errors.phone}</span>}
          </div>

          <div className="form-group">
            <label style={{ fontWeight: 700 }}>Branch *</label>
            <div className="input-with-icon">
              <Building size={18} />
              <select
                name="branch"
                className="form-input"
                value={employee.branch}
                onChange={handleChange}
                disabled={!!userBranch}
                style={userBranch ? { opacity: 0.7, cursor: 'not-allowed', fontWeight: 500 } : { fontWeight: 500 }}
              >
                <option value={1}>Branch 1</option>
                <option value={2}>Branch 2</option>
              </select>
            </div>
            {userBranch && (
              <small className="field-hint" style={{ fontWeight: 500 }}>Branch locked to {branchLabel}</small>
            )}
          </div>

          <div className="form-group">
            <label style={{ fontWeight: 700 }}>Role *</label>
            <div className="input-with-icon">
              <Briefcase size={18} />
              <select
                name="role"
                className="form-input"
                value={employee.role}
                onChange={handleChange}
                style={{ fontWeight: 500 }}
              >
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label style={{ fontWeight: 700 }}>Salary (PKR)</label>
            <div className="input-with-icon">
              <DollarSign size={18} style={{ color: '#C9A84C' }} />
              <input
                type="number"
                name="salary"
                className="form-input"
                placeholder="0"
                value={employee.salary}
                onChange={handleChange}
                autoComplete="off"
                style={{ fontWeight: 500 }}
              />
            </div>
          </div>

          <div className="form-group">
            <label style={{ fontWeight: 700 }}>Password *</label>
            <div className="input-with-icon">
              <Lock size={18} />
              <input
                type="password"
                name="password"
                className={`form-input ${errors.password ? 'error' : ''}`}
                placeholder="Enter password"
                value={employee.password}
                onChange={handleChange}
                autoComplete="new-password"
                required
                style={{ fontWeight: 500 }}
              />
            </div>
            {errors.password && <span className="error-text" style={{ fontWeight: 600 }}>{errors.password}</span>}
          </div>

          <div className="form-group">
            <label style={{ fontWeight: 700 }}>Confirm Password *</label>
            <div className="input-with-icon">
              <Lock size={18} />
              <input
                type="password"
                name="confirmPassword"
                className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                placeholder="Confirm password"
                value={employee.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
                required
                style={{ fontWeight: 500 }}
              />
            </div>
            {errors.confirmPassword && <span className="error-text" style={{ fontWeight: 600 }}>{errors.confirmPassword}</span>}
          </div>
        </div>

        <div className="cnic-image-section" style={{ border: '1px solid #bfdbfe', background: '#eff6ff' }}>
          <div className="section-header">
            <CreditCard size={18} style={{ color: '#2563eb' }} />
            <h4 style={{ fontWeight: 700 }}>CNIC Images</h4>
            <span className="required-badge" style={{ fontWeight: 700 }}>Required</span>
          </div>
          <div className="cnic-image-grid">
            <div className="image-upload-box">
              <label style={{ fontWeight: 600 }}>CNIC Front</label>
              <div className="upload-area" onClick={() => cnicFrontRef.current?.click()}>
                {employee.cnicFrontPreview ? (
                  <div className="preview-container">
                    <img src={employee.cnicFrontPreview} alt="CNIC Front" />
                    <button className="remove-btn" onClick={(e) => { e.stopPropagation(); removeCnicFile('front'); }}>
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload size={32} style={{ color: '#2563eb' }} />
                    <span style={{ fontWeight: 500 }}>Click to upload</span>
                    <span className="file-hint" style={{ fontWeight: 500 }}>JPG, PNG</span>
                  </>
                )}
              </div>
              <input type="file" ref={cnicFrontRef} accept="image/*" onChange={(e) => handleCnicUpload(e, 'front')} style={{ display: 'none' }} />
              {errors.cnicFront && <span className="error-text" style={{ fontWeight: 600 }}>{errors.cnicFront}</span>}
            </div>

            <div className="image-upload-box">
              <label style={{ fontWeight: 600 }}>CNIC Back</label>
              <div className="upload-area" onClick={() => cnicBackRef.current?.click()}>
                {employee.cnicBackPreview ? (
                  <div className="preview-container">
                    <img src={employee.cnicBackPreview} alt="CNIC Back" />
                    <button className="remove-btn" onClick={(e) => { e.stopPropagation(); removeCnicFile('back'); }}>
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload size={32} style={{ color: '#2563eb' }} />
                    <span style={{ fontWeight: 500 }}>Click to upload</span>
                    <span className="file-hint" style={{ fontWeight: 500 }}>JPG, PNG</span>
                  </>
                )}
              </div>
              <input type="file" ref={cnicBackRef} accept="image/*" onChange={(e) => handleCnicUpload(e, 'back')} style={{ display: 'none' }} />
              {errors.cnicBack && <span className="error-text" style={{ fontWeight: 600 }}>{errors.cnicBack}</span>}
            </div>
          </div>
        </div>

        <div className="agreement-section" style={{ border: '1px solid #86efac', background: '#f0fdf4' }}>
          <div className="section-header">
            <FileText size={18} style={{ color: '#065f46' }} />
            <h4 style={{ fontWeight: 700 }}>Agreement Form</h4>
            <span className="optional-badge" style={{ fontWeight: 600 }}>Optional</span>
          </div>
          <p className="agreement-hint" style={{ fontWeight: 500 }}>Upload signed agreement form</p>
          
          <div className="agreement-upload">
            <div className="upload-area agreement-upload-area" onClick={() => agreementRef.current?.click()} style={{ borderColor: '#86efac' }}>
              {employee.agreementPreview ? (
                <div className="agreement-preview">
                  <FileText size={32} className="agreement-icon" style={{ color: '#065f46' }} />
                  <span className="agreement-file-name" style={{ fontWeight: 600 }}>{employee.agreementName}</span>
                  <button 
                    className="remove-agreement-btn" 
                    onClick={(e) => { e.stopPropagation(); removeAgreement(); }}
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <>
                  <FileText size={32} style={{ color: '#065f46' }} />
                  <span style={{ fontWeight: 500 }}>Click to upload agreement</span>
                  <span className="file-hint" style={{ fontWeight: 500 }}>PDF, JPG, PNG, DOC</span>
                </>
              )}
            </div>
            <input 
              type="file" 
              ref={agreementRef} 
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" 
              onChange={handleAgreementUpload} 
              style={{ display: 'none' }} 
            />
          </div>
        </div>

        <div className="form-group full-width">
          <label style={{ fontWeight: 700 }}>Address</label>
          <div className="input-with-icon">
            <MapPin size={18} />
            <textarea
              name="address"
              className="form-input form-textarea"
              placeholder="Enter employee address"
              value={employee.address}
              onChange={handleChange}
              autoComplete="off"
              style={{ fontWeight: 500 }}
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" style={{ fontWeight: 700 }}>
            <CheckCircle size={18} />
            Create Employee Account
          </button>
          <button type="button" className="btn-reset" onClick={clearForm} style={{ fontWeight: 700 }}>
            <X size={18} />
            Clear
          </button>
        </div>

        <p className="form-footer" style={{ fontWeight: 500 }}>
          <AlertCircle size={14} />
          All fields are required. Branch assignment is permanent for login access.
        </p>
      </form>
    </div>
  );
};

export default AddEmployee;