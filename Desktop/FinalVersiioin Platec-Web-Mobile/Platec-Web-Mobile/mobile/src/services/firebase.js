import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, signInWithEmailAndPassword, signOut, onAuthStateChanged, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { getFirestore, collection, doc, getDoc, query, where, orderBy, getDocs, updateDoc, onSnapshot } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import firebaseConfig from '../config/firebaseConfig';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

const db = getFirestore(app);

// Export auth and db properly
export { auth, db };

// Authentication
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const onAuthStateChangedListener = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// User Data
export const getUserData = async (userId) => {
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { success: true, data: docSnap.data() };
    } else {
      return { success: false, error: 'User not found' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Attendance
export const getStudentAttendance = async (studentId, startDate = null, endDate = null) => {
  try {
    let q = query(
      collection(db, 'attendance'),
      where('studentId', '==', studentId),
      orderBy('date', 'desc')
    );

    if (startDate) {
      q = query(q, where('date', '>=', startDate));
    }
    if (endDate) {
      q = query(q, where('date', '<=', endDate));
    }

    const querySnapshot = await getDocs(q);
    const attendance = [];
    querySnapshot.forEach((doc) => {
      attendance.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, data: attendance };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Notifications
export const getStudentNotifications = async (studentId) => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('studentId', '==', studentId),
      orderBy('date', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const notifications = [];
    querySnapshot.forEach((doc) => {
      notifications.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, data: notifications };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const markNotificationAsRead = async (notificationId) => {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), { read: true });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Real-time notification listener
export const listenToStudentNotifications = (studentId, callback) => {
  console.log('🔔 Setting up notification listener for student:', studentId);

  const q = query(
    collection(db, 'notifications'),
    where('studentId', '==', studentId),
    orderBy('timestamp', 'desc')
  );

  return onSnapshot(q, (querySnapshot) => {
    const notifications = [];
    querySnapshot.forEach((doc) => {
      console.log('📱 Found notification:', doc.id, doc.data());
      notifications.push({ id: doc.id, ...doc.data() });
    });
    console.log('🔔 Real-time notifications updated:', notifications.length);
    console.log('📊 All notifications:', notifications);
    callback(notifications);
  }, (error) => {
    console.error('❌ Real-time notifications error:', error);
  });
};

// Real-time attendance listener
export const listenToStudentAttendance = (studentId, callback) => {
  const q = query(
    collection(db, 'attendance'),
    where('studentId', '==', studentId),
    orderBy('date', 'desc')
  );

  return onSnapshot(q, (querySnapshot) => {
    const attendance = [];
    querySnapshot.forEach((doc) => {
      attendance.push({ id: doc.id, ...doc.data() });
    });
    console.log('📊 Real-time attendance updated:', attendance.length);
    callback(attendance);
  }, (error) => {
    console.error('❌ Real-time attendance error:', error);
  });
};

// Get attendance statistics
export const getAttendanceStats = (attendanceRecords) => {
  const total = attendanceRecords.length;
  const present = attendanceRecords.filter(a => a.status === 'present').length;
  const absent = attendanceRecords.filter(a => a.status === 'absent').length;
  const late = attendanceRecords.filter(a => a.status === 'late').length;

  return {
    total,
    present,
    absent,
    late,
    presentPercent: total > 0 ? Math.round((present / total) * 100) : 0
  };
};

// Profile & Account Settings
export const updateUserProfile = async (userId, data) => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      ...data,
      updatedAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const changeUserPassword = async (currentPassword, newPassword) => {
  try {
    const user = auth.currentUser;
    if (!user) return { success: false, error: 'No user logged in' };

    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);

    // Also update in Firestore
    await updateDoc(doc(db, 'users', user.uid), {
      password: newPassword,
      updatedAt: new Date().toISOString(),
    });

    return { success: true };
  } catch (error) {
    let msg = error.message;
    if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      msg = 'Current password is incorrect';
    } else if (error.code === 'auth/weak-password') {
      msg = 'New password must be at least 6 characters';
    }
    return { success: false, error: msg };
  }
};
