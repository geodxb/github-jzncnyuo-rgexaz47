// Script to set up support credentials in Firebase
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

async function setupSupportCredentials() {
  try {
    console.log('🔥 Setting up support credentials for Cristian Dorao...');
    
    const credentials = {
      name: 'Cristian Dorao',
      email: 'crisdoraodxb',
      clientId: 'dxb171224',
      userId: 'admin_user', // You can update this with the actual admin user ID
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    // Store in supportCredentials collection
    const docRef = doc(db, 'supportCredentials', 'cristian_dorao');
    await setDoc(docRef, credentials);
    
    console.log('✅ Support credentials stored successfully!');
    console.log('Credentials:', {
      name: credentials.name,
      email: credentials.email,
      clientId: credentials.clientId
    });
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error setting up support credentials:', error);
    process.exit(1);
  }
}

setupSupportCredentials();