// src/components/AddAccount/AddAccount.jsx

import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, User, Phone, CreditCard, MapPin, Briefcase, Users, Package, DollarSign, Calendar, Upload, X, UserPlus, Mic, Play, Trash2, FileAudio, Building, CheckCircle, AlertCircle, Clock, Bell, Shield, PauseCircle, PlayCircle, UserCheck, Star, FileImage, Wallet
} from 'lucide-react';
import './AddAccount.css';
import { API_URL } from '../../../config';

const MAX_ACCOUNTS_PER_CNIC = 2;
const MAX_COMBINED_AMOUNT = 100000;

const AddAccount = () => {
  const [step, setStep] = useState(1);
  const [searchCNIC, setSearchCNIC] = useState('');
  const [showExisting, setShowExisting] = useState(false);
  const [existingAccounts, setExistingAccounts] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [userBranch, setUserBranch] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);

  const [voiceFiles, setVoiceFiles] = useState([]);
  const [playingIndex, setPlayingIndex] = useState(null);

  // ✅ DOUBLE SUBMIT GUARD
  const isSubmittingRef = useRef(false);

  // ✅ NAYA: real CNIC check ka data
  const [existingAccountData, setExistingAccountData] = useState(null);
  const [showExistingAccountModal, setShowExistingAccountModal] = useState(false);
  const [cnicCheckLoading, setCnicCheckLoading] = useState(false);

  // ✅ NAYA: Special Customer toggle
  const [isSpecialCustomer, setIsSpecialCustomer] = useState(false);

  const showToast = (message, type = 'warning', details = null) => {
    setToast({ message, type, details });
  };

  // ============================================
  // ✅ REAL CNIC CHECK — Main Customer field
  // ============================================
  const handleCnicBlur = async () => {
    if (!formData.cnic || formData.cnic.length < 5) return;

    setCnicCheckLoading(true);
    const token = localStorage.getItem('token');

    try {
      const custRes = await fetch(`${API_URL}/customers/check-cnic`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ cnic: formData.cnic })
      });
      const custJson = await custRes.json();
      const custData = custJson.data;

      if (custData && custData.exists_as_customer) {
        setExistingAccountData(custData);
        setShowExistingAccountModal(true);

        if (custData.is_unlimited) {
          setIsSpecialCustomer(true);
        }

        if (custData.is_unlimited) {
          showToast(
            `⭐ ${custData.customer.name} is marked as a Special Customer — account/amount limits do not apply.`,
            'info'
          );
        } else if (!custData.can_open_more) {
          showToast(
            `🚫 ${custData.customer.name} already has ${custData.accounts_count} account(s) — maximum limit reached. No more accounts can be opened.`,
            'warning'
          );
        } else {
          showToast(
            `⚠️ ${custData.customer.name} already has an account! Remaining limit: PKR ${Number(custData.remaining_limit).toLocaleString()}`,
            'warning'
          );
        }
      } else {
        setExistingAccountData(null);
      }

      if (custData && custData.exists_as_guarantor && custData.guarantor_records?.length > 0) {
        const details = custData.guarantor_records.map(g =>
          `• Guarantor for: ${g.customer_name} (${g.customer_cnic})`
        ).join('\n');
        showToast(
          `ℹ️ This person (${formData.cnic}) is already a guarantor for ${custData.guarantor_records.length} customer(s)!`,
          'info',
          details
        );
      }
    } catch (err) {
      console.error('CNIC check error:', err);
    }
    setCnicCheckLoading(false);
  };

  // ============================================
  // ✅ REAL CNIC CHECK — Guarantor fields
  // ============================================
  const handleGuarantorCnicBlur = async (index) => {
    const cnic = formData.guarantors[index].cnic;
    if (!cnic || cnic.length < 5) return;

    const token = localStorage.getItem('token');

    try {
      const custRes = await fetch(`${API_URL}/customers/check-cnic`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ cnic })
      });
      const custJson = await custRes.json();
      const custData = custJson.data;

      if (custData && custData.exists_as_customer) {
        showToast(
          `ℹ️ Guarantor CNIC (${cnic}) belongs to existing customer: ${custData.customer.name}`,
          'info'
        );
        return;
      }

      const gRes = await fetch(`${API_URL}/guarantors/check-cnic`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ cnic })
      });
      const gJson = await gRes.json();
      const gData = gJson.data;

      if (gData && gData.exists_as_guarantor && gData.guarantor_records?.length > 0) {
        const details = gData.guarantor_records.map(r =>
          `• Already guarantor for: ${r.customer_name} (${r.customer_cnic})`
        ).join('\n');
        showToast(
          `⚠️ This CNIC (${cnic}) is already a guarantor for ${gData.guarantor_records.length} customer(s)!`,
          'warning',
          details
        );
      }
    } catch (err) {
      console.error('Guarantor CNIC check error:', err);
    }
  };

  const allEmployees = [
    { id: 2, name: 'Ahmed Khan', branch: 1, role: 'employee' },
    { id: 4, name: 'Usman Malik', branch: 1, role: 'employee' },
    { id: 5, name: 'Fatima Noor', branch: 2, role: 'employee' },
    { id: 6, name: 'Bilal Ahmed', branch: 1, role: 'employee' },
    { id: 7, name: 'Hina Riaz', branch: 2, role: 'employee' },
    { id: 9, name: 'Nadia Khan', branch: 2, role: 'employee' },
    { id: 11, name: 'hamza', branch: 1, role: 'employee' },
    { id: 3, name: 'Sara Ali', branch: 2, role: 'manager' },
    { id: 8, name: 'Imran Ali', branch: 1, role: 'manager' },
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
    additionalImage1: null,
    additionalImage2: null,
    additionalImage1Preview: '',
    additionalImage2Preview: '',
    billImage1: null,
    billImage2: null,
    billImage1Preview: '',
    billImage2Preview: '',
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
    paymentType: 'cash',
    chalanFront: null,
    chalanBack: null,
    chalanFrontPreview: '',
    chalanBackPreview: '',
    accountType: 'regular',
    branch: 1,
    status: 'active',
    created_by: null,
  });

  const [errors, setErrors] = useState({});

  const cnicFrontRef = useRef(null);
  const cnicBackRef = useRef(null);
  const chalanFrontRef = useRef(null);
  const chalanBackRef = useRef(null);
  const voiceFileRef = useRef(null);
  const additionalImage1Ref = useRef(null);
  const additionalImage2Ref = useRef(null);
  const billImage1Ref = useRef(null);
  const billImage2Ref = useRef(null);
  const guarantorRefs = useRef([]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // ✅ AUTO-DETECT LOGGED-IN USER
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      console.log('🔍 Logged-in User:', user);
      
      setUserRole(user.role);
      setUserBranch(user.branch);
      setUserId(user.id);
      setUserName(user.name);
      setUserEmail(user.email);
      
      if (user.branch) {
        setFormData(prev => ({ 
          ...prev, 
          branch: parseInt(user.branch)
        }));
      }
      
      if (user.role === 'employee' || user.role === 'manager') {
        setFormData(prev => ({ 
          ...prev, 
          employeeId: parseInt(user.id) 
        }));
      }
    }
  }, []);

  const getEmployeesByBranch = (branch) => {
    return allEmployees.filter(emp => emp.branch === branch && emp.role === 'employee');
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
    
    if (name === 'invoicePrice' || name === 'advanceAmount' || name === 'noOfInstallments') {
      calculateInstallment();
    }
  };

  const calculateInstallment = () => {
    const invoice = parseFloat(formData.invoicePrice) || 0;
    const advance = parseFloat(formData.advanceAmount) || 0;
    const installments = parseInt(formData.noOfInstallments) || 0;
    
    const remaining = invoice - advance;
    
    let perInstallment = 0;
    if (installments > 0 && remaining > 0) {
      perInstallment = remaining / installments;
    }
    
    setFormData(prev => ({
      ...prev,
      installmentAmount: perInstallment > 0 ? perInstallment.toFixed(2) : ''
    }));
  };

  useEffect(() => {
    calculateInstallment();
  }, [formData.invoicePrice, formData.advanceAmount, formData.noOfInstallments]);

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

  // ✅ NEW: Bill Image Upload Handlers
  const handleBillImageUpload = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const previewUrl = URL.createObjectURL(file);
    
    if (type === 'bill1') {
      setFormData({ ...formData, billImage1: file, billImage1Preview: previewUrl });
    } else if (type === 'bill2') {
      setFormData({ ...formData, billImage2: file, billImage2Preview: previewUrl });
    }
  };

  const removeBillImage = (type) => {
    if (type === 'bill1') {
      setFormData({ ...formData, billImage1: null, billImage1Preview: '' });
      if (billImage1Ref.current) billImage1Ref.current.value = '';
    } else if (type === 'bill2') {
      setFormData({ ...formData, billImage2: null, billImage2Preview: '' });
      if (billImage2Ref.current) billImage2Ref.current.value = '';
    }
  };

  const handleAdditionalImageUpload = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const previewUrl = URL.createObjectURL(file);
    
    if (type === 'additionalImage1') {
      setFormData({ ...formData, additionalImage1: file, additionalImage1Preview: previewUrl });
    } else if (type === 'additionalImage2') {
      setFormData({ ...formData, additionalImage2: file, additionalImage2Preview: previewUrl });
    }
  };

  const removeAdditionalImage = (type) => {
    if (type === 'additionalImage1') {
      setFormData({ ...formData, additionalImage1: null, additionalImage1Preview: '' });
      if (additionalImage1Ref.current) additionalImage1Ref.current.value = '';
    } else if (type === 'additionalImage2') {
      setFormData({ ...formData, additionalImage2: null, additionalImage2Preview: '' });
      if (additionalImage2Ref.current) additionalImage2Ref.current.value = '';
    }
  };

  const handleFileUpload = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const previewUrl = URL.createObjectURL(file);
    
    if (type === 'cnicFront') {
      setFormData({ ...formData, cnicFront: file, cnicFrontPreview: previewUrl });
    } else if (type === 'cnicBack') {
      setFormData({ ...formData, cnicBack: file, cnicBackPreview: previewUrl });
    } else if (type === 'chalanFront') {
      setFormData({ ...formData, chalanFront: file, chalanFrontPreview: previewUrl });
    } else if (type === 'chalanBack') {
      setFormData({ ...formData, chalanBack: file, chalanBackPreview: previewUrl });
    }
  };

  const removeFile = (type) => {
    if (type === 'cnicFront') { 
      setFormData({ ...formData, cnicFront: null, cnicFrontPreview: '' }); 
      if (cnicFrontRef.current) cnicFrontRef.current.value = ''; 
    } else if (type === 'cnicBack') { 
      setFormData({ ...formData, cnicBack: null, cnicBackPreview: '' }); 
      if (cnicBackRef.current) cnicBackRef.current.value = ''; 
    } else if (type === 'chalanFront') { 
      setFormData({ ...formData, chalanFront: null, chalanFrontPreview: '' }); 
      if (chalanFrontRef.current) chalanFrontRef.current.value = ''; 
    } else if (type === 'chalanBack') { 
      setFormData({ ...formData, chalanBack: null, chalanBackPreview: '' }); 
      if (chalanBackRef.current) chalanBackRef.current.value = ''; 
    }
  };

  // ✅ Check for duplicate CNIC in guarantors
  const checkDuplicateGuarantorCnic = () => {
    const cnics = formData.guarantors
      .filter(g => g.cnic && g.cnic.trim())
      .map(g => g.cnic.trim());
    
    const uniqueCnics = new Set(cnics);
    return cnics.length !== uniqueCnics.size;
  };

  // ✅ STEP 1 VALIDATION
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
    
    // ✅ Additional images are still required (keeping old logic)
    if (!formData.additionalImage1) {
      newErrors.additionalImage1 = 'Additional Image 1 is required';
    }
    if (!formData.additionalImage2) {
      newErrors.additionalImage2 = 'Additional Image 2 is required';
    }
    
    // ✅ Check duplicate CNIC in guarantors
    if (checkDuplicateGuarantorCnic()) {
      newErrors.guarantors = 'Duplicate CNIC found in guarantors. Each guarantor must have a unique CNIC.';
    }
    
    const completeGuarantors = formData.guarantors.filter(g => g.name.trim() && g.cnic.trim() && g.phone.trim() && g.address.trim() && g.cnicFront !== null && g.cnicBack !== null);
    if (completeGuarantors.length < 2) {
      newErrors.guarantors = 'Minimum 2 complete guarantors required';
    }

    if (!isSpecialCustomer && existingAccountData && existingAccountData.exists_as_customer && !existingAccountData.can_open_more) {
      newErrors.cnic = `This CNIC already has ${existingAccountData.accounts_count} accounts. Maximum limit reached.`;
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
    
    if (!formData.chalanFront) {
      newErrors.chalanFront = 'Chalan Front image is required';
    }

    if (!isSpecialCustomer) {
      const newAmount = parseFloat(formData.invoicePrice) || 0;
      const existingTotal = (existingAccountData && existingAccountData.exists_as_customer)
        ? (existingAccountData.total_combined_amount || 0)
        : 0;
      const projectedTotal = existingTotal + newAmount;

      if (projectedTotal > MAX_COMBINED_AMOUNT) {
        newErrors.invoicePrice = `Combined amount cannot exceed PKR ${MAX_COMBINED_AMOUNT.toLocaleString()}. Remaining limit: PKR ${Math.max(0, MAX_COMBINED_AMOUNT - existingTotal).toLocaleString()}`;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!isSpecialCustomer && existingAccountData && existingAccountData.exists_as_customer && !existingAccountData.can_open_more) {
      showToast('🚫 This CNIC already has the maximum number of accounts. Cannot proceed further.', 'warning');
      return;
    }
    if (validateStep1()) setStep(2);
  };
  const handlePrev = () => setStep(1);

  // ✅ FINAL SUBMIT — NO STATUS MODAL, DIRECT CREATE
  const handleFinalSubmit = (e) => {
    e.preventDefault();
    if (validateStep2()) {
      // ✅ Direct create without status modal
      confirmAccountCreation();
    }
  };

  const confirmAccountCreation = async () => {
    if (isSubmittingRef.current) {
      console.warn('⚠️ Submission already in progress, ignoring duplicate call');
      return;
    }
    isSubmittingRef.current = true;
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));
      
      const loggedInUserId = user?.id || 1;
      const loggedInUserRole = user?.role || 'admin';
      const loggedInUserName = user?.name || 'Admin';
      
      let employeeId = formData.employeeId;
      if (!employeeId) {
        employeeId = loggedInUserId;
      }
      
      console.log('👤 Admin/Manager (Creating):', loggedInUserId, loggedInUserName);
      console.log('👤 Employee (Opening):', employeeId);
      
      const customerFormData = new FormData();
      customerFormData.append('name', formData.name);
      customerFormData.append('cnic', formData.cnic);
      customerFormData.append('phone', formData.phone);
      customerFormData.append('address', formData.address);
      customerFormData.append('work', formData.work);
      customerFormData.append('branch_id', formData.branch);
      customerFormData.append('status', 'active'); // ✅ Always active
      customerFormData.append('created_by', parseInt(employeeId));
      customerFormData.append('product_name', formData.productName);
      customerFormData.append('invoice_price', parseFloat(formData.invoicePrice) || 0);
      
      customerFormData.append('number_of_installments', parseInt(formData.noOfInstallments) || 0);
      customerFormData.append('due_date', formData.dueDate);
      customerFormData.append('advance_payment', parseFloat(formData.advanceAmount) || 0);
      customerFormData.append('payment_type', formData.paymentType || 'cash');
      
      customerFormData.append('is_unlimited', isSpecialCustomer ? 1 : 0);
      
      if (formData.cnicFront) {
        customerFormData.append('cnic_front', formData.cnicFront);
      }
      if (formData.cnicBack) {
        customerFormData.append('cnic_back', formData.cnicBack);
      }
      
      if (formData.additionalImage1) {
        customerFormData.append('additional_image_1', formData.additionalImage1);
      }
      if (formData.additionalImage2) {
        customerFormData.append('additional_image_2', formData.additionalImage2);
      }
      
      // ✅ Bill Images (Optional)
      if (formData.billImage1) {
        customerFormData.append('bill_image_1', formData.billImage1);
      }
      if (formData.billImage2) {
        customerFormData.append('bill_image_2', formData.billImage2);
      }
      
      // ✅ Voice Consent — OPTIONAL
      if (voiceFiles.length > 0) {
        customerFormData.append('voice_consent', voiceFiles[0].file);
      }
      
      if (formData.chalanFront) {
        customerFormData.append('chalan_front', formData.chalanFront);
      }
      if (formData.chalanBack) {
        customerFormData.append('chalan_back', formData.chalanBack);
      }

      const validGuarantors = formData.guarantors
        .map((g, originalIndex) => ({ ...g, originalIndex }))
        .filter(g => g.name.trim() && g.cnic.trim() && g.phone.trim());

      customerFormData.append('guarantors', JSON.stringify(
        validGuarantors.map(g => ({
          name: g.name.trim(),
          cnic: g.cnic.trim(),
          phone: g.phone.trim(),
          address: g.address?.trim() || ''
        }))
      ));

      const remainingAmount = (parseFloat(formData.invoicePrice) || 0) - (parseFloat(formData.advanceAmount) || 0);
      const totalInstallments = parseInt(formData.noOfInstallments) || 0;
      const monthlyInstallment = totalInstallments > 0 && remainingAmount > 0 
        ? remainingAmount / totalInstallments 
        : 0;

      const response = await fetch(`${API_URL}/customers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: customerFormData,
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          const apiErrors = {};
          Object.keys(data.errors).forEach(key => {
            apiErrors[key] = data.errors[key][0];
          });
          setErrors(apiErrors);
          const firstMessage = Object.values(apiErrors)[0];
          showToast(`❌ ${firstMessage}`, 'warning');
        } else {
          setErrors({ form: data.message || 'Failed to create customer' });
          showToast(`❌ ${data.message || 'Failed to create customer'}`, 'warning');
        }
        setLoading(false);
        isSubmittingRef.current = false;
        return;
      }

      if (data.success) {
        const customerId = data.data.id;
        const employeeAccountId = data.data.employee_account_id || data.employee_account_id;
        const createdAccount = Array.isArray(data.data.accounts) && data.data.accounts.length > 0
          ? data.data.accounts[0]
          : null;
        
        console.log('✅ Customer created with ID:', customerId);
        console.log('✅ Employee Account ID:', employeeAccountId);
        console.log('✅ Account created (from customer response):', createdAccount);

        if (validGuarantors.length > 0) {
          for (let i = 0; i < validGuarantors.length; i++) {
            const guarantor = validGuarantors[i];
            try {
              const cleanCnic = guarantor.cnic.trim().replace(/[^0-9]/g, '');
              
              const guarantorFormData = new FormData();
              guarantorFormData.append('customer_id', customerId);
              guarantorFormData.append('name', guarantor.name.trim());
              guarantorFormData.append('cnic', cleanCnic);
              guarantorFormData.append('phone', guarantor.phone.trim());
              guarantorFormData.append('address', guarantor.address?.trim() || '');
              guarantorFormData.append('created_by', parseInt(employeeId));
              
              const originalGuarantor = formData.guarantors[guarantor.originalIndex];
              
              if (originalGuarantor && originalGuarantor.cnicFront) {
                guarantorFormData.append('cnic_front', originalGuarantor.cnicFront);
              }
              if (originalGuarantor && originalGuarantor.cnicBack) {
                guarantorFormData.append('cnic_back', originalGuarantor.cnicBack);
              }
              
              const guarantorResponse = await fetch(`${API_URL}/guarantors`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
                body: guarantorFormData,
              });
              
              const guarantorResult = await guarantorResponse.json();
              
              if (!guarantorResponse.ok) {
                console.warn(`⚠️ Guarantor "${guarantor.name}" not created:`, guarantorResult);
                continue;
              }
              console.log(`✅ Guarantor ${i+1} created:`, guarantorResult);
            } catch (gError) {
              console.warn('⚠️ Error creating guarantor:', gError.message);
            }
          }
        }
        
        const empName = getSelectedEmployeeName() || user?.name || 'N/A';
        
        alert(`✅ Account created successfully!\n\nCustomer: ${formData.name}\nProduct: ${formData.productName}\nCase: ${createdAccount?.case_no || 'N/A'}\nStatus: ACTIVE\nPayment Type: ${formData.paymentType.toUpperCase()}\nGuarantors: ${validGuarantors.length} added\nMonthly Installment: PKR ${Math.round(monthlyInstallment * 100) / 100}\n\nAccount Created By: ${loggedInUserName} (${loggedInUserRole})\nEmployee Who Opened: ${empName}`);
        
        // Reset form
        setFormData({
          name: '',
          cnic: '',
          phone: '',
          address: '',
          work: '',
          employeeId: user?.role === 'admin' ? '' : user?.id || '',
          cnicFront: null,
          cnicBack: null,
          cnicFrontPreview: '',
          cnicBackPreview: '',
          additionalImage1: null,
          additionalImage2: null,
          additionalImage1Preview: '',
          additionalImage2Preview: '',
          billImage1: null,
          billImage2: null,
          billImage1Preview: '',
          billImage2Preview: '',
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
          paymentType: 'cash',
          chalanFront: null,
          chalanBack: null,
          chalanFrontPreview: '',
          chalanBackPreview: '',
          accountType: 'regular',
          branch: userBranch || 1,
          status: 'active',
          created_by: null,
        });
        setVoiceFiles([]);
        setExistingAccountData(null);
        setIsSpecialCustomer(false);
        setStep(1);
      } else {
        setErrors({ form: data.message || 'Failed to create customer' });
        showToast(`❌ ${data.message || 'Failed to create customer'}`, 'warning');
      }
    } catch (err) {
      console.error('Error:', err);
      setErrors({ form: 'Network error. Please try again.' });
      showToast('❌ Network error. Please check your connection.', 'warning');
    }
    
    setLoading(false);
    isSubmittingRef.current = false;
  };

  const getGuarantorCount = () => {
    return formData.guarantors.filter(g => g.name && g.cnic && g.phone && g.address && g.cnicFront !== null && g.cnicBack !== null).length;
  };

  const getSelectedEmployeeName = () => {
    if (userRole === 'admin' && formData.employeeId) {
      const emp = allEmployees.find(e => e.id === parseInt(formData.employeeId));
      return emp ? emp.name : '';
    }
    return userName || '';
  };

  const isAdmin = userRole === 'admin';
  const isManager = userRole === 'manager';
  const isEmployee = userRole === 'employee';

  const branchLabel = userBranch ? `Branch ${userBranch}` : 'All Branches';

  const getUserRoleDisplay = () => {
    if (userRole === 'admin') return 'Admin';
    if (userRole === 'manager') return 'Manager';
    if (userRole === 'employee') return 'Employee';
    return 'User';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount || 0);
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
    <div className="add-account-container">
      {toast && (
        <div className={`toast-notification ${toast.type}`}>
          <div className="toast-content">
            {toast.type === 'warning' ? <AlertCircle size={20} /> : <Shield size={20} />}
            <div>
              <span style={{ fontWeight: 700 }}>{toast.message}</span>
              {toast.details && (
                <div className="toast-details">
                  {toast.details.split('\n').map((line, i) => (
                    <div key={i} className="toast-detail-line" style={{ fontWeight: 500 }}>{line}</div>
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

      <div className="user-info-bar" style={{
        background: 'linear-gradient(135deg, #1E1B4B 0%, #312e81 100%)',
        color: 'white',
        padding: '12px 20px',
        borderRadius: '10px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <UserCheck size={20} style={{ color: '#c4b5fd' }} />
          <span style={{ fontWeight: 600 }}>Account created by:</span>
          <span style={{ fontWeight: 700 }}>{userName || 'N/A'}</span>
          <span style={{ 
            background: 'rgba(255,255,255,0.15)', 
            padding: '2px 12px', 
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 600
          }}>
            {getUserRoleDisplay()}
          </span>
          {userEmail && (
            <span style={{ fontSize: '13px', opacity: 0.8 }}>({userEmail})</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Building size={16} style={{ color: '#c4b5fd' }} />
          <span style={{ fontWeight: 500 }}>{branchLabel}</span>
        </div>
      </div>

      {showExistingAccountModal && existingAccountData && (
        <div className="status-modal-overlay" onClick={() => setShowExistingAccountModal(false)}>
          <div className="status-modal" style={{ maxWidth: '720px', maxHeight: '85vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div className="status-modal-header">
              <AlertCircle size={24} className="status-modal-icon" style={{ color: '#ef4444' }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Existing Customer Found</h3>
              <button className="status-modal-close" onClick={() => setShowExistingAccountModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="status-modal-body">
              <div style={{
                padding: '14px',
                background: existingAccountData.can_open_more ? '#fef3c7' : '#fee2e2',
                borderRadius: '10px',
                marginBottom: '16px',
                fontWeight: 700
              }}>
                {existingAccountData.can_open_more
                  ? `⚠️ ${existingAccountData.accounts_count} account already exists. Combined amount so far: ${formatCurrency(existingAccountData.total_combined_amount)}. Remaining limit: ${formatCurrency(existingAccountData.remaining_limit)}`
                  : `🚫 This CNIC already has ${existingAccountData.accounts_count} account(s) — limit reached. Combined amount: ${formatCurrency(existingAccountData.total_combined_amount)}`}
              </div>

              <h4 style={{ fontWeight: 700, marginBottom: '8px' }}>Customer Info</h4>
              <div className="form-grid" style={{ marginBottom: '16px' }}>
                <div><strong>Name:</strong> {existingAccountData.customer.name}</div>
                <div><strong>CNIC:</strong> {existingAccountData.customer.cnic}</div>
                <div><strong>Phone:</strong> {existingAccountData.customer.phone}</div>
                <div><strong>Address:</strong> {existingAccountData.customer.address}</div>
                <div><strong>Work:</strong> {existingAccountData.customer.work}</div>
                <div><strong>Branch:</strong> Branch {existingAccountData.customer.branch_id}</div>
              </div>

              <h4 style={{ fontWeight: 700, marginBottom: '8px' }}>Existing Account(s)</h4>
              {existingAccountData.accounts.map(acc => (
                <div key={acc.id} style={{ border: '1px solid #e5e7eb', borderRadius: '10px', padding: '14px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginBottom: '8px' }}>
                    <span>Case: {acc.case_no}</span>
                    <span>{acc.product_name}</span>
                  </div>
                  <div className="form-grid" style={{ fontSize: '13px' }}>
                    <div>Total: {formatCurrency(acc.total_amount)}</div>
                    <div>Paid: {formatCurrency(acc.paid_amount)}</div>
                    <div>Balance: {formatCurrency(acc.balance)}</div>
                    <div>Installments: {acc.installments_paid}/{acc.total_installments}</div>
                    <div>Created By: {acc.creator_name}</div>
                    <div>Employee: {acc.employee_name}</div>
                    <div>Opened: {formatDate(acc.created_at)}</div>
                  </div>
                </div>
              ))}

              {existingAccountData.guarantor_records && existingAccountData.guarantor_records.length > 0 && (
                <>
                  <h4 style={{ fontWeight: 700, marginBottom: '8px', marginTop: '12px' }}>This CNIC Is Also a Guarantor For</h4>
                  {existingAccountData.guarantor_records.map((g, idx) => (
                    <div key={idx} style={{ fontSize: '13px', padding: '6px 0' }}>
                      • {g.customer_name} ({g.customer_cnic})
                    </div>
                  ))}
                </>
              )}
            </div>
            <div className="status-modal-footer">
              <button className="status-btn-cancel" onClick={() => setShowExistingAccountModal(false)} style={{ fontWeight: 700 }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="page-header">
        <div className="header-title-group">
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Create New Account</h3>
          <span className="live-badge" style={{ fontWeight: 700 }}><Clock size={12} /> New</span>
        </div>
        {userBranch && (
          <div className="branch-badge-header" style={{ fontWeight: 700 }}>
            <Building size={14} />
            <span>{branchLabel}</span>
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          padding: '14px 18px',
          borderRadius: '10px',
          marginBottom: '20px',
          border: isSpecialCustomer ? '2px solid #C9A84C' : '1px solid #e5e7eb',
          background: isSpecialCustomer ? '#fdf8ec' : '#f9fafb',
          transition: 'all 0.2s ease'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Star size={20} style={{ color: isSpecialCustomer ? '#C9A84C' : '#9ca3af' }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: '14px' }}>Special Customer</div>
            <div style={{ fontWeight: 500, fontSize: '12px', color: '#6b7280' }}>
              {isSpecialCustomer
                ? 'ON — 2-account limit aur PKR 100,000 combined-amount limit is CNIC pe apply nahi hongi'
                : 'Enable karne par is CNIC pe koi bhi account/amount limit apply nahi hogi'}
            </div>
          </div>
        </div>
        <label style={{ position: 'relative', display: 'inline-block', width: '46px', height: '26px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={isSpecialCustomer}
            onChange={(e) => setIsSpecialCustomer(e.target.checked)}
            style={{ opacity: 0, width: 0, height: 0 }}
          />
          <span
            style={{
              position: 'absolute',
              inset: 0,
              background: isSpecialCustomer ? '#C9A84C' : '#d1d5db',
              borderRadius: '999px',
              transition: '0.2s'
            }}
          />
          <span
            style={{
              position: 'absolute',
              height: '20px',
              width: '20px',
              left: isSpecialCustomer ? '23px' : '3px',
              bottom: '3px',
              background: 'white',
              borderRadius: '50%',
              transition: '0.2s',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
            }}
          />
        </label>
      </div>

      <div className="cnic-search-section">
        <div className="cnic-search">
          <div className="input-with-icon">
            <Search size={18} />
            <input type="text" className="form-input" placeholder="Search by CNIC..." value={searchCNIC} onChange={(e) => setSearchCNIC(e.target.value)} style={{ fontWeight: 500 }} />
          </div>
          <button className="btn-search" onClick={handleCNICSearch} style={{ fontWeight: 700 }}>
            <Search size={16} />
            Search
          </button>
        </div>
        {showExisting && existingAccounts.length > 0 && (
          <div className="existing-accounts">
            <p className="existing-title" style={{ fontWeight: 700 }}><AlertCircle size={14} /> Existing Accounts Found:</p>
            {existingAccounts.map(acc => (
              <div key={acc.id} className="existing-item" onClick={() => loadExistingAccount(acc)}>
                <div className="existing-info">
                  <strong style={{ fontWeight: 700 }}>{acc.name}</strong>
                  <span style={{ fontWeight: 500 }}>{acc.cnic}</span>
                </div>
                <button className="btn-load" style={{ fontWeight: 700 }}>Load</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={handleFinalSubmit}>
        {step === 1 && (
          <div className="step-content">
            <div className="step-header" style={{ borderLeft: '5px solid #1E1B4B' }}>
              <div className="step-number" style={{ fontWeight: 800 }}>1</div>
              <div className="step-title" style={{ fontSize: '1.1rem', fontWeight: 700 }}>Personal Information</div>
              <span className="step-badge" style={{ fontWeight: 600 }}>Required</span>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label style={{ fontWeight: 700 }}>Full Name *</label>
                <div className="input-with-icon">
                  <User size={18} />
                  <input type="text" name="name" className="form-input" placeholder="Enter customer full name" value={formData.name} onChange={handleChange} style={{ fontWeight: 500 }} />
                </div>
                {errors.name && <span className="error-text" style={{ fontWeight: 600 }}>{errors.name}</span>}
              </div>
              <div className="form-group">
                <label style={{ fontWeight: 700 }}>CNIC *</label>
                <div className="input-with-icon">
                  <CreditCard size={18} />
                  <input type="text" name="cnic" className="form-input" placeholder="XXXXX-XXXXXXX-X" value={formData.cnic} onChange={handleChange} onBlur={handleCnicBlur} style={{ fontWeight: 500 }} />
                </div>
                {errors.cnic && <span className="error-text" style={{ fontWeight: 600 }}>{errors.cnic}</span>}
                <small className="field-hint" style={{ fontWeight: 500 }}>
                  {cnicCheckLoading ? 'Checking CNIC...' : 'System will check if this CNIC already exists or is a guarantor'}
                </small>
              </div>
              <div className="form-group">
                <label style={{ fontWeight: 700 }}>Phone Number *</label>
                <div className="input-with-icon">
                  <Phone size={18} />
                  <input type="tel" name="phone" className="form-input" placeholder="03XX-XXXXXXX" value={formData.phone} onChange={handleChange} style={{ fontWeight: 500 }} />
                </div>
                {errors.phone && <span className="error-text" style={{ fontWeight: 600 }}>{errors.phone}</span>}
              </div>
              <div className="form-group">
                <label style={{ fontWeight: 700 }}>Branch *</label>
                <select name="branch" className="form-input" value={formData.branch} onChange={handleChange} disabled={!!userBranch} style={userBranch ? { opacity: 0.7, cursor: 'not-allowed', fontWeight: 500 } : { fontWeight: 500 }}>
                  <option value={1}>Branch 1</option>
                  <option value={2}>Branch 2</option>
                </select>
                {userBranch && <small className="field-hint" style={{ fontWeight: 500 }}>Branch locked to {branchLabel}</small>}
              </div>
              <div className="form-group">
                <label style={{ fontWeight: 700 }}>Address *</label>
                <div className="input-with-icon">
                  <MapPin size={18} />
                  <input type="text" name="address" className="form-input" placeholder="Enter complete address" value={formData.address} onChange={handleChange} style={{ fontWeight: 500 }} />
                </div>
                {errors.address && <span className="error-text" style={{ fontWeight: 600 }}>{errors.address}</span>}
              </div>
              <div className="form-group">
                <label style={{ fontWeight: 700 }}>Work / Occupation *</label>
                <div className="input-with-icon">
                  <Briefcase size={18} />
                  <input type="text" name="work" className="form-input" placeholder="Enter work/occupation" value={formData.work} onChange={handleChange} style={{ fontWeight: 500 }} />
                </div>
                {errors.work && <span className="error-text" style={{ fontWeight: 600 }}>{errors.work}</span>}
              </div>
            </div>

            <div className="employee-section" style={{ border: '1px solid #c4b5fd', background: '#faf8ff' }}>
              <div className="section-header">
                <UserPlus size={18} style={{ color: '#1E1B4B' }} />
                <h4 style={{ fontWeight: 700 }}>{isAdmin ? 'Select Employee *' : 'Account Opened By *'}</h4>
                {!isAdmin && (
                  <span className="auto-badge" style={{ background: '#dcfce7', color: '#166534', padding: '2px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>
                    Auto-detected
                  </span>
                )}
              </div>
              
              {isAdmin ? (
                <div className="employee-dropdown-wrapper">
                  <select name="employeeId" className="form-input employee-select" value={formData.employeeId} onChange={handleChange} style={{ fontWeight: 500 }}>
                    <option value="">Select Employee...</option>
                    {getAvailableEmployees().map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                  {formData.employeeId && (
                    <div className="selected-employee-info">
                      <span className="employee-badge" style={{ fontWeight: 600 }}>
                        <CheckCircle size={12} />
                        {getSelectedEmployeeName()} - {branchLabel}
                      </span>
                    </div>
                  )}
                  {errors.employeeId && <span className="error-text" style={{ fontWeight: 600 }}>{errors.employeeId}</span>}
                </div>
              ) : (
                <div className="employee-auto-info" style={{ padding: '12px 16px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #86efac', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <UserCheck size={20} style={{ color: '#166534' }} />
                  <div>
                    <span style={{ fontWeight: 700, color: '#166534' }}>{userName || 'N/A'}</span>
                    <span style={{ fontSize: '13px', color: '#6b7280', marginLeft: '8px' }}>
                      ({getUserRoleDisplay()}) - {branchLabel}
                    </span>
                  </div>
                  <input type="hidden" name="employeeId" value={userId || ''} />
                </div>
              )}
              {userBranch && <p className="employee-hint" style={{ fontWeight: 500 }}>Only employees from {branchLabel} are available</p>}
            </div>

            <div className="image-section" style={{ border: '1px solid #fde68a', background: '#fffbeb' }}>
              <div className="section-header">
                <Upload size={18} style={{ color: '#92400e' }} />
                <h4 style={{ fontWeight: 700 }}>Additional Documents / Images</h4>
                <span className="required-badge" style={{ fontWeight: 600, color: '#92400e', background: '#fde68a', padding: '2px 10px', borderRadius: '12px', fontSize: '12px' }}>Both Required</span>
              </div>
              <p className="voice-hint" style={{ fontWeight: 500, color: '#6b7280' }}>Please upload 2 additional required documents</p>
              
              <div className="image-grid">
                <div className="image-upload-box">
                  <label style={{ fontWeight: 600 }}>Additional Image 1 *</label>
                  <div className="upload-area" onClick={() => additionalImage1Ref.current?.click()} style={{ borderColor: errors.additionalImage1 ? '#ef4444' : '#fde68a' }}>
                    {formData.additionalImage1Preview ? (
                      <div className="preview-container">
                        <img src={formData.additionalImage1Preview} alt="Additional Image 1" />
                        <button className="remove-btn" onClick={(e) => { e.stopPropagation(); removeAdditionalImage('additionalImage1'); }}><X size={16} /></button>
                      </div>
                    ) : ( <><Upload size={32} style={{ color: '#92400e' }} /><span style={{ fontWeight: 500 }}>Click to upload</span></> )}
                  </div>
                  <input type="file" ref={additionalImage1Ref} accept="image/*" onChange={(e) => handleAdditionalImageUpload(e, 'additionalImage1')} style={{ display: 'none' }} />
                  {errors.additionalImage1 && <span className="error-text" style={{ fontWeight: 600 }}>{errors.additionalImage1}</span>}
                </div>
                <div className="image-upload-box">
                  <label style={{ fontWeight: 600 }}>Additional Image 2 *</label>
                  <div className="upload-area" onClick={() => additionalImage2Ref.current?.click()} style={{ borderColor: errors.additionalImage2 ? '#ef4444' : '#fde68a' }}>
                    {formData.additionalImage2Preview ? (
                      <div className="preview-container">
                        <img src={formData.additionalImage2Preview} alt="Additional Image 2" />
                        <button className="remove-btn" onClick={(e) => { e.stopPropagation(); removeAdditionalImage('additionalImage2'); }}><X size={16} /></button>
                      </div>
                    ) : ( <><Upload size={32} style={{ color: '#92400e' }} /><span style={{ fontWeight: 500 }}>Click to upload</span></> )}
                  </div>
                  <input type="file" ref={additionalImage2Ref} accept="image/*" onChange={(e) => handleAdditionalImageUpload(e, 'additionalImage2')} style={{ display: 'none' }} />
                  {errors.additionalImage2 && <span className="error-text" style={{ fontWeight: 600 }}>{errors.additionalImage2}</span>}
                </div>
              </div>
            </div>

            {/* ✅ VOICE SECTION — OPTIONAL */}
            <div className="voice-section" style={{ 
              border: voiceFiles.length === 0 ? '1px solid #e5e7eb' : '1px solid #86efac', 
              background: voiceFiles.length === 0 ? '#fafafa' : '#f0fdf4' 
            }}>
              <div className="section-header">
                <Mic size={18} style={{ color: voiceFiles.length === 0 ? '#6b7280' : '#065f46' }} />
                <h4 style={{ fontWeight: 700 }}>Voice Consent / Raza Mandi</h4>
                <span className="optional-badge" style={{ 
                  fontWeight: 600, 
                  color: voiceFiles.length === 0 ? '#6b7280' : '#065f46', 
                  background: voiceFiles.length === 0 ? '#f3f4f6' : '#d1fae5', 
                  padding: '2px 10px', 
                  borderRadius: '12px', 
                  fontSize: '12px' 
                }}>
                  {voiceFiles.length === 0 ? 'Optional' : '✅ Uploaded'}
                </span>
              </div>
              <p className="voice-hint" style={{ fontWeight: 500, color: '#6b7280' }}>
                {voiceFiles.length === 0 
                  ? 'Customer ki raza mandi ki voice file upload karein (Optional)' 
                  : 'Customer ki raza mandi ki voice file upload kar di gayi hai'}
              </p>
              
              <div className="voice-upload">
                <div className="upload-area voice-upload-area" onClick={() => voiceFileRef.current?.click()} style={{ 
                  borderColor: voiceFiles.length === 0 ? '#d1d5db' : '#86efac',
                  background: voiceFiles.length === 0 ? 'white' : '#f0fdf4'
                }}>
                  <FileAudio size={32} style={{ color: voiceFiles.length === 0 ? '#6b7280' : '#065f46' }} />
                  <span style={{ fontWeight: 600 }}>{voiceFiles.length === 0 ? 'Click to upload voice file (Optional)' : 'Click to upload another voice file'}</span>
                  <span className="file-hint" style={{ fontWeight: 500 }}>MP3, WAV, M4A (Max 10MB)</span>
                </div>
                <input type="file" ref={voiceFileRef} accept="audio/*" onChange={handleVoiceFileUpload} style={{ display: 'none' }} />
              </div>

              {errors.voiceConsent && (
                <span className="error-text" style={{ fontWeight: 600, display: 'block', marginTop: '8px' }}>
                  {errors.voiceConsent}
                </span>
              )}

              {voiceFiles.length > 0 && (
                <div className="voice-files-list">
                  <p className="voice-files-title" style={{ fontWeight: 700 }}>Uploaded Files ({voiceFiles.length})</p>
                  {voiceFiles.map((voice, index) => (
                    <div key={voice.id} className="voice-file-item">
                      <div className="voice-file-info">
                        <Mic size={16} style={{ color: '#065f46' }} />
                        <span className="voice-file-name" style={{ fontWeight: 600 }}>{voice.name}</span>
                        <span className="voice-file-size" style={{ fontWeight: 500 }}>{voice.size} KB</span>
                        <span className="voice-file-time" style={{ fontWeight: 500 }}>{voice.timestamp}</span>
                      </div>
                      <div className="voice-file-actions">
                        <button className={`btn-play ${playingIndex === index ? 'playing' : ''}`} onClick={() => playVoice(index)} style={{ fontWeight: 600 }}>
                          {playingIndex === index ? '⏹' : '▶'} Play
                        </button>
                        <button className="btn-delete-voice" onClick={() => deleteVoice(index)}><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="image-section" style={{ border: '1px solid #bfdbfe', background: '#eff6ff' }}>
              <div className="section-header">
                <Upload size={18} style={{ color: '#2563eb' }} />
                <h4 style={{ fontWeight: 700 }}>CNIC Images *</h4>
              </div>
              <div className="image-grid">
                <div className="image-upload-box">
                  <label style={{ fontWeight: 600 }}>CNIC Front</label>
                  <div className="upload-area" onClick={() => cnicFrontRef.current?.click()}>
                    {formData.cnicFrontPreview ? (
                      <div className="preview-container">
                        <img src={formData.cnicFrontPreview} alt="CNIC Front" />
                        <button className="remove-btn" onClick={(e) => { e.stopPropagation(); removeFile('cnicFront'); }}><X size={16} /></button>
                      </div>
                    ) : ( <><Upload size={32} style={{ color: '#2563eb' }} /><span style={{ fontWeight: 500 }}>Click to upload</span></> )}
                  </div>
                  <input type="file" ref={cnicFrontRef} accept="image/*" onChange={(e) => handleFileUpload(e, 'cnicFront')} style={{ display: 'none' }} />
                  {errors.cnicFront && <span className="error-text" style={{ fontWeight: 600 }}>{errors.cnicFront}</span>}
                </div>
                <div className="image-upload-box">
                  <label style={{ fontWeight: 600 }}>CNIC Back</label>
                  <div className="upload-area" onClick={() => cnicBackRef.current?.click()}>
                    {formData.cnicBackPreview ? (
                      <div className="preview-container">
                        <img src={formData.cnicBackPreview} alt="CNIC Back" />
                        <button className="remove-btn" onClick={(e) => { e.stopPropagation(); removeFile('cnicBack'); }}><X size={16} /></button>
                      </div>
                    ) : ( <><Upload size={32} style={{ color: '#2563eb' }} /><span style={{ fontWeight: 500 }}>Click to upload</span></> )}
                  </div>
                  <input type="file" ref={cnicBackRef} accept="image/*" onChange={(e) => handleFileUpload(e, 'cnicBack')} style={{ display: 'none' }} />
                  {errors.cnicBack && <span className="error-text" style={{ fontWeight: 600 }}>{errors.cnicBack}</span>}
                </div>
              </div>
            </div>

            <div className="guarantors-section" style={{ border: '1px solid #fde68a', background: '#fffbeb' }}>
              <div className="section-header">
                <Users size={18} style={{ color: '#92400e' }} />
                <h4 style={{ fontWeight: 700 }}>Guarantors</h4>
                <span className="required-badge" style={{ fontWeight: 700 }}>Minimum 2 Required</span>
              </div>
              <p className="guarantor-count" style={{ fontWeight: 600 }}>Complete: {getGuarantorCount()}/3</p>
              {formData.guarantors.map((g, index) => (
                <div key={index} className="guarantor-card" style={{ border: '1px solid #fde68a' }}>
                  <div className="guarantor-header" style={{ fontWeight: 700 }}>
                    <Users size={16} style={{ color: '#92400e' }} />
                    <span>Guarantor {index + 1}</span>
                    {g.name && g.cnic && g.cnicFront && g.cnicBack && <span className="filled-badge" style={{ fontWeight: 600 }}><CheckCircle size={12} /> Complete</span>}
                  </div>
                  <div className="guarantor-grid">
                    <input type="text" className="form-input" placeholder="Full Name" value={g.name} onChange={(e) => handleGuarantorChange(index, 'name', e.target.value)} style={{ fontWeight: 500 }} />
                    <input type="text" className="form-input" placeholder="CNIC" value={g.cnic} onChange={(e) => handleGuarantorChange(index, 'cnic', e.target.value)} onBlur={() => handleGuarantorCnicBlur(index)} style={{ fontWeight: 500 }} />
                    <input type="tel" className="form-input" placeholder="Phone" value={g.phone} onChange={(e) => handleGuarantorChange(index, 'phone', e.target.value)} style={{ fontWeight: 500 }} />
                    <input type="text" className="form-input" placeholder="Address" value={g.address} onChange={(e) => handleGuarantorChange(index, 'address', e.target.value)} style={{ fontWeight: 500 }} />
                  </div>
                  <div className="guarantor-images">
                    <div className="guarantor-image-box">
                      <label style={{ fontWeight: 600 }}>CNIC Front</label>
                      <div className="upload-area small" onClick={() => { if (!guarantorRefs.current[index]) guarantorRefs.current[index] = {}; guarantorRefs.current[index].front?.click(); }}>
                        {g.cnicFrontPreview ? (
                          <div className="preview-container">
                            <img src={g.cnicFrontPreview} alt="Guarantor CNIC Front" />
                            <button className="remove-btn" onClick={(e) => { e.stopPropagation(); removeGuarantorFile(index, 'cnicFront'); }}><X size={14} /></button>
                          </div>
                        ) : ( <><Upload size={20} style={{ color: '#92400e' }} /><span style={{ fontWeight: 500 }}>Upload Front</span></> )}
                      </div>
                      <input type="file" ref={(el) => { if (!guarantorRefs.current[index]) guarantorRefs.current[index] = {}; guarantorRefs.current[index].front = el; }} accept="image/*" onChange={(e) => handleGuarantorFileUpload(e, index, 'cnicFront')} style={{ display: 'none' }} />
                    </div>
                    <div className="guarantor-image-box">
                      <label style={{ fontWeight: 600 }}>CNIC Back</label>
                      <div className="upload-area small" onClick={() => { if (!guarantorRefs.current[index]) guarantorRefs.current[index] = {}; guarantorRefs.current[index].back?.click(); }}>
                        {g.cnicBackPreview ? (
                          <div className="preview-container">
                            <img src={g.cnicBackPreview} alt="Guarantor CNIC Back" />
                            <button className="remove-btn" onClick={(e) => { e.stopPropagation(); removeGuarantorFile(index, 'cnicBack'); }}><X size={14} /></button>
                          </div>
                        ) : ( <><Upload size={20} style={{ color: '#92400e' }} /><span style={{ fontWeight: 500 }}>Upload Back</span></> )}
                      </div>
                      <input type="file" ref={(el) => { if (!guarantorRefs.current[index]) guarantorRefs.current[index] = {}; guarantorRefs.current[index].back = el; }} accept="image/*" onChange={(e) => handleGuarantorFileUpload(e, index, 'cnicBack')} style={{ display: 'none' }} />
                    </div>
                  </div>
                  <small className="field-hint" style={{ fontWeight: 500 }}>System will check if this CNIC is already a customer or guarantor</small>
                </div>
              ))}
              {errors.guarantors && <span className="error-text" style={{ fontWeight: 600, color: '#dc2626' }}>{errors.guarantors}</span>}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="step-content">
            <div className="step-header" style={{ borderLeft: '5px solid #C9A84C' }}>
              <div className="step-number" style={{ fontWeight: 800 }}>2</div>
              <div className="step-title" style={{ fontSize: '1.1rem', fontWeight: 700 }}>Product & Installment Details</div>
              <span className="step-badge" style={{ fontWeight: 600 }}>Required</span>
            </div>

            {isSpecialCustomer && (
              <div style={{
                padding: '12px 16px',
                background: '#fdf8ec',
                border: '1px solid #C9A84C',
                borderRadius: '10px',
                marginBottom: '16px',
                fontWeight: 700,
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Star size={16} style={{ color: '#C9A84C' }} />
                Special Customer — account count aur combined-amount limits is CNIC pe apply nahi ho rahi.
              </div>
            )}

            {!isSpecialCustomer && existingAccountData && existingAccountData.exists_as_customer && (
              <div style={{
                padding: '12px 16px',
                background: '#fef3c7',
                border: '1px solid #fde68a',
                borderRadius: '10px',
                marginBottom: '16px',
                fontWeight: 600,
                fontSize: '13px'
              }}>
                ℹ️ Combined amount so far: {formatCurrency(existingAccountData.total_combined_amount)} — Remaining limit: {formatCurrency(existingAccountData.remaining_limit)}
              </div>
            )}

            <div className="form-grid">
              <div className="form-group">
                <label style={{ fontWeight: 700 }}>Product Type *</label>
                <select name="productType" className="form-input" value={formData.productType} onChange={handleChange} style={{ fontWeight: 500 }}>
                  <option value="new">New</option>
                  <option value="used">Used</option>
                </select>
              </div>
              <div className="form-group">
                <label style={{ fontWeight: 700 }}>Product Name / Purpose *</label>
                <div className="input-with-icon">
                  <Package size={18} style={{ color: '#C9A84C' }} />
                  <input type="text" name="productName" className="form-input" placeholder="e.g., Mobile, Delivery, Parhayi ki fees, etc." value={formData.productName} onChange={handleChange} style={{ fontWeight: 500 }} />
                </div>
                <small className="field-hint" style={{ fontWeight: 500 }}>What is this account for? (Product name, purpose, description)</small>
                {errors.productName && <span className="error-text" style={{ fontWeight: 600 }}>{errors.productName}</span>}
              </div>
              <div className="form-group">
                <label style={{ fontWeight: 700 }}>Product Price (PKR) *</label>
                <div className="input-with-icon">
                  <DollarSign size={18} style={{ color: '#C9A84C' }} />
                  <input type="number" name="productPrice" className="form-input" placeholder="Enter product price" value={formData.productPrice} onChange={handleChange} style={{ fontWeight: 500 }} />
                </div>
                {errors.productPrice && <span className="error-text" style={{ fontWeight: 600 }}>{errors.productPrice}</span>}
              </div>
              <div className="form-group">
                <label style={{ fontWeight: 700 }}>Invoice Price (PKR) *</label>
                <div className="input-with-icon">
                  <DollarSign size={18} style={{ color: '#C9A84C' }} />
                  <input type="number" name="invoicePrice" className="form-input" placeholder="Enter invoice price" value={formData.invoicePrice} onChange={handleChange} style={{ fontWeight: 500 }} />
                </div>
                {errors.invoicePrice && <span className="error-text" style={{ fontWeight: 600 }}>{errors.invoicePrice}</span>}
              </div>
              <div className="form-group">
                <label style={{ fontWeight: 700 }}>Advance / 1st Installment (PKR)</label>
                <div className="input-with-icon">
                  <DollarSign size={18} style={{ color: '#C9A84C' }} />
                  <input type="number" name="advanceAmount" className="form-input" placeholder="Enter advance amount" value={formData.advanceAmount} onChange={handleChange} style={{ fontWeight: 500 }} />
                </div>
              </div>
              <div className="form-group">
                <label style={{ fontWeight: 700 }}>Number of Installments *</label>
                <div className="input-with-icon">
                  <Calendar size={18} style={{ color: '#C9A84C' }} />
                  <input type="number" name="noOfInstallments" className="form-input" placeholder="e.g., 6, 12, 24" value={formData.noOfInstallments} onChange={handleChange} style={{ fontWeight: 500 }} />
                </div>
                {errors.noOfInstallments && <span className="error-text" style={{ fontWeight: 600 }}>{errors.noOfInstallments}</span>}
              </div>
              <div className="form-group">
                <label style={{ fontWeight: 700 }}>Due Date *</label>
                <input type="date" name="dueDate" className="form-input" value={formData.dueDate} onChange={handleChange} style={{ fontWeight: 500 }} />
                {errors.dueDate && <span className="error-text" style={{ fontWeight: 600 }}>{errors.dueDate}</span>}
              </div>
              <div className="form-group">
                <label style={{ fontWeight: 700 }}>Installment Amount</label>
                <div className="input-with-icon">
                  <DollarSign size={18} style={{ color: '#C9A84C' }} />
                  <input type="text" className="form-input" value={formData.installmentAmount ? `PKR ${parseFloat(formData.installmentAmount).toLocaleString()}` : 'Calculate from invoice - advance / installments'} readOnly style={{ background: '#f8f9fa', fontWeight: 600 }} />
                </div>
                <small className="field-hint" style={{ fontWeight: 500 }}>Calculation: (Invoice - Advance) / Number of Installments</small>
              </div>
            </div>

            {/* ✅ PAYMENT TYPE DROPDOWN */}
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ fontWeight: 700 }}>Payment Type *</label>
              <select
                name="paymentType"
                className="form-input"
                value={formData.paymentType}
                onChange={handleChange}
                style={{ fontWeight: 500 }}
              >
                <option value="cash">Cash</option>
                <option value="bank">Bank Transfer</option>
                <option value="cheque">Cheque</option>
                <option value="online">Online Payment</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="image-section" style={{ border: '1px solid #d1fae5', background: '#f0fdf4' }}>
              <div className="section-header">
                <Upload size={18} style={{ color: '#065f46' }} />
                <h4 style={{ fontWeight: 700 }}>Chalan Images</h4>
                <span className="required-badge" style={{ fontWeight: 600, color: '#065f46', background: '#d1fae5', padding: '2px 10px', borderRadius: '12px', fontSize: '12px' }}>Front Required</span>
              </div>
              <p className="voice-hint" style={{ fontWeight: 500, color: '#6b7280' }}>Chalan Front is required. Chalan Back is optional.</p>
              <div className="image-grid">
                <div className="image-upload-box">
                  <label style={{ fontWeight: 600 }}>Chalan Front *</label>
                  <div className="upload-area" onClick={() => chalanFrontRef.current?.click()} style={{ borderColor: errors.chalanFront ? '#ef4444' : '#d1fae5' }}>
                    {formData.chalanFrontPreview ? (
                      <div className="preview-container">
                        <img src={formData.chalanFrontPreview} alt="Chalan Front" />
                        <button className="remove-btn" onClick={(e) => { e.stopPropagation(); removeFile('chalanFront'); }}><X size={16} /></button>
                      </div>
                    ) : ( <><Upload size={32} style={{ color: '#065f46' }} /><span style={{ fontWeight: 500 }}>Click to upload</span></> )}
                  </div>
                  <input type="file" ref={chalanFrontRef} accept="image/*" onChange={(e) => handleFileUpload(e, 'chalanFront')} style={{ display: 'none' }} />
                  {errors.chalanFront && <span className="error-text" style={{ fontWeight: 600 }}>{errors.chalanFront}</span>}
                </div>
                <div className="image-upload-box">
                  <label style={{ fontWeight: 600 }}>Chalan Back (Optional)</label>
                  <div className="upload-area" onClick={() => chalanBackRef.current?.click()} style={{ borderColor: '#d1fae5' }}>
                    {formData.chalanBackPreview ? (
                      <div className="preview-container">
                        <img src={formData.chalanBackPreview} alt="Chalan Back" />
                        <button className="remove-btn" onClick={(e) => { e.stopPropagation(); removeFile('chalanBack'); }}><X size={16} /></button>
                      </div>
                    ) : ( <><Upload size={32} style={{ color: '#065f46' }} /><span style={{ fontWeight: 500 }}>Click to upload</span></> )}
                  </div>
                  <input type="file" ref={chalanBackRef} accept="image/*" onChange={(e) => handleFileUpload(e, 'chalanBack')} style={{ display: 'none' }} />
                  {errors.chalanBack && <span className="error-text" style={{ fontWeight: 600 }}>{errors.chalanBack}</span>}
                </div>
              </div>
            </div>

            {/* ✅ NEW: BILL IMAGES SECTION (Optional) */}
            <div className="image-section" style={{ border: '1px solid #d1d5db', background: '#fafafa', marginTop: '16px' }}>
              <div className="section-header">
                <FileImage size={18} style={{ color: '#6b7280' }} />
                <h4 style={{ fontWeight: 700 }}>Bill Images</h4>
                <span className="optional-badge" style={{ fontWeight: 600, color: '#6b7280', background: '#f3f4f6', padding: '2px 10px', borderRadius: '12px', fontSize: '12px' }}>
                  Optional
                </span>
              </div>
              <p className="voice-hint" style={{ fontWeight: 500, color: '#6b7280' }}>Upload bill images (Optional)</p>
              
              <div className="image-grid">
                <div className="image-upload-box">
                  <label style={{ fontWeight: 600 }}>Bill Image 1</label>
                  <div className="upload-area" onClick={() => billImage1Ref.current?.click()} style={{ borderColor: '#d1d5db' }}>
                    {formData.billImage1Preview ? (
                      <div className="preview-container">
                        <img src={formData.billImage1Preview} alt="Bill Image 1" />
                        <button className="remove-btn" onClick={(e) => { e.stopPropagation(); removeBillImage('bill1'); }}><X size={16} /></button>
                      </div>
                    ) : ( <><Upload size={32} style={{ color: '#6b7280' }} /><span style={{ fontWeight: 500 }}>Click to upload</span></> )}
                  </div>
                  <input type="file" ref={billImage1Ref} accept="image/*" onChange={(e) => handleBillImageUpload(e, 'bill1')} style={{ display: 'none' }} />
                </div>
                <div className="image-upload-box">
                  <label style={{ fontWeight: 600 }}>Bill Image 2</label>
                  <div className="upload-area" onClick={() => billImage2Ref.current?.click()} style={{ borderColor: '#d1d5db' }}>
                    {formData.billImage2Preview ? (
                      <div className="preview-container">
                        <img src={formData.billImage2Preview} alt="Bill Image 2" />
                        <button className="remove-btn" onClick={(e) => { e.stopPropagation(); removeBillImage('bill2'); }}><X size={16} /></button>
                      </div>
                    ) : ( <><Upload size={32} style={{ color: '#6b7280' }} /><span style={{ fontWeight: 500 }}>Click to upload</span></> )}
                  </div>
                  <input type="file" ref={billImage2Ref} accept="image/*" onChange={(e) => handleBillImageUpload(e, 'bill2')} style={{ display: 'none' }} />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="form-actions">
          {step === 2 && <button type="button" className="btn-prev" onClick={handlePrev} style={{ fontWeight: 700 }}>Previous</button>}
          {step === 1 ? (
            <button type="button" className="btn-next" onClick={handleNext} style={{ fontWeight: 700 }}>Next →</button>
          ) : (
            <button type="submit" className="btn-submit" style={{ fontWeight: 700 }} disabled={loading}>
              <CheckCircle size={18} />
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          )}
        </div>

        <div className="step-indicator" style={{ fontWeight: 600 }}>
          <span className={step === 1 ? 'active' : 'done'}>1. Personal Info</span>
          <span className="step-line"></span>
          <span className={step === 2 ? 'active' : ''}>2. Product & Installments</span>
        </div>
      </form>
    </div>
  );
};

export default AddAccount;