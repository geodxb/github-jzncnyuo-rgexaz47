import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { FirestoreService } from '../../services/firestoreService';
import { useAuth } from '../../contexts/AuthContext';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Shield, 
  Upload, 
  DollarSign, 
  CreditCard,
  Building,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertCircle,
  Bitcoin,
  Banknote,
  QrCode,
  Copy
} from 'lucide-react';

interface AddInvestorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormData {
  // Step 1: Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  countryCode: string;
  country: string;
  location: string;
  accountType: 'Standard' | 'Pro';
  
  // Step 2: Identity Verification
  idType: string;
  idDocument: File | null;
  
  // Step 3: Deposit Details
  depositAmount: number;
  depositMethod: 'crypto' | 'bank';
  selectedCrypto?: string;
  proofOfTransfer?: File | null;
  
  // Step 4: Withdrawal Setup
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  swiftCode: string;
  bankAddress: string;
  accountCurrency: string;
}

const countries = [
  { code: 'US', name: 'United States', flag: '🇺🇸', phone: '+1' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', phone: '+1' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', phone: '+44' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', phone: '+61' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', phone: '+49' },
  { code: 'FR', name: 'France', flag: '🇫🇷', phone: '+33' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽', phone: '+52' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', phone: '+971' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', phone: '+966' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭', phone: '+41' },
];

const locationData: Record<string, string[]> = {
  'US': ['California', 'New York', 'Texas', 'Florida', 'Illinois', 'Pennsylvania'],
  'CA': ['Ontario', 'Quebec', 'British Columbia', 'Alberta', 'Manitoba', 'Saskatchewan'],
  'AU': ['New South Wales', 'Victoria', 'Queensland', 'Western Australia', 'South Australia'],
  'GB': ['London', 'Manchester', 'Birmingham', 'Liverpool', 'Leeds', 'Sheffield'],
  'DE': ['Berlin', 'Munich', 'Hamburg', 'Cologne', 'Frankfurt', 'Stuttgart'],
  'FR': ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice', 'Nantes'],
  'MX': ['Mexico City', 'Guadalajara', 'Monterrey', 'Puebla', 'Tijuana', 'León'],
  'AE': ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah'],
  'SA': ['Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam', 'Khobar'],
  'CH': ['Zurich', 'Geneva', 'Basel', 'Bern', 'Lausanne', 'Winterthur'],
};

const cryptoWallets = [
  { 
    name: 'Bitcoin (BTC)', 
    address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
    icon: <Bitcoin size={20} className="text-orange-500" />
  },
  { 
    name: 'Ethereum (ETH)', 
    address: '0x742d35Cc6634C0532925a3b8D4C9db96590b4c5d',
    icon: <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">Ξ</div>
  },
  { 
    name: 'USDT (TRC20)', 
    address: 'TQn9Y2khEsLJW1ChVWFMSMeRDow5oREqjK',
    icon: <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">₮</div>
  },
];

const AddInvestorModal = ({ isOpen, onClose, onSuccess }: AddInvestorModalProps) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSuccess, setIsSuccess] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false);
  const [contractAccepted, setContractAccepted] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    countryCode: '+1',
    country: '',
    location: '',
    accountType: 'Standard',
    idType: '',
    idDocument: null,
    depositAmount: 100,
    depositMethod: 'crypto',
    selectedCrypto: 'Bitcoin (BTC)',
    proofOfTransfer: null,
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    swiftCode: '',
    bankAddress: '',
    accountCurrency: 'USD'
  });

  const steps = [
    { number: 1, title: 'Personal Information', icon: <User size={18} /> },
    { number: 2, title: 'Identity Verification', icon: <Shield size={18} /> },
    { number: 3, title: 'Deposit Details', icon: <DollarSign size={18} /> },
    { number: 4, title: 'Withdrawal Setup', icon: <Building size={18} /> },
    { number: 5, title: 'Agreement', icon: <CreditCard size={18} /> }
  ];

  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format';
        if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
        if (!formData.country) newErrors.country = 'Country is required';
        if (!formData.location) newErrors.location = 'Location is required';
        if (!formData.accountType) newErrors.accountType = 'Account type is required';
        break;
      case 2:
        if (!formData.idType) newErrors.idType = 'ID type is required';
        if (!formData.idDocument) newErrors.idDocument = 'ID document is required';
        break;
      case 3:
        // Enhanced validation for depositAmount
        const depositAmount = Number(formData.depositAmount);
        if (isNaN(depositAmount) || !isFinite(depositAmount)) {
          newErrors.depositAmount = 'Please enter a valid deposit amount';
        } else if (depositAmount < 100) {
          newErrors.depositAmount = 'Minimum deposit is $100';
        } else if (depositAmount > 1000000) {
          newErrors.depositAmount = 'Maximum deposit is $1,000,000';
        }
        if (formData.depositMethod === 'bank' && !formData.proofOfTransfer) {
          newErrors.proofOfTransfer = 'Proof of transfer is required for bank deposits';
        }
        break;
      case 4:
        if (!formData.accountHolderName.trim()) newErrors.accountHolderName = 'Account holder name is required';
        if (!formData.bankName.trim()) newErrors.bankName = 'Bank name is required';
        if (!formData.accountNumber.trim()) newErrors.accountNumber = 'Account number is required';
        if (!formData.swiftCode.trim()) newErrors.swiftCode = 'SWIFT/BIC code is required';
        if (!formData.bankAddress.trim()) newErrors.bankAddress = 'Bank address is required';
        break;
      case 5:
        if (!contractAccepted) newErrors.contract = 'You must accept the agreement to proceed';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleCountrySelect = (country: any) => {
    setFormData(prev => ({
      ...prev,
      country: country.name,
      countryCode: country.phone,
      location: '' // Reset location when country changes
    }));
    setCountrySearch('');
  };

  const handleFileUpload = (field: 'idDocument' | 'proofOfTransfer', file: File) => {
    // Validate file
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    
    if (file.size > maxSize) {
      setErrors(prev => ({ ...prev, [field]: 'File size must be less than 5MB' }));
      return;
    }
    
    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, [field]: 'Only JPG, PNG, and PDF files are allowed' }));
      return;
    }
    
    setFormData(prev => ({ ...prev, [field]: file }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleContractScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const isScrolledToEnd = element.scrollHeight - element.scrollTop <= element.clientHeight + 10;
    setHasScrolledToEnd(isScrolledToEnd);
  };

  const handleSubmit = async () => {
    if (!validateStep(5) || !user) return;

    // Robust validation and conversion of depositAmount
    const depositAmount = Number(formData.depositAmount);
    if (isNaN(depositAmount) || !isFinite(depositAmount) || depositAmount < 100) {
      setErrors({ submit: 'Invalid deposit amount. Please enter a valid number greater than $100.' });
      return;
    }
    setIsLoading(true);
    try {
      // Ensure depositAmount is a valid number
      const parsedDepositAmount = parseFloat(formData.depositAmount?.toString() || '0');
      const finalDepositAmount = isNaN(parsedDepositAmount) ? 0 : parsedDepositAmount;
      
      // Create investor profile
      const investorData = {
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        phone: `${formData.countryCode} ${formData.phone}`,
        country: formData.country,
        location: formData.location,
        joinDate: new Date().toISOString().split('T')[0],
        initialDeposit: depositAmount,
        currentBalance: depositAmount,
        role: 'investor',
        accountType: formData.accountType,
        isActive: true,
        accountStatus: 'Active - Pending Verification',
        tradingData: {
          positionsPerDay: 0,
          pairs: [],
          platform: 'IBKR',
          leverage: 100,
          currency: formData.accountCurrency
        },
        bankDetails: {
          accountHolderName: formData.accountHolderName,
          bankName: formData.bankName,
          accountNumber: formData.accountNumber,
          swiftCode: formData.swiftCode,
          bankAddress: formData.bankAddress,
          currency: formData.accountCurrency
        },
        verification: {
          idType: formData.idType,
          depositMethod: formData.depositMethod,
          selectedCrypto: formData.selectedCrypto
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Generate unique investor ID
      const investorId = 'investor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      
      console.log(`📊 New Investor AUM Impact: +$${depositAmount.toLocaleString()} (Total AUM increased)`);
      console.log(`📊 New Investor AUM Impact: +$${finalDepositAmount.toLocaleString()} (Total AUM increased)`);
      // Save to Firestore
      await FirestoreService.createInvestor(investorId, investorData);

      // Add initial deposit transaction
      await FirestoreService.addTransaction({
        investorId,
        type: 'Deposit',
        amount: depositAmount,
        date: new Date().toISOString().split('T')[0],
        status: 'Pending',
        description: `Initial deposit via ${formData.depositMethod === 'crypto' ? formData.selectedCrypto : 'bank transfer'}`
      });

      setIsSuccess(true);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error creating investor:', error);
      setErrors({ submit: 'Failed to create investor. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      countryCode: '+1',
      country: '',
      location: '',
      accountType: 'Standard',
      idType: '',
      idDocument: null,
      depositAmount: 100,
      depositMethod: 'crypto',
      selectedCrypto: 'Bitcoin (BTC)',
      proofOfTransfer: null,
      accountHolderName: '',
      bankName: '',
      accountNumber: '',
      swiftCode: '',
      bankAddress: '',
      accountCurrency: 'USD'
    });
    setErrors({});
    setIsSuccess(false);
    setCountrySearch('');
    setHasScrolledToEnd(false);
    setContractAccepted(false);
    onClose();
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="John"
                />
                {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Doe"
                />
                {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="john.doe@example.com"
                />
              </div>
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="flex space-x-2">
                <select
                  value={formData.countryCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, countryCode: e.target.value }))}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {countries.map(country => (
                    <option key={country.code} value={country.phone}>
                      {country.flag} {country.phone}
                    </option>
                  ))}
                </select>
                <div className="relative flex-1">
                  <Phone size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="123-456-7890"
                  />
                </div>
              </div>
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={countrySearch || formData.country}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Search countries..."
                />
                {countrySearch && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                    {filteredCountries.map(country => (
                      <button
                        key={country.code}
                        onClick={() => handleCountrySelect(country)}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center space-x-2"
                      >
                        <span>{country.flag}</span>
                        <span>{country.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {errors.country && <p className="text-red-500 text-sm mt-1">{errors.country}</p>}
            </div>

            {formData.country && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {['US', 'CA', 'AU'].includes(countries.find(c => c.name === formData.country)?.code || '') ? 'State/Province' : 'City'} <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select location...</option>
                  {locationData[countries.find(c => c.name === formData.country)?.code || '']?.map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
                {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
              </div>
            )}

            {/* Account Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  formData.accountType === 'Standard' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'
                }`}>
                  <input
                    type="radio"
                    name="accountType"
                    value="Standard"
                    checked={formData.accountType === 'Standard'}
                    onChange={(e) => setFormData(prev => ({ ...prev, accountType: e.target.value as 'Standard' | 'Pro' }))}
                    className="mr-3"
                  />
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <User size={18} className="text-gray-600" />
                      <span className="font-medium">Standard Account</span>
                    </div>
                    <p className="text-xs text-gray-600">Basic trading features and standard support</p>
                  </div>
                </label>
                <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  formData.accountType === 'Pro' ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:bg-gray-50'
                }`}>
                  <input
                    type="radio"
                    name="accountType"
                    value="Pro"
                    checked={formData.accountType === 'Pro'}
                    onChange={(e) => setFormData(prev => ({ ...prev, accountType: e.target.value as 'Standard' | 'Pro' }))}
                    className="mr-3"
                  />
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <div className="w-4 h-4 bg-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">P</span>
                      </div>
                      <span className="font-medium">Pro Account</span>
                    </div>
                    <p className="text-xs text-gray-600">Advanced features and priority support</p>
                  </div>
                </label>
              </div>
              {errors.accountType && <p className="text-red-500 text-sm mt-1">{errors.accountType}</p>}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ID Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 gap-3">
                {['National ID Card', 'Passport', 'Driver\'s License'].map(type => (
                  <label key={type} className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="idType"
                      value={type}
                      checked={formData.idType === type}
                      onChange={(e) => setFormData(prev => ({ ...prev, idType: e.target.value }))}
                      className="mr-3"
                    />
                    <Shield size={18} className="mr-2 text-gray-400" />
                    <span>{type}</span>
                  </label>
                ))}
              </div>
              {errors.idType && <p className="text-red-500 text-sm mt-1">{errors.idType}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload ID Document <span className="text-red-500">*</span>
              </label>
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
                onClick={() => document.getElementById('idDocument')?.click()}
              >
                <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                <p className="text-gray-600 mb-2">Drop your file here or click to browse</p>
                <p className="text-sm text-gray-500 mb-4">JPG, PNG, PDF (max 5MB)</p>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload('idDocument', e.target.files[0])}
                  className="sr-only"
                  id="idDocument"
                />
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={(e) => {
                    e.stopPropagation();
                    document.getElementById('idDocument')?.click();
                  }}
                >
                  Choose File
                </Button>
                {formData.idDocument && (
                  <p className="text-green-600 text-sm mt-2">
                    ✓ {formData.idDocument.name}
                  </p>
                )}
              </div>
              {errors.idDocument && <p className="text-red-500 text-sm mt-1">{errors.idDocument}</p>}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deposit Amount (USD) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <DollarSign size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  min="100"
                  max="1000000"
                  step="0.01"
                  value={formData.depositAmount}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Only update if it's a valid number or empty string
                    if (value === '' || (!isNaN(Number(value)) && isFinite(Number(value)))) {
                      setFormData(prev => ({ ...prev, depositAmount: value === '' ? 0 : Number(value) }));
                    }
                  }}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="100"
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">Minimum deposit: $100</p>
              {errors.depositAmount && <p className="text-red-500 text-sm mt-1">{errors.depositAmount}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deposit Method <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  formData.depositMethod === 'crypto' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'
                }`}>
                  <input
                    type="radio"
                    name="depositMethod"
                    value="crypto"
                    checked={formData.depositMethod === 'crypto'}
                    onChange={(e) => setFormData(prev => ({ ...prev, depositMethod: e.target.value as 'crypto' | 'bank' }))}
                    className="mr-3"
                  />
                  <Bitcoin size={20} className="mr-2 text-orange-500" />
                  <span>Cryptocurrency</span>
                </label>
                <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  formData.depositMethod === 'bank' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'
                }`}>
                  <input
                    type="radio"
                    name="depositMethod"
                    value="bank"
                    checked={formData.depositMethod === 'bank'}
                    onChange={(e) => setFormData(prev => ({ ...prev, depositMethod: e.target.value as 'crypto' | 'bank' }))}
                    className="mr-3"
                  />
                  <Banknote size={20} className="mr-2 text-green-500" />
                  <span>Bank Transfer</span>
                </label>
              </div>
            </div>

            {formData.depositMethod === 'crypto' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Cryptocurrency
                  </label>
                  <div className="space-y-2">
                    {cryptoWallets.map(crypto => (
                      <label key={crypto.name} className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                        formData.selectedCrypto === crypto.name ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'
                      }`}>
                        <input
                          type="radio"
                          name="selectedCrypto"
                          value={crypto.name}
                          checked={formData.selectedCrypto === crypto.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, selectedCrypto: e.target.value }))}
                          className="mr-3"
                        />
                        {crypto.icon}
                        <span className="ml-2">{crypto.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {formData.selectedCrypto && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                      <QrCode size={18} className="mr-2" />
                      Wallet Address for {formData.selectedCrypto}
                    </h4>
                    <div className="bg-white p-3 rounded border flex items-center justify-between">
                      <code className="text-sm text-gray-800 break-all">
                        {cryptoWallets.find(c => c.name === formData.selectedCrypto)?.address}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(cryptoWallets.find(c => c.name === formData.selectedCrypto)?.address || '')}
                      >
                        <Copy size={14} className="mr-1" />
                        Copy
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      Send exactly ${formData.depositAmount} worth of {formData.selectedCrypto} to this address
                    </p>
                  </div>
                )}
              </div>
            )}

            {formData.depositMethod === 'bank' && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-3">Bank Transfer Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bank Name:</span>
                      <span className="font-medium">ADCB (Abu Dhabi Commercial Bank)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Account Number:</span>
                      <span className="font-medium">13*********0001</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">IBAN:</span>
                      <span className="font-medium">AE68003001*********0001</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Account Holder:</span>
                      <span className="font-medium">Cristian Rolando Dorao</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Reference:</span>
                      <span className="font-medium">{formData.firstName} {formData.lastName}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Proof of Transfer <span className="text-red-500">*</span>
                  </label>
                  <div 
                    className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-gray-400 transition-colors"
                    onClick={() => document.getElementById('proofOfTransfer')?.click()}
                  >
                    <Upload size={24} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-600 mb-2">Upload bank transfer receipt</p>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload('proofOfTransfer', e.target.files[0])}
                      className="sr-only"
                      id="proofOfTransfer"
                    />
                    <Button 
                      type="button"
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        document.getElementById('proofOfTransfer')?.click();
                      }}
                    >
                      Choose File
                    </Button>
                    {formData.proofOfTransfer && (
                      <p className="text-green-600 text-sm mt-2">
                        ✓ {formData.proofOfTransfer.name}
                      </p>
                    )}
                  </div>
                  {errors.proofOfTransfer && <p className="text-red-500 text-sm mt-1">{errors.proofOfTransfer}</p>}
                </div>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Holder Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.accountHolderName}
                onChange={(e) => setFormData(prev => ({ ...prev, accountHolderName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Full name as on bank account"
              />
              {errors.accountHolderName && <p className="text-red-500 text-sm mt-1">{errors.accountHolderName}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.bankName}
                  onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Bank of America"
                />
                {errors.bankName && <p className="text-red-500 text-sm mt-1">{errors.bankName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Currency <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.accountCurrency}
                  onChange={(e) => setFormData(prev => ({ ...prev, accountCurrency: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="CAD">CAD</option>
                  <option value="AUD">AUD</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Number/IBAN <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="1234567890 or IBAN"
                />
                {errors.accountNumber && <p className="text-red-500 text-sm mt-1">{errors.accountNumber}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SWIFT/BIC Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.swiftCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, swiftCode: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="BOFAUS3N"
                />
                {errors.swiftCode && <p className="text-red-500 text-sm mt-1">{errors.swiftCode}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bank Address <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.bankAddress}
                onChange={(e) => setFormData(prev => ({ ...prev, bankAddress: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Full bank address including city, state, and country"
              />
              {errors.bankAddress && <p className="text-red-500 text-sm mt-1">{errors.bankAddress}</p>}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <CreditCard size={20} className="text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-800">Investment and Operation Agreement</h4>
                  <p className="text-blue-700 text-sm mt-1">
                    Please review the complete agreement below. You must scroll to the end and accept the terms to proceed.
                  </p>
                </div>
              </div>
            </div>

            {/* Contract Display */}
            <div 
              className="border border-gray-300 rounded-lg p-6 h-96 overflow-y-auto bg-white"
              onScroll={handleContractScroll}
            >
              <div className="space-y-6 text-sm leading-relaxed">
                <div className="text-center">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Investment and Operation Agreement</h2>
                </div>

                <div>
                  <p className="mb-4">
                    This Investment and Operation Agreement ("Agreement") is entered into on the date of signature by and between:
                  </p>
                  <p className="mb-2">
                    <strong>Trader:</strong> Cristian Rolando Dorao, residing at Le Park II, Villa No. 9, Jumeirah Village Circle, Dubai, hereinafter referred to as the "Trader".
                  </p>
                  <div className="bg-gray-50 p-4 rounded border border-gray-200 mb-4">
                    <p className="font-semibold mb-2">Investor data:</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><strong>Name:</strong> {formData.firstName} {formData.lastName}</div>
                      <div><strong>Email:</strong> {formData.email}</div>
                      <div><strong>Phone:</strong> {formData.countryCode} {formData.phone}</div>
                      <div><strong>Country:</strong> {formData.country}</div>
                      <div><strong>Location:</strong> {formData.location}</div>
                      <div><strong>Account Type:</strong> {formData.accountType}</div>
                      <div><strong>Initial Deposit:</strong> ${formData.depositAmount.toLocaleString()}</div>
                      <div><strong>Initial Deposit:</strong> ${(formData.depositAmount || 0).toLocaleString()}</div>
                      <div><strong>Deposit Method:</strong> {formData.depositMethod === 'crypto' ? formData.selectedCrypto : 'Bank Transfer'}</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Considerations</h3>
                  <ul className="space-y-1 ml-4">
                    <li>• The Trader operates a portfolio using the capital provided by the Investor to trade in the Forex and cryptocurrency markets.</li>
                    <li>• The Trader uses Pepperstone, a highly regulated trading platform, to execute trades.</li>
                    <li>• The Investor agrees to provide the funds and comply with the terms and conditions set forth in this document.</li>
                  </ul>
                  <p className="mt-4">
                    By virtue of the following clauses and mutual agreements, the parties agree as follows:
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">1. Definitions</h3>
                  <p><strong>1.1 Minimum Investment:</strong> USD 1,000 or its equivalent in Mexican Pesos.</p>
                  <p><strong>1.2 Trading Instruments:</strong></p>
                  <ul className="ml-4 space-y-1">
                    <li>• <strong>Forex:</strong> Gold/USD (XAUUSD) and major currency pairs.</li>
                    <li>• <strong>Cryptocurrencies:</strong> Bitcoin (BTC), Ethereum (ETH), and other major cryptocurrencies.</li>
                  </ul>
                  <p><strong>1.3 Trading Strategy:</strong> The Trader employs fundamental analysis, trend analysis, and liquidity swaps to identify trading opportunities.</p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">2. Investment Period</h3>
                  <p><strong>2.1 Cryptocurrency Trading:</strong> Operated for 30 calendar days.</p>
                  <p><strong>2.2 Forex Trading:</strong> Operated for 20 business days.</p>
                  <p><strong>2.3</strong> The Investor may request withdrawals in accordance with Section 5.</p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">3. Obligations of the Investor</h3>
                  <p><strong>3.1</strong> The Investor must provide valid documentation and undergo thorough verification to comply with anti-fraud and anti-money laundering regulations.</p>
                  <p><strong>3.2</strong> The Investor agrees to transfer a minimum of USD 1,000 or its equivalent in Mexican Pesos to the Trader's account for trading purposes.</p>
                  <p><strong>3.3</strong> The Trader guarantees that the initial investment amount will remain safe during the term of the contract. If the Trader, by error or misconduct, executes orders without due caution or proper analysis resulting in losses, the Investor shall have the right to revoke the contract. In the event of revocation, the Trader must return the full initial investment amount to the Investor without deduction of losses.</p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">4. Trader's Compensation</h3>
                  <p><strong>4.1</strong> The Trader is entitled to 15% of the net profits generated through trading, as regulated by Pepperstone.</p>
                  <p><strong>4.2</strong> No additional fees or charges shall be applied to the Investor by the Trader.</p>
                  <p><strong>4.3</strong> Any request by the Trader for an additional percentage must be documented and immediately reported to Pepperstone support.</p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">5. Withdrawals</h3>
                  <p><strong>5.1 Monthly Withdrawals:</strong> The Investor may withdraw profits monthly while maintaining the minimum deposit of USD 1,000.</p>
                  <p><strong>5.2 Full Balance Withdrawal:</strong></p>
                  <ul className="ml-4 space-y-1">
                    <li>• The Investor must follow the account closure process, which may take up to 60 calendar days.</li>
                    <li>• After account closure, the Investor may not open a new account for 90 days.</li>
                  </ul>
                  <p><strong>5.3</strong> Withdrawals must be made to a bank account matching the name and address provided at registration.</p>
                  <p><strong>5.4</strong> Any change in citizenship or address of the Investor must be immediately reported to the Trader and to Pepperstone.</p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">6. Term and Termination</h3>
                  <p><strong>6.1</strong> This Agreement has no fixed term and shall remain in effect until terminated by mutual agreement or as follows:</p>
                  <ul className="ml-4 space-y-1">
                    <li>• <strong>By the Investor:</strong> Through written notice and completion of the withdrawal process.</li>
                    <li>• <strong>By the Trader:</strong> Through written notice, subject to fulfilling his obligations under this Agreement.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">7. Regulatory Compliance</h3>
                  <p><strong>7.1</strong> This Agreement is governed by the laws of the UAE.</p>
                  <p><strong>7.2</strong> Both parties agree to comply with applicable laws, including anti-money laundering and fraud regulations.</p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">8. Representations and Warranties</h3>
                  <p><strong>8.1 Investor's Representations:</strong></p>
                  <ul className="ml-4 space-y-1">
                    <li>• The Investor possesses the necessary funds and understands the risks associated with Forex and cryptocurrency trading.</li>
                    <li>• The Investor acknowledges that profits are not guaranteed.</li>
                  </ul>
                  <p><strong>8.2 Trader's Representations:</strong></p>
                  <ul className="ml-4 space-y-1">
                    <li>• The Trader will execute trades professionally and diligently.</li>
                    <li>• The Trader will not request compensation beyond the agreed profit percentage.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">9. Indemnification and Liability</h3>
                  <p><strong>9.1</strong> The Trader shall not be liable for losses arising from market fluctuations or unforeseen economic events.</p>
                  <p><strong>9.2</strong> The Investor agrees to indemnify the Trader against any claim, liability, or damage arising from the Investor's breach of this Agreement.</p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">10. Dispute Resolution</h3>
                  <p><strong>10.1</strong> Any dispute arising from this Agreement shall be resolved amicably.</p>
                  <p><strong>10.2</strong> If unresolved, the dispute shall be submitted to arbitration under UAE law.</p>
                  <p><strong>10.3</strong> The parties expressly and irrevocably agree to submit to the jurisdiction of the competent courts of the United Arab Emirates, city of Dubai, UAE, expressly waiving any other jurisdiction that may correspond to them due to their present or future domicile or the location of their assets.</p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">11. Execution and Validation</h3>
                  <p><strong>11.1</strong> This Agreement enters into force once signed by both parties and validated by InteractiveBrokers.</p>
                  <p className="mt-4">
                    <strong>Notice:</strong> Withdrawal processing times are subject to various factors such as currency type, Investor's country, and banking institutions. Times are relative and subject to modification by the broker.
                  </p>
                </div>

                <div className="border-t border-gray-300 pt-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Signatures</h3>
                  <div className="space-y-4">
                    <div>
                      <p><strong>Trader:</strong></p>
                      <p>Name: Cristian Rolando Dorao</p>
                      <p>Signature: ______________________</p>
                      <p>Date: {new Date().toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p><strong>Investor:</strong></p>
                      <p>Name: {formData.firstName} {formData.lastName}</p>
                      <p>Signature: ______________________</p>
                      <p>Date: {new Date().toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Scroll indicator */}
            {!hasScrolledToEnd && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <AlertCircle size={16} className="text-amber-600" />
                  <p className="text-amber-800 text-sm font-medium">
                    Please scroll down to read the complete agreement
                  </p>
                </div>
              </div>
            )}

            {/* Agreement Checkbox */}
            <div className={`transition-opacity duration-300 ${hasScrolledToEnd ? 'opacity-100' : 'opacity-50'}`}>
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={contractAccepted}
                  onChange={(e) => setContractAccepted(e.target.checked)}
                  disabled={!hasScrolledToEnd}
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                />
                <div className="text-sm">
                  <p className="font-medium text-gray-900">
                    I have read and agree to the Investment and Operation Agreement
                  </p>
                  <p className="text-gray-600 mt-1">
                    By checking this box, I acknowledge that I have read, understood, and agree to be bound by all terms and conditions outlined in this agreement.
                  </p>
                </div>
              </label>
            </div>

            {errors.contract && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {errors.contract}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (isSuccess) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Investor Added Successfully" size="md">
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check size={32} className="text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Investor Created Successfully!</h3>
          <p className="text-gray-600 mb-6">
            {formData.firstName} {formData.lastName} has been added to the platform. They will receive an email with login instructions.
          </p>
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Name</p>
                <p className="font-medium">{formData.firstName} {formData.lastName}</p>
              </div>
              <div>
                <p className="text-gray-500">Email</p>
                <p className="font-medium">{formData.email}</p>
              </div>
              <div>
                <p className="text-gray-500">Initial Deposit</p>
                <p className="font-medium">${(Number(formData.depositAmount) || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-500">Account Type</p>
                <p className="font-medium">{formData.accountType}</p>
              </div>
              <div>
                <p className="text-gray-500">Country</p>
                <p className="font-medium">{formData.country}</p>
              </div>
            </div>
          </div>
          <Button onClick={handleClose}>Close</Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add New Investor" size="lg">
      <div className="space-y-6">
        {/* Progress Bar */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                currentStep >= step.number
                  ? 'bg-blue-500 border-blue-500 text-white'
                  : 'border-gray-300 text-gray-500'
              }`}>
                {currentStep > step.number ? (
                  <Check size={18} />
                ) : (
                  step.icon
                )}
              </div>
              <div className="ml-3 hidden md:block">
                <p className={`text-sm font-medium ${
                  currentStep >= step.number ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  Step {step.number}
                </p>
                <p className={`text-xs ${
                  currentStep >= step.number ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {step.title}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-12 h-0.5 mx-4 ${
                  currentStep > step.number ? 'bg-blue-500' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="min-h-96">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {steps[currentStep - 1].title}
              </h3>
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Error Message */}
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
            <AlertCircle size={18} className="mr-2" />
            {errors.submit}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={currentStep === 1 ? handleClose : handlePrevious}
          >
            {currentStep === 1 ? (
              'Cancel'
            ) : (
              <>
                <ChevronLeft size={18} className="mr-1" />
                Previous
              </>
            )}
          </Button>
          
          {currentStep < 4 ? (
            <Button variant="primary" onClick={handleNext}>
              Next
              <ChevronRight size={18} className="ml-1" />
            </Button>
          ) : currentStep === 4 ? (
            <Button variant="primary" onClick={handleNext}>
              Next
              <ChevronRight size={18} className="ml-1" />
            </Button>
          ) : (
            <Button
              variant="success"
              onClick={handleSubmit}
              isLoading={isLoading}
              disabled={isLoading || !contractAccepted}
            >
              <Check size={18} className="mr-2" />
              Create Investor
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default AddInvestorModal;