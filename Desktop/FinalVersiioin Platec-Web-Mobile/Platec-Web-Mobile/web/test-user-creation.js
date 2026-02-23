// Quick test to check if we can create users manually
// Run this in browser console on admin dashboard

import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import firebaseConfig from './firebase/firebaseConfig.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Test creating a user
window.testCreateUser = async () => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, 'test@example.com', 'password123');
    const user = userCredential.user;
    console.log('User created:', user.uid);
    
    await setDoc(doc(db, 'users', user.uid), {
      email: 'test@example.com',
      name: 'Test User',
      role: 'teacher',
      createdAt: new Date().toISOString()
    });
    
    console.log('Document created successfully!');
  } catch (error) {
    console.error('Error:', error);
  }
};
