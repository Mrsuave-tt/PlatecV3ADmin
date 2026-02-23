import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChangedListener, getUserData, logoutUser } from '../services/firebase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChangedListener(async (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser);
      if (firebaseUser) {
        setUser(firebaseUser);

        // Fetch user data from Firestore
        console.log('Fetching user data for UID:', firebaseUser.uid);
        const result = await getUserData(firebaseUser.uid);
        console.log('User data result:', result);
        if (result.success) {
          setUserData(result.data);
          console.log('User data set:', result.data);
        } else {
          console.error('Error fetching user data:', result.error);
          setUserData(null);

          // If user data not found, the user was deleted - sign them out
          if (result.error === 'User not found') {
            console.log('🔒 User data not found, signing out...');
            setUser(null);
            setUserData(null);
            // Force redirect to login page
            window.location.href = '/login';
          }
        }
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshUserData = async () => {
    if (user) {
      const result = await getUserData(user.uid);
      if (result.success) {
        setUserData(result.data);
      }
    }
  };

  const value = {
    user,
    userData,
    loading,
    refreshUserData
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
