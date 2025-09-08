// Script to add accountType field to all existing investors in Firebase
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

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

async function addAccountTypeToInvestors() {
  try {
    console.log('🔥 Adding accountType field to existing investors...');
    
    // Query all users with role 'investor'
    const usersQuery = query(collection(db, 'users'), where('role', '==', 'investor'));
    const querySnapshot = await getDocs(usersQuery);
    
    if (querySnapshot.empty) {
      console.log('⚠️ No investors found in users collection');
      return;
    }
    
    console.log(`📊 Found ${querySnapshot.size} investors to update`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const docSnapshot of querySnapshot.docs) {
      const data = docSnapshot.data();
      const investorId = docSnapshot.id;
      const investorName = data.name || 'Unknown';
      
      // Check if accountType field already exists
      if (data.accountType) {
        console.log(`⏭️ Skipping ${investorName} - accountType already exists: ${data.accountType}`);
        skippedCount++;
        continue;
      }
      
      // Add accountType field with default value 'Standard'
      const docRef = doc(db, 'users', investorId);
      await updateDoc(docRef, {
        accountType: 'Standard'
      });
      
      console.log(`✅ Updated ${investorName} - added accountType: Standard`);
      updatedCount++;
    }
    
    console.log('\n📈 Update Summary:');
    console.log(`✅ Updated investors: ${updatedCount}`);
    console.log(`⏭️ Skipped (already had field): ${skippedCount}`);
    console.log(`📊 Total investors: ${querySnapshot.size}`);
    console.log('\n✅ All investors now have accountType field!');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error adding accountType field:', error);
    process.exit(1);
  }
}

addAccountTypeToInvestors();