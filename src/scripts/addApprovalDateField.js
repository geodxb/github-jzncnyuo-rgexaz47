// Script to add approvalDate field to all existing withdrawal requests in Firebase
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore';

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

async function addApprovalDateToWithdrawalRequests() {
  try {
    console.log('🔥 Adding approvalDate field to all existing withdrawal requests...');
    
    // Get all withdrawal requests
    const withdrawalRequestsSnapshot = await getDocs(collection(db, 'withdrawalRequests'));
    
    if (withdrawalRequestsSnapshot.empty) {
      console.log('⚠️ No withdrawal requests found in collection');
      return;
    }
    
    console.log(`📊 Found ${withdrawalRequestsSnapshot.size} withdrawal requests to update`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    let approvedCount = 0;
    
    for (const docSnapshot of withdrawalRequestsSnapshot.docs) {
      const data = docSnapshot.data();
      const requestId = docSnapshot.id;
      const investorName = data.investorName || 'Unknown';
      const status = data.status || 'Pending';
      
      // Check if approvalDate field already exists and has a value
      if (data.approvalDate && data.approvalDate !== null) {
        console.log(`⏭️ Skipping ${investorName} (${requestId.slice(-8)}) - approvalDate already exists`);
        skippedCount++;
        continue;
      }
      
      const docRef = doc(db, 'withdrawalRequests', requestId);
      
      // If the request is already approved, set the approval date to processedAt or current time
      if (status === 'Approved') {
        // Use processedAt if available, otherwise use current timestamp
        const approvalDate = data.processedAt || serverTimestamp();
        await updateDoc(docRef, {
          approvalDate: approvalDate
        });
        console.log(`✅ Updated APPROVED request for ${investorName} (${requestId.slice(-8)}) - set approvalDate to processedAt`);
        approvedCount++;
      } else {
        // For pending/rejected requests, set approvalDate to null
        await updateDoc(docRef, {
          approvalDate: null
        });
        console.log(`✅ Updated ${status} request for ${investorName} (${requestId.slice(-8)}) - set approvalDate to null`);
      }
      
      updatedCount++;
    }
    
    console.log('\n📈 Update Summary:');
    console.log(`✅ Total updated: ${updatedCount}`);
    console.log(`⏭️ Skipped (already had field): ${skippedCount}`);
    console.log(`🎯 Approved requests with dates set: ${approvedCount}`);
    console.log(`📊 Total withdrawal requests: ${withdrawalRequestsSnapshot.size}`);
    console.log('\n✅ All withdrawal requests now have approvalDate field!');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error adding approvalDate field:', error);
    process.exit(1);
  }
}

addApprovalDateToWithdrawalRequests();