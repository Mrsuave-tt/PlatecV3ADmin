import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChangedListener, getUserData } from '../services/firebase';

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
      if (firebaseUser) {
        setUser(firebaseUser);

        // Fetch user data from Firestore
        const result = await getUserData(firebaseUser.uid);
        if (result.success) {
          setUserData(result.data);
        } else {
          console.error('Error fetching user data:', result.error);
          setUserData(null);
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
