import React, { useState, useRef, useEffect } from 'react';
import { Search, User, Phone, CreditCard, MapPin, Briefcase, Users, Package, DollarSign, Calendar, Upload, X, UserPlus, Mic, Play, Trash2, FileAudio, Building, CheckCircle, AlertCircle, Clock, Bell, Shield } from 'lucide-react';
import './AddAccount.css';

const AddAccount = () => {
  const [step, setStep] = useState(1);
  const [searchCNIC, setSearchCNIC] = useState('');
  const [showExisting, setShowExisting] = useState(false);
  const [existingAccounts, setExistingAccounts] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [userBranch, setUserBranch] = useState(null);
  const [toast, setToast] = useState(null);

  const [voiceFiles, setVoiceFiles] = useState([]);
  const [playingIndex, setPlayingIndex] = useState(null);

  // ===== COMPLETE SYSTEM DATA =====
  const systemData = {
    // Existing customers with their accounts
    customers: [
      { 
        id: 1, 
        name: 'Ahmed Khan', 
        cnic: '12345-6789012-3', 
        phone: '0300-1234567',
        address: 'House #12, Street 5, Lahore',
        branch: 1,
        hasAccount: true,
        isGuarantorFor: ['Usman Malik', 'Bilal Ahmed']
      },
      { 
        id: 2, 
        name: 'Sara Ali', 
        cnic: '12345-6789012-4', 
        phone: '0300-7654321',
        address: 'House #34, Street 8, Lahore',
        branch: 2,
        hasAccount: true,
        isGuarantorFor: []
      },
      { 
        id: 3, 
        name: 'Usman Malik', 
        cnic: '12345-6789012-6', 
        phone: '0300-2345678',
        address: 'House #78, Street 12, Lahore',
        branch: 1,
        hasAccount: true,
        isGuarantorFor: []
      },
      { 
        id: 4, 
        name: 'Fatima Noor', 
        cnic: '12345-6789012-7', 
        phone: '0300-8765432',
        address: 'House #90, Street 15, Lahore',
        branch: 2,
        hasAccount: true,
        isGuarantorFor: []
      },
      { 
        id: 5, 
        name: 'Bilal Ahmed', 
        cnic: '12345-6789012-8', 
        phone: '0300-3456789',
        address: 'House #12, Street 20, Lahore',
        branch: 1,
        hasAccount: true,
        isGuarantorFor: []
      },
      { 
        id: 6, 
        name: 'Hina Riaz', 
        cnic: '12345-6789012-9', 
        phone: '0300-6543210',
        address: 'House #34, Street 25, Lahore',
        branch: 2,
        hasAccount: true,
        isGuarantorFor: []
      },
      { 
        id: 7, 
        name: 'Ali Raza', 
        cnic: '12345-6789012-0', 
        phone: '0300-4567890',
        address: 'House #56, Street 30, Lahore',
        branch: 1,
        hasAccount: true,
        isGuarantorFor: []
      },
    ],
    // Guarantor records
    guarantorRecords: [
      { 
        guarantorCNIC: '12345-6789012-4', 
        guarantorName: 'Sara Ali',
        customerCNIC: '12345-6789012-3',
        customerName: 'Ahmed Khan',
        branch: 1
      },
      { 
        guarantorCNIC: '12345-6789012-5', 
        guarantorName: 'Zainab Khan',
        customerCNIC: '12345-6789012-3',
        customerName: 'Ahmed Khan',
        branch: 1
      },
      { 
        guarantorCNIC: '12345-6789012-7', 
        guarantorName: 'Fatima Noor',
        customerCNIC: '12345-6789012-6',
        customerName: 'Usman Malik',
        branch: 1
      },
      { 
        guarantorCNIC: '12345-6789012-9', 
        guarantorName: 'Hina Riaz',
        customerCNIC: '12345-6789012-8',
        customerName: 'Bilal Ahmed',
        branch: 1
      },
    ]
  };

  // ===== GET ALL CNICS IN SYSTEM =====
  const getAllCNICs = () => {
    return systemData.customers.map(c => c.cnic);
  };

  // ===== GET CUSTOMER BY CNIC =====
  const getCustomerByCNIC = (cnic) => {
    return systemData.customers.find(c => c.cnic === cnic);
  };

  // ===== GET GUARANTOR RECORDS BY CNIC =====
  const getGuarantorRecordsByCNIC = (cnic) => {
    return systemData.guarantorRecords.filter(g => g.guarantorCNIC === cnic);
  };

  // ===== GET GUARANTOR RECORDS FOR CUSTOMER =====
  const getGuarantorRecordsForCustomer = (customerCNIC) => {
    return systemData.guarantorRecords.filter(g => g.customerCNIC === customerCNIC);
  };

  // ===== CHECK IF CNIC EXISTS (Customer) =====
  const checkCustomerExists = (cnic) => {
    if (!cnic || cnic.length < 5) return null;
    return getCustomerByCNIC(cnic);
  };

  // ===== CHECK IF CNIC IS A GUARANTOR =====
  const checkIfGuarantor = (cnic) => {
    if (!cnic || cnic.length < 5) return null;
    const records = getGuarantorRecordsByCNIC(cnic);
    if (records.length > 0) {
      return records;
    }
    return null;
  };

  // ===== CHECK IF CUSTOMER HAS GUARANTORS =====
  const checkCustomerGuarantors = (cnic) => {
    if (!cnic || cnic.length < 5) return null;
    const records = getGuarantorRecordsForCustomer(cnic);
    if (records.length > 0) {
      return records;
    }
    return null;
  };

  // ===== SHOW TOAST =====
  const showToast = (message, type = 'warning', details = null) => {
    setToast({ message, type, details });
  };

  // ===== CHECK ON CNIC BLUR =====
  const handleCnicBlur = () => {
    if (!formData.cnic || formData.cnic.length < 5) return;
    
    // Check if customer exists
    const customer = checkCustomerExists(formData.cnic);
    if (customer) {
      showToast(
        `⚠️ This CNIC (${formData.cnic}) already exists! Customer: ${customer.name}`,
        'warning'
      );
      return;
    }

    // Check if this CNIC is a guarantor for someone
    const guarantorRecords = checkIfGuarantor(formData.cnic);
    if (guarantorRecords) {
      const details = guarantorRecords.map(g => 
        `• Guarantor for: ${g.customerName} (${g.customerCNIC}) - Branch ${g.branch}`
      ).join('\n');
      showToast(
        `ℹ️ This person (${formData.cnic}) is already a guarantor for ${guarantorRecords.length} customer(s)!`,
        'info',
        details
      );
      return;
    }

    // Check if this customer has guarantors
    const customerGuarantors = checkCustomerGuarantors(formData.cnic);
    if (customerGuarantors) {
      const details = customerGuarantors.map(g => 
        `• ${g.guarantorName} (${g.guarantorCNIC})`
      ).join('\n');
      showToast(
        `ℹ️ This customer (${formData.cnic}) already has ${customerGuarantors.length} guarantor(s)!`,
        'info',
        details
      );
    }
  };

  // ===== CHECK GUARANTOR CNIC ON BLUR =====
  const handleGuarantorCnicBlur = (index) => {
    const cnic = formData.guarantors[index].cnic;
    if (!cnic || cnic.length < 5) return;

    // Check if this CNIC is already a customer
    const customer = checkCustomerExists(cnic);
    if (customer) {
      showToast(
        `ℹ️ Guarantor CNIC (${cnic}) belongs to existing customer: ${customer.name}`,
        'info'
      );
      return;
    }

    // Check if this CNIC is already a guarantor for someone else
    const guarantorRecords = checkIfGuarantor(cnic);
    if (guarantorRecords) {
      const details = guarantorRecords.map(g => 
        `• Already guarantor for: ${g.customerName} (${g.customerCNIC})`
      ).join('\n');
      showToast(
        `⚠️ This CNIC (${cnic}) is already a guarantor for ${guarantorRecords.length} customer(s)!`,
        'warning',
        details
      );
      return;
    }

    // Check if this person has their own account
    const existingCustomer = getCustomerByCNIC(cnic);
    if (existingCustomer) {
      showToast(
        `ℹ️ ${existingCustomer.name} (${cnic}) already has an account in the system!`,
        'info'
      );
    }
  };

  // ===== Check if customer has existing guarantors (on name change) =====
  const handleNameChange = () => {
    // This will be called when we check if the customer already exists
  };

  const allEmployees = [
    { id: 1, name: 'Ahmed Khan', branch: 1 },
    { id: 2, name: 'Sara Ali', branch: 2 },
    { id: 3, name: 'Usman Malik', branch: 1 },
    { id: 4, name: 'Fatima Noor', branch: 2 },
    { id: 5, name: 'Bilal Ahmed', branch: 1 },
    { id: 6, name: 'Hina Riaz', branch: 2 },
    { id: 7, name: 'Imran Ali', branch: 1 },
    { id: 8, name: 'Nadia Khan', branch: 2 },
  ];

  const [formData, setFormData] = useState({
    name: '',
    cnic: '',
    phone: '',
    address: '',
    work: '',
    employeeId: '',
    cnicFront: null,
    cnicBack: null,
    cnicFrontPreview: '',
    cnicBackPreview: '',
    guarantors: [
      { name: '', cnic: '', phone: '', address: '', cnicFront: null, cnicBack: null, cnicFrontPreview: '', cnicBackPreview: '' },
      { name: '', cnic: '', phone: '', address: '', cnicFront: null, cnicBack: null, cnicFrontPreview: '', cnicBackPreview: '' },
      { name: '', cnic: '', phone: '', address: '', cnicFront: null, cnicBack: null, cnicFrontPreview: '', cnicBackPreview: '' },
    ],
    productType: 'new',
    productName: '',
    productPrice: '',
    advanceAmount: '',
    invoicePrice: '',
    noOfInstallments: '',
    dueDate: '',
    installmentAmount: '',
    chalanFront: null,
    chalanBack: null,
    chalanFrontPreview: '',
    chalanBackPreview: '',
    accountType: 'regular',
    branch: 1,
  });

  const [errors, setErrors] = useState({});

  const cnicFrontRef = useRef(null);
  const cnicBackRef = useRef(null);
  const chalanFrontRef = useRef(null);
  const chalanBackRef = useRef(null);
  const voiceFileRef = useRef(null);
  const guarantorRefs = useRef([]);

  // ===== TOAST TIMER =====
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setUserRole(user.role);
      setUserBranch(user.branch);
      if (user.branch) {
        setFormData(prev => ({ ...prev, branch: parseInt(user.branch) }));
      }
    }
  }, []);

  const getEmployeesByBranch = (branch) => {
    return allEmployees.filter(emp => emp.branch === branch);
  };

  const getAvailableEmployees = () => {
    if (userBranch) {
      return getEmployeesByBranch(parseInt(userBranch));
    }
    return getEmployeesByBranch(formData.branch);
  };

  const handleVoiceFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      alert('Please select an audio file (mp3, wav, etc.)');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const newVoice = {
        id: Date.now(),
        name: file.name,
        size: (file.size / 1024).toFixed(2),
        url: reader.result,
        file: file,
        timestamp: new Date().toLocaleString(),
      };
      setVoiceFiles([...voiceFiles, newVoice]);
    };
    reader.readAsDataURL(file);
    if (voiceFileRef.current) voiceFileRef.current.value = '';
  };

  const playVoice = (index) => {
    const voice = voiceFiles[index];
    if (!voice) return;

    const audio = new Audio(voice.url);
    audio.play();
    setPlayingIndex(index);
    audio.onended = () => {
      setPlayingIndex(null);
    };
  };

  const deleteVoice = (index) => {
    if (window.confirm('Delete this voice file?')) {
      const newVoices = voiceFiles.filter((_, i) => i !== index);
      setVoiceFiles(newVoices);
      if (playingIndex === index) setPlayingIndex(null);
    }
  };

  const handleCNICSearch = () => {
    if (searchCNIC.length < 5) {
      alert('Please enter at least 5 characters of CNIC');
      return;
    }
    
    const mockAccounts = [
      { id: 1, name: 'Ahmed Khan', cnic: '12345-6789012-3', phone: '0300-1234567', address: 'House #12, Street 5', work: 'Business' },
      { id: 2, name: 'Sara Ali', cnic: '12345-6789012-4', phone: '0300-7654321', address: 'House #34, Street 8', work: 'Service' },
    ];
    
    const filtered = mockAccounts.filter(acc => acc.cnic.includes(searchCNIC));
    setExistingAccounts(filtered);
    setShowExisting(true);
  };

  const loadExistingAccount = (account) => {
    setFormData({ ...formData, name: account.name, cnic: account.cnic, phone: account.phone, address: account.address, work: account.work });
    setShowExisting(false);
    setSearchCNIC('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'branch' && userBranch) return;
    setFormData({ ...formData, [name]: value });
  };

  const handleGuarantorChange = (index, field, value) => {
    const updated = [...formData.guarantors];
    updated[index][field] = value;
    setFormData({ ...formData, guarantors: updated });
  };

  const handleGuarantorFileUpload = (e, index, type) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const updated = [...formData.guarantors];
      if (type === 'cnicFront') {
        updated[index].cnicFront = file;
        updated[index].cnicFrontPreview = reader.result;
      } else if (type === 'cnicBack') {
        updated[index].cnicBack = file;
        updated[index].cnicBackPreview = reader.result;
      }
      setFormData({ ...formData, guarantors: updated });
    };
    reader.readAsDataURL(file);
  };

  const removeGuarantorFile = (index, type) => {
    const updated = [...formData.guarantors];
    if (type === 'cnicFront') {
      updated[index].cnicFront = null;
      updated[index].cnicFrontPreview = '';
    } else if (type === 'cnicBack') {
      updated[index].cnicBack = null;
      updated[index].cnicBackPreview = '';
    }
    setFormData({ ...formData, guarantors: updated });
  };

  const handleFileUpload = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === 'cnicFront') setFormData({ ...formData, cnicFront: file, cnicFrontPreview: reader.result });
      else if (type === 'cnicBack') setFormData({ ...formData, cnicBack: file, cnicBackPreview: reader.result });
      else if (type === 'chalanFront') setFormData({ ...formData, chalanFront: file, chalanFrontPreview: reader.result });
      else if (type === 'chalanBack') setFormData({ ...formData, chalanBack: file, chalanBackPreview: reader.result });
    };
    reader.readAsDataURL(file);
  };

  const removeFile = (type) => {
    if (type === 'cnicFront') { setFormData({ ...formData, cnicFront: null, cnicFrontPreview: '' }); if (cnicFrontRef.current) cnicFrontRef.current.value = ''; }
    else if (type === 'cnicBack') { setFormData({ ...formData, cnicBack: null, cnicBackPreview: '' }); if (cnicBackRef.current) cnicBackRef.current.value = ''; }
    else if (type === 'chalanFront') { setFormData({ ...formData, chalanFront: null, chalanFrontPreview: '' }); if (chalanFrontRef.current) chalanFrontRef.current.value = ''; }
    else if (type === 'chalanBack') { setFormData({ ...formData, chalanBack: null, chalanBackPreview: '' }); if (chalanBackRef.current) chalanBackRef.current.value = ''; }
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.cnic) newErrors.cnic = 'CNIC is required';
    if (!formData.phone) newErrors.phone = 'Phone is required';
    if (!formData.address) newErrors.address = 'Address is required';
    if (!formData.work) newErrors.work = 'Work is required';
    if (!formData.employeeId) newErrors.employeeId = 'Please select an employee';
    if (!formData.cnicFront) newErrors.cnicFront = 'CNIC Front image is required';
    if (!formData.cnicBack) newErrors.cnicBack = 'CNIC Back image is required';
    
    const completeGuarantors = formData.guarantors.filter(g => g.name.trim() && g.cnic.trim() && g.phone.trim() && g.address.trim() && g.cnicFront !== null && g.cnicBack !== null);
    if (completeGuarantors.length < 2) {
      newErrors.guarantors = 'Minimum 2 complete guarantors required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (!formData.productName) newErrors.productName = 'Product name is required';
    if (!formData.productPrice) newErrors.productPrice = 'Product price is required';
    if (!formData.invoicePrice) newErrors.invoicePrice = 'Invoice price is required';
    if (!formData.noOfInstallments) newErrors.noOfInstallments = 'Number of installments is required';
    if (!formData.dueDate) newErrors.dueDate = 'Due date is required';
    if (!formData.chalanFront) newErrors.chalanFront = 'Chalan Front image is required';
    if (!formData.chalanBack) newErrors.chalanBack = 'Chalan Back image is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => { if (validateStep1()) setStep(2); };
  const handlePrev = () => setStep(1);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateStep2()) {
      console.log('Account Created:', formData);
      console.log('Voice Files:', voiceFiles);
      alert('Account created successfully!');
    }
  };

  const getGuarantorCount = () => {
    return formData.guarantors.filter(g => g.name && g.cnic && g.phone && g.address && g.cnicFront !== null && g.cnicBack !== null).length;
  };

  const getSelectedEmployeeName = () => {
    const emp = allEmployees.find(e => e.id === parseInt(formData.employeeId));
    return emp ? emp.name : '';
  };

  const isAdmin = userRole === 'admin';
  const isManager = userRole === 'manager';

  const branchLabel = userBranch ? `Branch ${userBranch}` : 'All Branches';

  return (
    <div className="add-account-container">
      {/* ===== TOAST NOTIFICATION ===== */}
      {toast && (
        <div className={`toast-notification ${toast.type}`}>
          <div className="toast-content">
            {toast.type === 'warning' ? <AlertCircle size={20} /> : <Shield size={20} />}
            <div>
              <span>{toast.message}</span>
              {toast.details && (
                <div className="toast-details">
                  {toast.details.split('\n').map((line, i) => (
                    <div key={i} className="toast-detail-line">{line}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <button className="toast-close" onClick={() => setToast(null)}>
            <X size={18} />
          </button>
        </div>
      )}

      <div className="page-header">
        <div className="header-title-group">
          <h3>Create New Account</h3>
          <span className="live-badge">
            <Clock size={12} /> New
          </span>
        </div>
        {userBranch && (
          <div className="branch-badge-header">
            <Building size={14} />
            <span>{branchLabel}</span>
          </div>
        )}
      </div>

      <div className="cnic-search-section">
        <div className="cnic-search">
          <div className="input-with-icon">
            <Search size={18} />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search by CNIC..." 
              value={searchCNIC} 
              onChange={(e) => setSearchCNIC(e.target.value)} 
            />
          </div>
          <button className="btn-search" onClick={handleCNICSearch}>
            <Search size={16} />
            Search
          </button>
        </div>
        {showExisting && existingAccounts.length > 0 && (
          <div className="existing-accounts">
            <p className="existing-title">
              <AlertCircle size={14} />
              Existing Accounts Found:
            </p>
            {existingAccounts.map(acc => (
              <div key={acc.id} className="existing-item" onClick={() => loadExistingAccount(acc)}>
                <div className="existing-info">
                  <strong>{acc.name}</strong>
                  <span>{acc.cnic}</span>
                </div>
                <button className="btn-load">Load</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        {step === 1 && (
          <div className="step-content">
            <div className="step-header">
              <div className="step-number">1</div>
              <div className="step-title">Personal Information</div>
              <span className="step-badge">Required</span>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Full Name *</label>
                <div className="input-with-icon">
                  <User size={18} />
                  <input 
                    type="text" 
                    name="name" 
                    className="form-input" 
                    placeholder="Enter customer full name" 
                    value={formData.name} 
                    onChange={handleChange} 
                  />
                </div>
                {errors.name && <span className="error-text">{errors.name}</span>}
              </div>
              <div className="form-group">
                <label>CNIC *</label>
                <div className="input-with-icon">
                  <CreditCard size={18} />
                  <input 
                    type="text" 
                    name="cnic" 
                    className="form-input" 
                    placeholder="XXXXX-XXXXXXX-X" 
                    value={formData.cnic} 
                    onChange={handleChange} 
                    onBlur={handleCnicBlur}
                  />
                </div>
                {errors.cnic && <span className="error-text">{errors.cnic}</span>}
                <small className="field-hint">System will check if this CNIC already exists or is a guarantor</small>
              </div>
              <div className="form-group">
                <label>Phone Number *</label>
                <div className="input-with-icon">
                  <Phone size={18} />
                  <input 
                    type="tel" 
                    name="phone" 
                    className="form-input" 
                    placeholder="03XX-XXXXXXX" 
                    value={formData.phone} 
                    onChange={handleChange} 
                  />
                </div>
                {errors.phone && <span className="error-text">{errors.phone}</span>}
              </div>
              <div className="form-group">
                <label>Branch *</label>
                <select 
                  name="branch" 
                  className="form-input" 
                  value={formData.branch} 
                  onChange={handleChange}
                  disabled={!!userBranch}
                  style={userBranch ? { opacity: 0.7, cursor: 'not-allowed' } : {}}
                >
                  <option value={1}>Branch 1</option>
                  <option value={2}>Branch 2</option>
                </select>
                {userBranch && (
                  <small className="field-hint">Branch locked to {branchLabel}</small>
                )}
              </div>
              <div className="form-group full-width">
                <label>Address *</label>
                <div className="input-with-icon">
                  <MapPin size={18} />
                  <input 
                    type="text" 
                    name="address" 
                    className="form-input" 
                    placeholder="Enter complete address" 
                    value={formData.address} 
                    onChange={handleChange} 
                  />
                </div>
                {errors.address && <span className="error-text">{errors.address}</span>}
              </div>
              <div className="form-group full-width">
                <label>Work / Occupation *</label>
                <div className="input-with-icon">
                  <Briefcase size={18} />
                  <input 
                    type="text" 
                    name="work" 
                    className="form-input" 
                    placeholder="Enter work/occupation" 
                    value={formData.work} 
                    onChange={handleChange} 
                  />
                </div>
                {errors.work && <span className="error-text">{errors.work}</span>}
              </div>
            </div>

            <div className="employee-section">
              <div className="section-header">
                <UserPlus size={18} />
                <h4>Account Opened By *</h4>
              </div>
              <div className="employee-dropdown-wrapper">
                <select
                  name="employeeId"
                  className="form-input employee-select"
                  value={formData.employeeId}
                  onChange={handleChange}
                >
                  <option value="">Select Employee...</option>
                  {getAvailableEmployees().map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
                {formData.employeeId && (
                  <div className="selected-employee-info">
                    <span className="employee-badge">
                      <CheckCircle size={12} />
                      {getSelectedEmployeeName()} - {branchLabel}
                    </span>
                  </div>
                )}
                {errors.employeeId && <span className="error-text">{errors.employeeId}</span>}
              </div>
              {userBranch && (
                <p className="employee-hint">Only employees from {branchLabel} are available</p>
              )}
            </div>

            <div className="voice-section">
              <div className="section-header">
                <Mic size={18} />
                <h4>Voice Consent / Raza Mandi</h4>
              </div>
              <p className="voice-hint">Customer ki raza mandi ki voice file upload karein</p>
              
              <div className="voice-upload">
                <div className="upload-area voice-upload-area" onClick={() => voiceFileRef.current?.click()}>
                  <FileAudio size={32} />
                  <span>Click to upload voice file</span>
                  <span className="file-hint">MP3, WAV, M4A (Max 10MB)</span>
                </div>
                <input 
                  type="file" 
                  ref={voiceFileRef} 
                  accept="audio/*" 
                  onChange={handleVoiceFileUpload} 
                  style={{ display: 'none' }} 
                />
              </div>

              {voiceFiles.length > 0 && (
                <div className="voice-files-list">
                  <p className="voice-files-title">Uploaded Files ({voiceFiles.length})</p>
                  {voiceFiles.map((voice, index) => (
                    <div key={voice.id} className="voice-file-item">
                      <div className="voice-file-info">
                        <Mic size={16} />
                        <span className="voice-file-name">{voice.name}</span>
                        <span className="voice-file-size">{voice.size} KB</span>
                        <span className="voice-file-time">{voice.timestamp}</span>
                      </div>
                      <div className="voice-file-actions">
                        <button 
                          className={`btn-play ${playingIndex === index ? 'playing' : ''}`} 
                          onClick={() => playVoice(index)}
                        >
                          {playingIndex === index ? '⏹' : '▶'} Play
                        </button>
                        <button 
                          className="btn-delete-voice" 
                          onClick={() => deleteVoice(index)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="image-section">
              <div className="section-header">
                <Upload size={18} />
                <h4>CNIC Images *</h4>
              </div>
              <div className="image-grid">
                <div className="image-upload-box">
                  <label>CNIC Front</label>
                  <div className="upload-area" onClick={() => cnicFrontRef.current?.click()}>
                    {formData.cnicFrontPreview ? (
                      <div className="preview-container">
                        <img src={formData.cnicFrontPreview} alt="CNIC Front" />
                        <button className="remove-btn" onClick={(e) => { e.stopPropagation(); removeFile('cnicFront'); }}><X size={16} /></button>
                      </div>
                    ) : ( <><Upload size={32} /><span>Click to upload</span></> )}
                  </div>
                  <input type="file" ref={cnicFrontRef} accept="image/*" onChange={(e) => handleFileUpload(e, 'cnicFront')} style={{ display: 'none' }} />
                  {errors.cnicFront && <span className="error-text">{errors.cnicFront}</span>}
                </div>
                <div className="image-upload-box">
                  <label>CNIC Back</label>
                  <div className="upload-area" onClick={() => cnicBackRef.current?.click()}>
                    {formData.cnicBackPreview ? (
                      <div className="preview-container">
                        <img src={formData.cnicBackPreview} alt="CNIC Back" />
                        <button className="remove-btn" onClick={(e) => { e.stopPropagation(); removeFile('cnicBack'); }}><X size={16} /></button>
                      </div>
                    ) : ( <><Upload size={32} /><span>Click to upload</span></> )}
                  </div>
                  <input type="file" ref={cnicBackRef} accept="image/*" onChange={(e) => handleFileUpload(e, 'cnicBack')} style={{ display: 'none' }} />
                  {errors.cnicBack && <span className="error-text">{errors.cnicBack}</span>}
                </div>
              </div>
            </div>

            <div className="guarantors-section">
              <div className="section-header">
                <Users size={18} />
                <h4>Guarantors</h4>
                <span className="required-badge">Minimum 2 Required</span>
              </div>
              <p className="guarantor-count">Complete: {getGuarantorCount()}/3</p>
              {formData.guarantors.map((g, index) => (
                <div key={index} className="guarantor-card">
                  <div className="guarantor-header">
                    <Users size={16} />
                    <span>Guarantor {index + 1}</span>
                    {g.name && g.cnic && g.cnicFront && g.cnicBack && <span className="filled-badge"><CheckCircle size={12} /> Complete</span>}
                  </div>
                  <div className="guarantor-grid">
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Full Name" 
                      value={g.name} 
                      onChange={(e) => handleGuarantorChange(index, 'name', e.target.value)} 
                    />
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="CNIC" 
                      value={g.cnic} 
                      onChange={(e) => handleGuarantorChange(index, 'cnic', e.target.value)} 
                      onBlur={() => handleGuarantorCnicBlur(index)}
                    />
                    <input 
                      type="tel" 
                      className="form-input" 
                      placeholder="Phone" 
                      value={g.phone} 
                      onChange={(e) => handleGuarantorChange(index, 'phone', e.target.value)} 
                    />
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Address" 
                      value={g.address} 
                      onChange={(e) => handleGuarantorChange(index, 'address', e.target.value)} 
                    />
                  </div>
                  <div className="guarantor-images">
                    <div className="guarantor-image-box">
                      <label>CNIC Front</label>
                      <div className="upload-area small" onClick={() => { if (!guarantorRefs.current[index]) guarantorRefs.current[index] = {}; guarantorRefs.current[index].front?.click(); }}>
                        {g.cnicFrontPreview ? (
                          <div className="preview-container">
                            <img src={g.cnicFrontPreview} alt="Guarantor CNIC Front" />
                            <button className="remove-btn" onClick={(e) => { e.stopPropagation(); removeGuarantorFile(index, 'cnicFront'); }}><X size={14} /></button>
                          </div>
                        ) : ( <><Upload size={20} /><span>Upload Front</span></> )}
                      </div>
                      <input type="file" ref={(el) => { if (!guarantorRefs.current[index]) guarantorRefs.current[index] = {}; guarantorRefs.current[index].front = el; }} accept="image/*" onChange={(e) => handleGuarantorFileUpload(e, index, 'cnicFront')} style={{ display: 'none' }} />
                    </div>
                    <div className="guarantor-image-box">
                      <label>CNIC Back</label>
                      <div className="upload-area small" onClick={() => { if (!guarantorRefs.current[index]) guarantorRefs.current[index] = {}; guarantorRefs.current[index].back?.click(); }}>
                        {g.cnicBackPreview ? (
                          <div className="preview-container">
                            <img src={g.cnicBackPreview} alt="Guarantor CNIC Back" />
                            <button className="remove-btn" onClick={(e) => { e.stopPropagation(); removeGuarantorFile(index, 'cnicBack'); }}><X size={14} /></button>
                          </div>
                        ) : ( <><Upload size={20} /><span>Upload Back</span></> )}
                      </div>
                      <input type="file" ref={(el) => { if (!guarantorRefs.current[index]) guarantorRefs.current[index] = {}; guarantorRefs.current[index].back = el; }} accept="image/*" onChange={(e) => handleGuarantorFileUpload(e, index, 'cnicBack')} style={{ display: 'none' }} />
                    </div>
                  </div>
                  <small className="field-hint">System will check if this CNIC is already a customer or guarantor</small>
                </div>
              ))}
              {errors.guarantors && <span className="error-text">{errors.guarantors}</span>}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="step-content">
            <div className="step-header">
              <div className="step-number">2</div>
              <div className="step-title">Product & Installment Details</div>
              <span className="step-badge">Required</span>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Product Type *</label>
                <select name="productType" className="form-input" value={formData.productType} onChange={handleChange}>
                  <option value="new">New</option>
                  <option value="used">Used</option>
                </select>
              </div>
              <div className="form-group">
                <label>Product Name *</label>
                <div className="input-with-icon">
                  <Package size={18} />
                  <input type="text" name="productName" className="form-input" placeholder="Enter product name" value={formData.productName} onChange={handleChange} />
                </div>
                {errors.productName && <span className="error-text">{errors.productName}</span>}
              </div>
              <div className="form-group">
                <label>Product Price (PKR) *</label>
                <div className="input-with-icon">
                  <DollarSign size={18} />
                  <input type="number" name="productPrice" className="form-input" placeholder="Enter product price" value={formData.productPrice} onChange={handleChange} />
                </div>
                {errors.productPrice && <span className="error-text">{errors.productPrice}</span>}
              </div>
              <div className="form-group">
                <label>Invoice Price (PKR) *</label>
                <div className="input-with-icon">
                  <DollarSign size={18} />
                  <input type="number" name="invoicePrice" className="form-input" placeholder="Enter invoice price" value={formData.invoicePrice} onChange={handleChange} />
                </div>
                {errors.invoicePrice && <span className="error-text">{errors.invoicePrice}</span>}
              </div>
              <div className="form-group">
                <label>Advance / 1st Installment (PKR)</label>
                <div className="input-with-icon">
                  <DollarSign size={18} />
                  <input type="number" name="advanceAmount" className="form-input" placeholder="Enter advance amount" value={formData.advanceAmount} onChange={handleChange} />
                </div>
              </div>
              <div className="form-group">
                <label>Number of Installments *</label>
                <div className="input-with-icon">
                  <Calendar size={18} />
                  <input type="number" name="noOfInstallments" className="form-input" placeholder="e.g., 6, 12, 24" value={formData.noOfInstallments} onChange={handleChange} />
                </div>
                {errors.noOfInstallments && <span className="error-text">{errors.noOfInstallments}</span>}
              </div>
              <div className="form-group">
                <label>Due Date *</label>
                <input type="date" name="dueDate" className="form-input" value={formData.dueDate} onChange={handleChange} />
                {errors.dueDate && <span className="error-text">{errors.dueDate}</span>}
              </div>
              <div className="form-group">
                <label>Installment Amount</label>
                <div className="input-with-icon">
                  <DollarSign size={18} />
                  <input type="text" className="form-input" value={formData.productPrice && formData.noOfInstallments ? `PKR ${(parseInt(formData.productPrice) / parseInt(formData.noOfInstallments)).toLocaleString()}` : 'Calculate from price and installments'} readOnly style={{ background: '#f8f9fa' }} />
                </div>
              </div>
            </div>

            <div className="image-section">
              <div className="section-header">
                <Upload size={18} />
                <h4>Chalan Images *</h4>
              </div>
              <div className="image-grid">
                <div className="image-upload-box">
                  <label>Chalan Front</label>
                  <div className="upload-area" onClick={() => chalanFrontRef.current?.click()}>
                    {formData.chalanFrontPreview ? (
                      <div className="preview-container">
                        <img src={formData.chalanFrontPreview} alt="Chalan Front" />
                        <button className="remove-btn" onClick={(e) => { e.stopPropagation(); removeFile('chalanFront'); }}><X size={16} /></button>
                      </div>
                    ) : ( <><Upload size={32} /><span>Click to upload</span></> )}
                  </div>
                  <input type="file" ref={chalanFrontRef} accept="image/*" onChange={(e) => handleFileUpload(e, 'chalanFront')} style={{ display: 'none' }} />
                  {errors.chalanFront && <span className="error-text">{errors.chalanFront}</span>}
                </div>
                <div className="image-upload-box">
                  <label>Chalan Back</label>
                  <div className="upload-area" onClick={() => chalanBackRef.current?.click()}>
                    {formData.chalanBackPreview ? (
                      <div className="preview-container">
                        <img src={formData.chalanBackPreview} alt="Chalan Back" />
                        <button className="remove-btn" onClick={(e) => { e.stopPropagation(); removeFile('chalanBack'); }}><X size={16} /></button>
                      </div>
                    ) : ( <><Upload size={32} /><span>Click to upload</span></> )}
                  </div>
                  <input type="file" ref={chalanBackRef} accept="image/*" onChange={(e) => handleFileUpload(e, 'chalanBack')} style={{ display: 'none' }} />
                  {errors.chalanBack && <span className="error-text">{errors.chalanBack}</span>}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="form-actions">
          {step === 2 && <button type="button" className="btn-prev" onClick={handlePrev}>Previous</button>}
          {step === 1 ? (
            <button type="button" className="btn-next" onClick={handleNext}>Next →</button>
          ) : (
            <button type="submit" className="btn-submit">
              <CheckCircle size={18} />
              Create Account
            </button>
          )}
        </div>

        <div className="step-indicator">
          <span className={step === 1 ? 'active' : 'done'}>1. Personal Info</span>
          <span className="step-line"></span>
          <span className={step === 2 ? 'active' : ''}>2. Product & Installments</span>
        </div>
      </form>
    </div>
  );
};

export default AddAccount;