import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBvQ4pF8xQ9xQ9xQ9xQ9xQ9xQ9xQ9xQ9xQ",
  authDomain: "blackbull-4b009.firebaseapp.com",
  projectId: "blackbull-4b009",
  storageBucket: "blackbull-4b009.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456789012345678"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function addMissingInvestor() {
  try {
    console.log('🔍 Adding missing investor profile...');
    
    // First, we need to get the UID for the email lopezcemx@gmail.com
    // Since we can't directly query Firebase Auth by email in admin SDK without proper setup,
    // we'll create the document with a placeholder UID that needs to be updated manually
    
    const investorData = {
      name: 'Lopez Investor',
      email: 'lopezcemx@gmail.com',
      role: 'investor',
      profilePic: '',
      country: 'Mexico',
      joinDate: '2024-01-15',
      initialDeposit: 5000,
      currentBalance: 5000,
      isActive: true,
      accountStatus: 'Active',
      accountType: 'Standard',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Note: You'll need to replace 'REPLACE_WITH_ACTUAL_UID' with the actual UID from Firebase Auth
    // To get the UID:
    // 1. Go to Firebase Console > Authentication
    // 2. Find the user lopezcemx@gmail.com
    // 3. Copy their UID
    // 4. Replace the document ID below with that UID
    
    const userId = 'REPLACE_WITH_ACTUAL_UID'; // This needs to be replaced with actual UID
    
    await setDoc(doc(db, 'users', userId), investorData);
    
    console.log('✅ Investor profile added successfully!');
    console.log('📝 Data added:', investorData);
    console.log('⚠️  IMPORTANT: Replace REPLACE_WITH_ACTUAL_UID with the actual UID from Firebase Auth');
    
  } catch (error) {
    console.error('❌ Error adding investor profile:', error);
  }
}

// Run the script
addMissingInvestor();