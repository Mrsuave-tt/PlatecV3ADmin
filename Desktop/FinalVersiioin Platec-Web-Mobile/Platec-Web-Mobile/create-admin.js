// Script to create admin user in Firestore
// Run this in Firebase Console → Firestore → Data → Add Collection → users
// Or use the Firebase CLI

import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import firebaseConfig from './firebase/firebaseConfig.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Create admin user document
const createAdminUser = async () => {
  const adminUid = '8J4I3QluHgMRnfcusBGsTg9B...'; // Replace with full UID from your screenshot
  const adminData = {
    email: 'vincentcanono89@gmail.com',
    name: 'Vincent Canono',
    role: 'admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    // Add any other fields you need
  };

  try {
    await setDoc(doc(db, 'users', adminUid), adminData);
    console.log('Admin user created successfully!');
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
};

createAdminUser();
