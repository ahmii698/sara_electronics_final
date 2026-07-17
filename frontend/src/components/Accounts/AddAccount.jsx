import React, { useState, useRef, useEffect } from 'react';
import { Search, User, Phone, CreditCard, MapPin, Briefcase, Users, Package, DollarSign, Calendar, Upload, X, UserPlus, Mic, Play, Trash2, FileAudio, Building, CheckCircle, AlertCircle, Clock, Bell, Shield, PauseCircle, PlayCircle } from 'lucide-react';
import './AddAccount.css';
import { API_URL } from '../../../config';

const AddAccount = () => {
  const [step, setStep] = useState(1);
  const [searchCNIC, setSearchCNIC] = useState('');
  const [showExisting, setShowExisting] = useState(false);
  const [existingAccounts, setExistingAccounts] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [userBranch, setUserBranch] = useState(null);
  const [toast, setToast] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('active');
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);

  const [voiceFiles, setVoiceFiles] = useState([]);
  const [playingIndex, setPlayingIndex] = useState(null);

  // ===== COMPLETE SYSTEM DATA =====
  const systemData = {
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

  const getAllCNICs = () => {
    return systemData.customers.map(c => c.cnic);
  };

  const getCustomerByCNIC = (cnic) => {
    return systemData.customers.find(c => c.cnic === cnic);
  };

  const getGuarantorRecordsByCNIC = (cnic) => {
    return systemData.guarantorRecords.filter(g => g.guarantorCNIC === cnic);
  };

  const getGuarantorRecordsForCustomer = (customerCNIC) => {
    return systemData.guarantorRecords.filter(g => g.customerCNIC === customerCNIC);
  };

  const checkCustomerExists = (cnic) => {
    if (!cnic || cnic.length < 5) return null;
    return getCustomerByCNIC(cnic);
  };

  const checkIfGuarantor = (cnic) => {
    if (!cnic || cnic.length < 5) return null;
    const records = getGuarantorRecordsByCNIC(cnic);
    if (records.length > 0) {
      return records;
    }
    return null;
  };

  const checkCustomerGuarantors = (cnic) => {
    if (!cnic || cnic.length < 5) return null;
    const records = getGuarantorRecordsForCustomer(cnic);
    if (records.length > 0) {
      return records;
    }
    return null;
  };

  const showToast = (message, type = 'warning', details = null) => {
    setToast({ message, type, details });
  };

  const handleCnicBlur = () => {
    if (!formData.cnic || formData.cnic.length < 5) return;
    
    const customer = checkCustomerExists(formData.cnic);
    if (customer) {
      showToast(
        `⚠️ This CNIC (${formData.cnic}) already exists! Customer: ${customer.name}`,
        'warning'
      );
      return;
    }

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

  const handleGuarantorCnicBlur = (index) => {
    const cnic = formData.guarantors[index].cnic;
    if (!cnic || cnic.length < 5) return;

    const customer = checkCustomerExists(cnic);
    if (customer) {
      showToast(
        `ℹ️ Guarantor CNIC (${cnic}) belongs to existing customer: ${customer.name}`,
        'info'
      );
      return;
    }

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

    const existingCustomer = getCustomerByCNIC(cnic);
    if (existingCustomer) {
      showToast(
        `ℹ️ ${existingCustomer.name} (${cnic}) already has an account in the system!`,
        'info'
      );
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
    status: 'active',
  });

  const [errors, setErrors] = useState({});

  const cnicFrontRef = useRef(null);
  const cnicBackRef = useRef(null);
  const chalanFrontRef = useRef(null);
  const chalanBackRef = useRef(null);
  const voiceFileRef = useRef(null);
  const guarantorRefs = useRef([]);

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
    
    if (!formData.chalanFront) {
      newErrors.chalanFront = 'Chalan Front image is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => { if (validateStep1()) setStep(2); };
  const handlePrev = () => setStep(1);

  const handleFinalSubmit = (e) => {
    e.preventDefault();
    if (validateStep2()) {
      setShowStatusModal(true);
    }
  };

  // ============================================
  // ✅ CONFIRM ACCOUNT CREATION - FIXED
  // ============================================
  const confirmAccountCreation = async () => {
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      
      // 1. CREATE CUSTOMER
      const customerFormData = new FormData();
      customerFormData.append('name', formData.name);
      customerFormData.append('cnic', formData.cnic);
      customerFormData.append('phone', formData.phone);
      customerFormData.append('address', formData.address);
      customerFormData.append('work', formData.work);
      customerFormData.append('branch_id', formData.branch);
      customerFormData.append('status', selectedStatus);
      customerFormData.append('created_by', formData.employeeId);
      customerFormData.append('product_name', formData.productName);
      
      if (formData.cnicFront) {
        customerFormData.append('cnic_front', formData.cnicFront);
      }
      if (formData.cnicBack) {
        customerFormData.append('cnic_back', formData.cnicBack);
      }
      
      if (voiceFiles.length > 0) {
        customerFormData.append('voice_consent', voiceFiles[0].file);
      }

      // ✅ 2. GUARANTORS - KEEP ORIGINAL OBJECTS WITH FILE REFS
      const validGuarantors = formData.guarantors
        .filter(g => g.name.trim() && g.cnic.trim() && g.phone.trim());

      console.log('Guarantors Data being sent:', validGuarantors.map(g => ({
        name: g.name.trim(),
        cnic: g.cnic.trim(),
        phone: g.phone.trim(),
        address: g.address?.trim() || '',
        hasFront: !!g.cnicFront,
        hasBack: !!g.cnicBack
      })));

      customerFormData.append('guarantors', JSON.stringify(
        validGuarantors.map(g => ({
          name: g.name.trim(),
          cnic: g.cnic.trim(),
          phone: g.phone.trim(),
          address: g.address?.trim() || ''
        }))
      ));

      // 3. INSTALLMENT CALCULATION
      const remainingAmount = (parseFloat(formData.invoicePrice) || 0) - (parseFloat(formData.advanceAmount) || 0);
      const totalInstallments = parseInt(formData.noOfInstallments) || 0;
      const monthlyInstallment = totalInstallments > 0 && remainingAmount > 0 
        ? remainingAmount / totalInstallments 
        : 0;

      // SEND CUSTOMER TO API
      const response = await fetch(`${API_URL}/customers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
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
          alert('Validation Errors:\n' + JSON.stringify(data.errors, null, 2));
        } else {
          setErrors({ form: data.message || 'Failed to create customer' });
          alert('Error: ' + (data.message || 'Failed to create customer'));
        }
        setLoading(false);
        setShowStatusModal(false);
        return;
      }

      if (data.success) {
        const customerId = data.data.id;
        console.log('Customer created with ID:', customerId);

        // ============================================
        // ✅ CREATE GUARANTORS - WITH IMAGES (FIXED)
        // ============================================
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
              
              // ✅ FIX: Images direct guarantor object se le rahe hain
              if (guarantor.cnicFront) {
                guarantorFormData.append('cnic_front', guarantor.cnicFront);
                console.log('✅ Adding guarantor CNIC Front:', guarantor.cnicFront.name);
              }
              if (guarantor.cnicBack) {
                guarantorFormData.append('cnic_back', guarantor.cnicBack);
                console.log('✅ Adding guarantor CNIC Back:', guarantor.cnicBack.name);
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
                const reason = guarantorResult.message || guarantorResult.errors?.cnic?.[0] || 'Unknown error';
                console.warn(`⚠️ Guarantor "${guarantor.name}" (${cleanCnic}) not created: ${reason}`);
                continue;
              }
              
              console.log('✅ Guarantor created:', guarantorResult);
              
            } catch (gError) {
              console.warn('⚠️ Error creating guarantor (continuing):', gError.message);
            }
          }
        }

        // ✅ CREATE ACCOUNT - WITH FILE UPLOADS
        const accountFormData = new FormData();
        accountFormData.append('customer_id', customerId);
        accountFormData.append('product_name', formData.productName);
        accountFormData.append('case_no', `SR-${String(Date.now()).slice(-6)}`);
        accountFormData.append('total_amount', parseFloat(formData.invoicePrice) || 0);
        accountFormData.append('paid_amount', parseFloat(formData.advanceAmount) || 0);
        accountFormData.append('balance', remainingAmount);
        accountFormData.append('monthly_installment', Math.round(monthlyInstallment * 100) / 100);
        accountFormData.append('invoice_price', parseFloat(formData.invoicePrice) || 0);
        accountFormData.append('advance_amount', parseFloat(formData.advanceAmount) || 0);
        accountFormData.append('total_installments', totalInstallments);
        accountFormData.append('installments_paid', 0);
        accountFormData.append('due_date', formData.dueDate);
        accountFormData.append('next_due_date', formData.dueDate);
        accountFormData.append('payment_type', formData.productType === 'cash' ? 'cash' : 'installment');
        accountFormData.append('status', selectedStatus === 'active' ? 'active' : 'hold');
        accountFormData.append('branch_id', formData.branch);
        accountFormData.append('created_by', parseInt(formData.employeeId));
        
        if (formData.chalanFront) {
          accountFormData.append('chalan_front', formData.chalanFront);
        }
        if (formData.chalanBack) {
          accountFormData.append('chalan_back', formData.chalanBack);
        }

        const accountResponse = await fetch(`${API_URL}/accounts`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: accountFormData,
        });

        const accountData = await accountResponse.json();

        if (accountData.success) {
          setShowStatusModal(false);
          alert(`✅ Account created successfully!\n\nCustomer: ${formData.name}\nProduct: ${formData.productName}\nCase: ${accountData.data.case_no}\nStatus: ${selectedStatus.toUpperCase()}\nGuarantors: ${validGuarantors.length} added\nMonthly Installment: PKR ${Math.round(monthlyInstallment * 100) / 100}`);
          
          setFormData({
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
            branch: userBranch || 1,
            status: 'active',
          });
          setVoiceFiles([]);
          setStep(1);
        } else {
          setErrors({ form: accountData.message || 'Failed to create account' });
          alert('Failed to create account: ' + (accountData.message || 'Unknown error'));
        }
      } else {
        setErrors({ form: data.message || 'Failed to create customer' });
        alert('Failed to create customer: ' + (data.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error:', err);
      setErrors({ form: 'Network error. Please try again.' });
      alert('Network error. Please check your connection.');
    }
    
    setLoading(false);
    setShowStatusModal(false);
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

      {showStatusModal && (
        <div className="status-modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div className="status-modal" onClick={(e) => e.stopPropagation()}>
            <div className="status-modal-header">
              <Shield size={24} className="status-modal-icon" />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Account Status</h3>
              <button className="status-modal-close" onClick={() => setShowStatusModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="status-modal-body">
              <p className="status-modal-text" style={{ fontSize: '1rem', fontWeight: 600 }}>
                Select the status for this account:
              </p>
              <div className="status-options">
                <label className={`status-option ${selectedStatus === 'active' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="accountStatus"
                    value="active"
                    checked={selectedStatus === 'active'}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  />
                  <div className="status-option-content">
                    <PlayCircle size={24} className="status-option-icon active-icon" />
                    <div>
                      <span className="status-option-label" style={{ fontWeight: 700 }}>Active</span>
                      <span className="status-option-desc" style={{ fontWeight: 500 }}>Account will be active immediately</span>
                    </div>
                  </div>
                </label>
                <label className={`status-option ${selectedStatus === 'hold' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="accountStatus"
                    value="hold"
                    checked={selectedStatus === 'hold'}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  />
                  <div className="status-option-content">
                    <PauseCircle size={24} className="status-option-icon hold-icon" />
                    <div>
                      <span className="status-option-label" style={{ fontWeight: 700 }}>Hold</span>
                      <span className="status-option-desc" style={{ fontWeight: 500 }}>Account will be placed on hold</span>
                    </div>
                  </div>
                </label>
              </div>
            </div>
            <div className="status-modal-footer">
              <button className="status-btn-cancel" onClick={() => setShowStatusModal(false)} style={{ fontWeight: 700 }}>
                Cancel
              </button>
              <button 
                className="status-btn-confirm" 
                onClick={confirmAccountCreation} 
                style={{ fontWeight: 700 }}
                disabled={loading}
              >
                <CheckCircle size={18} />
                {loading ? 'Creating...' : 'Create Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="page-header">
        <div className="header-title-group">
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Create New Account</h3>
          <span className="live-badge" style={{ fontWeight: 700 }}>
            <Clock size={12} /> New
          </span>
        </div>
        {userBranch && (
          <div className="branch-badge-header" style={{ fontWeight: 700 }}>
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
              style={{ fontWeight: 500 }}
            />
          </div>
          <button className="btn-search" onClick={handleCNICSearch} style={{ fontWeight: 700 }}>
            <Search size={16} />
            Search
          </button>
        </div>
        {showExisting && existingAccounts.length > 0 && (
          <div className="existing-accounts">
            <p className="existing-title" style={{ fontWeight: 700 }}>
              <AlertCircle size={14} />
              Existing Accounts Found:
            </p>
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
                  <input 
                    type="text" 
                    name="name" 
                    className="form-input" 
                    placeholder="Enter customer full name" 
                    value={formData.name} 
                    onChange={handleChange} 
                    style={{ fontWeight: 500 }}
                  />
                </div>
                {errors.name && <span className="error-text" style={{ fontWeight: 600 }}>{errors.name}</span>}
              </div>
              <div className="form-group">
                <label style={{ fontWeight: 700 }}>CNIC *</label>
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
                    style={{ fontWeight: 500 }}
                  />
                </div>
                {errors.cnic && <span className="error-text" style={{ fontWeight: 600 }}>{errors.cnic}</span>}
                <small className="field-hint" style={{ fontWeight: 500 }}>System will check if this CNIC already exists or is a guarantor</small>
              </div>
              <div className="form-group">
                <label style={{ fontWeight: 700 }}>Phone Number *</label>
                <div className="input-with-icon">
                  <Phone size={18} />
                  <input 
                    type="tel" 
                    name="phone" 
                    className="form-input" 
                    placeholder="03XX-XXXXXXX" 
                    value={formData.phone} 
                    onChange={handleChange} 
                    style={{ fontWeight: 500 }}
                  />
                </div>
                {errors.phone && <span className="error-text" style={{ fontWeight: 600 }}>{errors.phone}</span>}
              </div>
              <div className="form-group">
                <label style={{ fontWeight: 700 }}>Branch *</label>
                <select 
                  name="branch" 
                  className="form-input" 
                  value={formData.branch} 
                  onChange={handleChange}
                  disabled={!!userBranch}
                  style={userBranch ? { opacity: 0.7, cursor: 'not-allowed', fontWeight: 500 } : { fontWeight: 500 }}
                >
                  <option value={1}>Branch 1</option>
                  <option value={2}>Branch 2</option>
                </select>
                {userBranch && (
                  <small className="field-hint" style={{ fontWeight: 500 }}>Branch locked to {branchLabel}</small>
                )}
              </div>
              <div className="form-group">
                <label style={{ fontWeight: 700 }}>Address *</label>
                <div className="input-with-icon">
                  <MapPin size={18} />
                  <input 
                    type="text" 
                    name="address" 
                    className="form-input" 
                    placeholder="Enter complete address" 
                    value={formData.address} 
                    onChange={handleChange} 
                    style={{ fontWeight: 500 }}
                  />
                </div>
                {errors.address && <span className="error-text" style={{ fontWeight: 600 }}>{errors.address}</span>}
              </div>
              <div className="form-group">
                <label style={{ fontWeight: 700 }}>Work / Occupation *</label>
                <div className="input-with-icon">
                  <Briefcase size={18} />
                  <input 
                    type="text" 
                    name="work" 
                    className="form-input" 
                    placeholder="Enter work/occupation" 
                    value={formData.work} 
                    onChange={handleChange} 
                    style={{ fontWeight: 500 }}
                  />
                </div>
                {errors.work && <span className="error-text" style={{ fontWeight: 600 }}>{errors.work}</span>}
              </div>
            </div>

            <div className="employee-section" style={{ border: '1px solid #c4b5fd', background: '#faf8ff' }}>
              <div className="section-header">
                <UserPlus size={18} style={{ color: '#1E1B4B' }} />
                <h4 style={{ fontWeight: 700 }}>Account Opened By *</h4>
              </div>
              <div className="employee-dropdown-wrapper">
                <select
                  name="employeeId"
                  className="form-input employee-select"
                  value={formData.employeeId}
                  onChange={handleChange}
                  style={{ fontWeight: 500 }}
                >
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
              {userBranch && (
                <p className="employee-hint" style={{ fontWeight: 500 }}>Only employees from {branchLabel} are available</p>
              )}
            </div>

            <div className="voice-section" style={{ border: '1px solid #86efac', background: '#f0fdf4' }}>
              <div className="section-header">
                <Mic size={18} style={{ color: '#065f46' }} />
                <h4 style={{ fontWeight: 700 }}>Voice Consent / Raza Mandi</h4>
              </div>
              <p className="voice-hint" style={{ fontWeight: 500 }}>Customer ki raza mandi ki voice file upload karein</p>
              
              <div className="voice-upload">
                <div className="upload-area voice-upload-area" onClick={() => voiceFileRef.current?.click()} style={{ borderColor: '#86efac' }}>
                  <FileAudio size={32} style={{ color: '#065f46' }} />
                  <span style={{ fontWeight: 600 }}>Click to upload voice file</span>
                  <span className="file-hint" style={{ fontWeight: 500 }}>MP3, WAV, M4A (Max 10MB)</span>
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
                        <button 
                          className={`btn-play ${playingIndex === index ? 'playing' : ''}`} 
                          onClick={() => playVoice(index)}
                          style={{ fontWeight: 600 }}
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
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Full Name" 
                      value={g.name} 
                      onChange={(e) => handleGuarantorChange(index, 'name', e.target.value)} 
                      style={{ fontWeight: 500 }}
                    />
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="CNIC" 
                      value={g.cnic} 
                      onChange={(e) => handleGuarantorChange(index, 'cnic', e.target.value)} 
                      onBlur={() => handleGuarantorCnicBlur(index)}
                      style={{ fontWeight: 500 }}
                    />
                    <input 
                      type="tel" 
                      className="form-input" 
                      placeholder="Phone" 
                      value={g.phone} 
                      onChange={(e) => handleGuarantorChange(index, 'phone', e.target.value)} 
                      style={{ fontWeight: 500 }}
                    />
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Address" 
                      value={g.address} 
                      onChange={(e) => handleGuarantorChange(index, 'address', e.target.value)} 
                      style={{ fontWeight: 500 }}
                    />
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
              {errors.guarantors && <span className="error-text" style={{ fontWeight: 600 }}>{errors.guarantors}</span>}
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
                  <input 
                    type="text" 
                    name="productName" 
                    className="form-input" 
                    placeholder="e.g., Mobile, Delivery, Parhayi ki fees, etc." 
                    value={formData.productName} 
                    onChange={handleChange} 
                    style={{ fontWeight: 500 }}
                  />
                </div>
                <small className="field-hint" style={{ fontWeight: 500 }}>
                  What is this account for? (Product name, purpose, description)
                </small>
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
                  <input 
                    type="text" 
                    className="form-input" 
                    value={formData.installmentAmount ? `PKR ${parseFloat(formData.installmentAmount).toLocaleString()}` : 'Calculate from invoice - advance / installments'} 
                    readOnly 
                    style={{ background: '#f8f9fa', fontWeight: 600 }} 
                  />
                </div>
                <small className="field-hint" style={{ fontWeight: 500 }}>
                  Calculation: (Invoice - Advance) / Number of Installments
                </small>
              </div>
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
              {errors.chalan && <span className="error-text" style={{ fontWeight: 600 }}>{errors.chalan}</span>}
            </div>
          </div>
        )}

        <div className="form-actions">
          {step === 2 && <button type="button" className="btn-prev" onClick={handlePrev} style={{ fontWeight: 700 }}>Previous</button>}
          {step === 1 ? (
            <button type="button" className="btn-next" onClick={handleNext} style={{ fontWeight: 700 }}>Next →</button>
          ) : (
            <button type="submit" className="btn-submit" style={{ fontWeight: 700 }}>
              <CheckCircle size={18} />
              Create Account
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