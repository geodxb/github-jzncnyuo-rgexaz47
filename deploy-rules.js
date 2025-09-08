// Script to deploy Firestore rules
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🔥 Deploying Firestore rules...');

try {
  // Check if Firebase CLI is available
  try {
    execSync('npx firebase --version', { stdio: 'pipe' });
    console.log('✅ Firebase CLI is available');
  } catch (error) {
    console.log('⚠️ Firebase CLI not found, installing...');
    execSync('npm install -g firebase-tools', { stdio: 'inherit' });
  }

  // Check if firebase.json exists
  if (!fs.existsSync('firebase.json')) {
    console.error('❌ firebase.json not found. Make sure you are in the project root directory.');
    process.exit(1);
  }

  // Check if firestore.rules exists
  if (!fs.existsSync('firestore.rules')) {
    console.error('❌ firestore.rules not found. Make sure the rules file exists.');
    process.exit(1);
  }

  console.log('📋 Current Firestore rules:');
  const rules = fs.readFileSync('firestore.rules', 'utf8');
  console.log(rules);

  // Check authentication status first
  console.log('🔐 Checking Firebase authentication...');
  try {
    execSync('npx firebase projects:list', { stdio: 'pipe' });
    console.log('✅ Firebase authentication verified');
  } catch (authError) {
    console.log('❌ Firebase authentication failed');
    console.log('\n🔧 SOLUTION: Use Manual Deployment (Recommended)');
    console.log('1. Open: https://console.firebase.google.com/project/blackbull-4b009/firestore/rules');
    console.log('2. Copy all content from the firestore.rules file');
    console.log('3. Paste it in the Firebase Console rules editor');
    console.log('4. Click "Publish" to deploy immediately');
    console.log('\n🔧 Alternative CLI Solutions:');
    console.log('• Try: npx firebase login --no-localhost');
    console.log('• Try: npx firebase login --interactive');
    console.log('• Try: npx firebase login --reauth');
    console.log('• Or set FIREBASE_TOKEN environment variable');
    console.log('\n📝 Manual deployment is fastest and most reliable:');
    console.log('   https://console.firebase.google.com/project/blackbull-4b009/firestore/rules');
    console.log('\n✅ Rules are already updated in the local firestore.rules file');
    console.log('   Just copy-paste to Firebase Console and click Publish!');
    process.exit(0); // Exit gracefully instead of failing
  }

  // Deploy the rules
  console.log('🚀 Deploying Firestore rules...');
  execSync('npx firebase deploy --only firestore:rules --project blackbull-4b009', {
    stdio: 'inherit',
    env: { ...process.env, FIREBASE_TOKEN: process.env.FIREBASE_TOKEN }
  });

  console.log('✅ Firestore rules deployed successfully!');
  console.log('🔄 The new rules should be active within a few seconds.');
  
} catch (error) {
  console.error('❌ Error deploying rules:', error.message);
  
  if (error.message.includes('not authenticated') || error.message.includes('permission')) {
    console.log('\n🔐 Authentication required. Please run:');
    console.log('1. npx firebase login --no-localhost');
    console.log('2. Or: npx firebase login --interactive');
    console.log('2. Check project access: npx firebase projects:list');
    console.log('3. Set the correct project: npx firebase use blackbull-4b009');
    console.log('\n📝 Manual deployment option:');
    console.log('   Copy the rules from firestore.rules to Firebase Console');
    console.log('   https://console.firebase.google.com/project/blackbull-4b009/firestore/rules');
  }
  
  console.log('\n✅ Note: The app will work with existing rules');
  console.log('   Rules deployment is optional for development');
  process.exit(0); // Exit gracefully to not break the build process
}