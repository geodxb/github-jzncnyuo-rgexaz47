// Script to add W-8 BEN fields to all existing withdrawal requests in Firebase
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';

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

async function addW8BenFieldsToWithdrawalRequests() {
  try {
    console.log('🔥 Adding W-8 BEN fields to all existing withdrawal requests...');
    
    // Get all withdrawal requests
    const withdrawalRequestsSnapshot = await getDocs(collection(db, 'withdrawalRequests'));
    
    if (withdrawalRequestsSnapshot.empty) {
      console.log('⚠️ No withdrawal requests found in collection');
      return;
    }
    
    console.log(`📊 Found ${withdrawalRequestsSnapshot.size} withdrawal requests to update`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    let w8benRequiredCount = 0;
    
    for (const docSnapshot of withdrawalRequestsSnapshot.docs) {
      const data = docSnapshot.data();
      const requestId = docSnapshot.id;
      const investorName = data.investorName || 'Unknown';
      const amount = data.amount || 0;
      
      // Check if W-8 BEN fields already exist
      if (data.w8benStatus !== undefined) {
        console.log(`⏭️ Skipping ${investorName} (${requestId.slice(-8)}) - W-8 BEN fields already exist`);
        skippedCount++;
        continue;
      }
      
      const docRef = doc(db, 'withdrawalRequests', requestId);
      
      // Determine W-8 BEN status based on amount
      let w8benStatus = 'not_required';
      if (amount >= 1000) {
        w8benStatus = 'required';
        w8benRequiredCount++;
      }
      
      // Add W-8 BEN fields
      await updateDoc(docRef, {
        w8benStatus: w8benStatus,
        w8benSubmittedAt: null,
        w8benApprovedAt: null,
        w8benDocumentUrl: null,
        w8benRejectionReason: null
      });
      
      console.log(`✅ Updated ${investorName} (${requestId.slice(-8)}) - Amount: $${amount.toLocaleString()}, W-8 BEN: ${w8benStatus}`);
      updatedCount++;
    }
    
    console.log('\n📈 Update Summary:');
    console.log(`✅ Total updated: ${updatedCount}`);
    console.log(`⏭️ Skipped (already had fields): ${skippedCount}`);
    console.log(`📋 W-8 BEN required (≥$1000): ${w8benRequiredCount}`);
    console.log(`📋 W-8 BEN not required (<$1000): ${updatedCount - w8benRequiredCount}`);
    console.log(`📊 Total withdrawal requests: ${withdrawalRequestsSnapshot.size}`);
    console.log('\n✅ All withdrawal requests now have W-8 BEN fields!');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error adding W-8 BEN fields:', error);
    process.exit(1);
  }
}

addW8BenFieldsToWithdrawalRequests();