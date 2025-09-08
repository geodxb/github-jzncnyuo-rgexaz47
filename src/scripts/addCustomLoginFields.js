// Script to add customLoginId and hashedPassword fields to existing investors
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import bcrypt from 'bcryptjs';

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

// Generate unique custom login ID
function generateCustomLoginId(name, existingIds) {
  // Create base ID from name
  const nameBase = name.replace(/\s+/g, '').substring(0, 8).toUpperCase();
  const timestamp = Date.now().toString(36).slice(-4).toUpperCase();
  
  let loginId = `INV${nameBase}${timestamp}`;
  
  // Ensure uniqueness
  let counter = 1;
  while (existingIds.has(loginId)) {
    loginId = `INV${nameBase}${timestamp}${counter}`;
    counter++;
  }
  
  return loginId;
}

async function addCustomLoginFields() {
  try {
    console.log('🔥 Adding customLoginId and hashedPassword fields to existing investors...');
    
    // Query all users with role 'investor'
    const usersQuery = query(collection(db, 'users'), where('role', '==', 'investor'));
    const querySnapshot = await getDocs(usersQuery);
    
    if (querySnapshot.empty) {
      console.log('⚠️ No investors found in users collection');
      return;
    }
    
    console.log(`📊 Found ${querySnapshot.size} investors to update`);
    
    // Track existing login IDs to ensure uniqueness
    const existingLoginIds = new Set();
    
    // First pass: collect existing login IDs
    querySnapshot.docs.forEach(docSnapshot => {
      const data = docSnapshot.data();
      if (data.customLoginId) {
        existingLoginIds.add(data.customLoginId);
      }
    });
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const docSnapshot of querySnapshot.docs) {
      const data = docSnapshot.data();
      const investorId = docSnapshot.id;
      const investorName = data.name || 'Unknown';
      
      // Check if fields already exist
      if (data.customLoginId && data.hashedPassword) {
        console.log(`⏭️ Skipping ${investorName} - custom login fields already exist`);
        skippedCount++;
        continue;
      }
      
      // Generate custom login ID if not exists
      let customLoginId = data.customLoginId;
      if (!customLoginId) {
        customLoginId = generateCustomLoginId(investorName, existingLoginIds);
        existingLoginIds.add(customLoginId);
      }
      
      // Generate default password and hash it
      const defaultPassword = 'investor123'; // Default password for all investors
      const hashedPassword = await bcrypt.hash(defaultPassword, 12);
      
      // Update the document
      const docRef = doc(db, 'users', investorId);
      const updateData = {};
      
      if (!data.customLoginId) {
        updateData.customLoginId = customLoginId;
      }
      
      if (!data.hashedPassword) {
        updateData.hashedPassword = hashedPassword;
      }
      
      await updateDoc(docRef, updateData);
      
      console.log(`✅ Updated ${investorName}:`);
      console.log(`   Login ID: ${customLoginId}`);
      console.log(`   Password: ${defaultPassword} (hashed)`);
      updatedCount++;
    }
    
    console.log('\n📈 Update Summary:');
    console.log(`✅ Updated investors: ${updatedCount}`);
    console.log(`⏭️ Skipped (already had fields): ${skippedCount}`);
    console.log(`📊 Total investors: ${querySnapshot.size}`);
    
    console.log('\n📋 Default Login Credentials for All Investors:');
    console.log('Password: investor123');
    console.log('\nLogin IDs assigned:');
    
    // Show all login IDs
    const finalSnapshot = await getDocs(usersQuery);
    finalSnapshot.docs.forEach(docSnapshot => {
      const data = docSnapshot.data();
      if (data.customLoginId) {
        console.log(`• ${data.name}: ${data.customLoginId}`);
      }
    });
    
    console.log('\n✅ All investors now have custom login credentials!');
    console.log('🔐 Investors can now log in at /investor-login using their Login ID and password');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error adding custom login fields:', error);
    process.exit(1);
  }
}

addCustomLoginFields();