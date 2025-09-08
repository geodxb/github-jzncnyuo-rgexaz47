import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDSQIcBKIGGG5fzQOxKxKxKxKxKxKxKxKx",
  authDomain: "blackbull-4b009.firebaseapp.com",
  projectId: "blackbull-4b009",
  storageBucket: "blackbull-4b009.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdefghijklmnop"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Test investors to create
const testInvestors = [
  {
    email: 'john.doe@example.com',
    password: 'TestPass123!',
    name: 'John Doe',
    country: 'United States',
    phone: '+1-555-0123',
    joinDate: '2024-01-15',
    initialDeposit: 50000,
    currentBalance: 75000,
    accountType: 'Individual',
    isActive: true,
    accountStatus: 'Active'
  },
  {
    email: 'sarah.wilson@example.com',
    password: 'TestPass123!',
    name: 'Sarah Wilson',
    country: 'United Kingdom',
    phone: '+44-20-7946-0958',
    joinDate: '2024-02-20',
    initialDeposit: 100000,
    currentBalance: 125000,
    accountType: 'Individual',
    isActive: true,
    accountStatus: 'Active'
  },
  {
    email: 'michael.chen@example.com',
    password: 'TestPass123!',
    name: 'Michael Chen',
    country: 'Singapore',
    phone: '+65-6123-4567',
    joinDate: '2024-03-10',
    initialDeposit: 200000,
    currentBalance: 180000,
    accountType: 'Corporate',
    isActive: true,
    accountStatus: 'Active'
  }
];

async function createTestUsers() {
  console.log('🔥 Creating Firebase Authentication users and Firestore documents...');
  
  for (const investor of testInvestors) {
    try {
      console.log(`\n📧 Creating user: ${investor.email}`);
      
      // Create Firebase Authentication user
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        investor.email, 
        investor.password
      );
      
      const firebaseUser = userCredential.user;
      console.log(`✅ Firebase Auth user created with ID: ${firebaseUser.uid}`);
      
      // Create Firestore document
      const userData = {
        name: investor.name,
        email: investor.email,
        role: 'investor',
        profilePic: '',
        country: investor.country,
        phone: investor.phone,
        joinDate: investor.joinDate,
        initialDeposit: investor.initialDeposit,
        currentBalance: investor.currentBalance,
        accountType: investor.accountType,
        isActive: investor.isActive,
        accountStatus: investor.accountStatus,
        accountFlags: {
          policyViolation: false,
          suspiciousActivity: false,
          documentationIncomplete: false,
          withdrawalRestricted: false
        },
        bankAccounts: [],
        pendingProfileChanges: null,
        profileChangeMessage: '',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await setDoc(doc(db, 'users', firebaseUser.uid), userData);
      console.log(`✅ Firestore document created for: ${investor.name}`);
      
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log(`⚠️ User ${investor.email} already exists in Firebase Auth`);
      } else {
        console.error(`❌ Error creating user ${investor.email}:`, error);
      }
    }
  }
  
  console.log('\n🎉 Test user creation completed!');
  console.log('\nTest Credentials:');
  testInvestors.forEach(investor => {
    console.log(`📧 ${investor.email} | 🔑 ${investor.password}`);
  });
}

// Run the script
createTestUsers().catch(console.error);