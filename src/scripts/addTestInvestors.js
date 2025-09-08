// Script to add test investors to the users collection
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDb2i4UdzhB6ChT30ljwRXSIjBM8LMT318",
  authDomain: "blackbull-4b009.firebaseapp.com",
  projectId: "blackbull-4b009",
  storageBucket: "blackbull-4b009.firebasestorage.app",
  messagingSenderId: "600574134239",
  appId: "1:600574134239:web:377484c5db15edf320a66a",
  measurementId: "G-PS64KEQB6T"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const testInvestors = [
  {
    id: 'investor_1735344001_abc123def',
    name: 'Pamela Medina',
    email: 'pamela.medina@example.com',
    phone: '+52 555 123 4567',
    country: 'Mexico',
    location: 'Mexico City',
    joinDate: '2024-12-15',
    initialDeposit: 5000,
    currentBalance: 6250,
    role: 'investor',
    isActive: true,
    accountStatus: 'Restricted for withdrawals (policy violation)',
    tradingData: {
      positionsPerDay: 3,
      pairs: ['EUR/USD', 'GBP/USD'],
      platform: 'IBKR',
      leverage: 100,
      currency: 'USD'
    },
    bankDetails: {
      accountHolderName: 'Pamela Medina',
      bankName: 'Banorte',
      accountNumber: '1234567890',
      swiftCode: 'BNMXMXMM',
      currency: 'MXN'
    }
  },
  {
    id: 'investor_1735344002_def456ghi',
    name: 'Omar Ehab',
    email: 'omar.ehab@example.com',
    phone: '+971 50 123 4567',
    country: 'United Arab Emirates',
    location: 'Dubai',
    joinDate: '2024-12-10',
    initialDeposit: 10000,
    currentBalance: 12500,
    role: 'investor',
    isActive: true,
    accountStatus: 'Active',
    tradingData: {
      positionsPerDay: 5,
      pairs: ['USD/AED', 'EUR/USD', 'GBP/USD'],
      platform: 'IBKR',
      leverage: 100,
      currency: 'USD'
    },
    bankDetails: {
      accountHolderName: 'Omar Ehab',
      bankName: 'Emirates NBD',
      accountNumber: '9876543210',
      swiftCode: 'EBILAEAD',
      currency: 'AED'
    }
  },
  {
    id: 'investor_1735344003_ghi789jkl',
    name: 'Rodrigo Alfonso',
    email: 'rodrigo.alfonso@example.com',
    phone: '+52 555 987 6543',
    country: 'Mexico',
    location: 'Guadalajara',
    joinDate: '2024-12-08',
    initialDeposit: 7500,
    currentBalance: 8750,
    role: 'investor',
    isActive: true,
    accountStatus: 'Active',
    tradingData: {
      positionsPerDay: 2,
      pairs: ['USD/MXN', 'EUR/USD'],
      platform: 'IBKR',
      leverage: 100,
      currency: 'USD'
    },
    bankDetails: {
      accountHolderName: 'Rodrigo Alfonso',
      bankName: 'BBVA México',
      accountNumber: '5555666677',
      swiftCode: 'BCMRMXMM',
      currency: 'MXN'
    }
  },
  {
    id: 'investor_1735344004_jkl012mno',
    name: 'Pablo Canales',
    email: 'pablo.canales@example.com',
    phone: '+52 555 111 2222',
    country: 'Mexico',
    location: 'Monterrey',
    joinDate: '2024-12-05',
    initialDeposit: 3000,
    currentBalance: 2800,
    role: 'investor',
    isActive: true,
    accountStatus: 'Restricted for withdrawals (policy violation)',
    tradingData: {
      positionsPerDay: 1,
      pairs: ['USD/MXN'],
      platform: 'IBKR',
      leverage: 100,
      currency: 'USD'
    },
    bankDetails: {
      accountHolderName: 'Pablo Canales',
      bankName: 'Santander México',
      accountNumber: '7777888899',
      swiftCode: 'BMSXMXMM',
      currency: 'MXN'
    }
  },
  {
    id: 'investor_1735344005_mno345pqr',
    name: 'Javier Francisco',
    email: 'javier.francisco@example.com',
    phone: '+52 555 333 4444',
    country: 'Mexico',
    location: 'Tijuana',
    joinDate: '2024-12-01',
    initialDeposit: 15000,
    currentBalance: 18750,
    role: 'investor',
    accountType: 'Pro',
    isActive: true,
    accountStatus: 'Active',
    tradingData: {
      positionsPerDay: 4,
      pairs: ['USD/MXN', 'EUR/USD', 'GBP/USD'],
      platform: 'IBKR',
      leverage: 100,
      currency: 'USD'
    },
    bankDetails: {
      accountHolderName: 'Javier Francisco',
      bankName: 'Banorte',
      accountNumber: '1111222233',
      swiftCode: 'BNMXMXMM',
      currency: 'MXN'
    }
  }
];

async function addTestInvestors() {
  try {
    console.log('🔥 Adding test investors to users collection...');
    
    for (const investor of testInvestors) {
      const docRef = doc(db, 'users', investor.id);
      
      const investorData = {
        ...investor,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await setDoc(docRef, investorData);
      console.log(`✅ Added investor: ${investor.name}`);
    }
    
    console.log('✅ All test investors added successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error adding test investors:', error);
    process.exit(1);
  }
}

addTestInvestors();