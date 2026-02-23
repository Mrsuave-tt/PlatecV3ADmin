// Temporary script to create admin via Cloud Function
import { getFunctions, httpsCallable } from 'firebase/functions';
import { initializeApp } from 'firebase/app';
import firebaseConfig from './firebase/firebaseConfig.js';

const app = initializeApp(firebaseConfig);
const functions = getFunctions(app);

const createAdminViaFunction = async () => {
  const createUser = httpsCallable(functions, 'createUser');
  
  try {
    const result = await createUser({
      email: 'vincentcanono89@gmail.com',
      password: 'tempPassword123!', // Change this immediately
      name: 'Vincent Canono',
      role: 'admin'
    });
    
    console.log('Admin created:', result.data);
  } catch (error) {
    console.error('Error:', error);
  }
};

createAdminViaFunction();
