import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, createUserWithEmailAndPassword, deleteUser, sendPasswordResetEmail, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import firebaseConfig from '../../../firebase/firebaseConfig';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);

// Authentication functions
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

// Password Reset Function
export const resetPassword = async (email) => {
  try {
    console.log('🔐 Attempting password reset for:', email);

    // ActionCodeSettings to redirect after password reset
    const actionCodeSettings = {
      url: 'http://localhost:3000/login', // Replace with your actual website URL
      handleCodeInApp: true, // This must be true for redirect to work
    };

    await sendPasswordResetEmail(auth, email, actionCodeSettings);
    console.log('✅ Password reset email sent successfully to:', email);
    return {
      success: true,
      message: `Password reset email sent to ${email}! Please check your inbox and spam folder. You will be redirected to login page.`
    };
  } catch (error) {
    console.error('❌ Password reset error:', error);
    let errorMessage = error.message;

    // Add more specific error messages
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'No account found with this email address.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address format.';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Too many requests. Please try again later.';
    }

    return {
      success: false,
      error: errorMessage
    };
  }
};

// User Management Functions
export const createUser = async (email, password, name, role, createdBy = null, assignedTeacher = null) => {
  console.log('🔥 Using client-side user creation (no Cloud Functions)');
  try {
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log('✅ User created in Auth:', user.uid);

    // Create user document in Firestore
    const userData = {
      email: email,
      name: name,
      role: role,
      password: password, // stored so admin can view it in User Management
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Add createdBy field for students created by teachers
    if (role === 'student' && createdBy) {
      userData.createdBy = createdBy;
    }
    // Add assignedTeacher field for students assigned by admin
    if (role === 'student' && assignedTeacher) {
      userData.assignedTeacher = assignedTeacher;
    }

    console.log('📝 Creating Firestore document:', userData);
    await setDoc(doc(db, 'users', user.uid), userData);
    console.log('✅ Firestore document created successfully');

    return {
      success: true,
      data: {
        uid: user.uid,
        message: `${role.charAt(0).toUpperCase() + role.slice(1)} created successfully`,
        warning: 'Note: You were signed out during user creation. Please log back in.'
      }
    };
  } catch (error) {
    console.error('❌ Error creating user:', error);

    // Handle specific errors
    if (error.code === 'auth/email-already-in-use') {
      return { success: false, error: 'Email already exists. Please use a different email.' };
    }

    return { success: false, error: error.message };
  }
};

export const deleteUserAccount = async (userId) => {
  try {
    // Use Cloud Function for complete deletion
    const deleteUserFunction = httpsCallable(functions, 'deleteUser');
    const result = await deleteUserFunction({ userId });

    return result.data;
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Deletes a student's user document AND all related attendance/notification records.
 * Call this instead of a bare deleteDoc when removing a student.
 */
export const deleteStudentData = async (userId) => {
  try {
    const batch = writeBatch(db);

    // 1. Delete all attendance records for this student
    const attendanceSnap = await getDocs(
      query(collection(db, 'attendance'), where('studentId', '==', userId))
    );
    attendanceSnap.forEach((d) => batch.delete(d.ref));
    console.log(`🗑️ Queued ${attendanceSnap.size} attendance records for deletion`);

    // 2. Delete all notification records for this student
    const notifSnap = await getDocs(
      query(collection(db, 'notifications'), where('studentId', '==', userId))
    );
    notifSnap.forEach((d) => batch.delete(d.ref));
    console.log(`🗑️ Queued ${notifSnap.size} notification records for deletion`);

    // 3. Delete the user document
    batch.delete(doc(db, 'users', userId));

    await batch.commit();
    console.log(`✅ Student ${userId} and all related data deleted successfully`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error deleting student data:', error);
    return { success: false, error: error.message };
  }
};

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

export const getAllUsers = async (roleFilter = null) => {
  try {
    let q;
    if (roleFilter) {
      q = query(collection(db, 'users'), where('role', '==', roleFilter));
    } else {
      q = query(collection(db, 'users'));
    }
    const querySnapshot = await getDocs(q);
    const users = [];
    querySnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, data: users };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getStudentsByTeacher = async (teacherId) => {
  try {
    console.log('🔍 Fetching students for teacher:', teacherId);

    // Get students created by teacher AND students assigned to teacher
    const q1 = query(
      collection(db, 'users'),
      where('role', '==', 'student'),
      where('createdBy', '==', teacherId)
    );

    const q2 = query(
      collection(db, 'users'),
      where('role', '==', 'student'),
      where('assignedTeacher', '==', teacherId)
    );

    const [querySnapshot1, querySnapshot2] = await Promise.all([getDocs(q1), getDocs(q2)]);

    const students = [];

    // Add students created by teacher
    querySnapshot1.forEach((doc) => {
      students.push({ id: doc.id, ...doc.data(), source: 'createdBy' });
      console.log('📝 Student created by teacher:', doc.data().name);
    });

    // Add students assigned to teacher (avoid duplicates)
    querySnapshot2.forEach((doc) => {
      if (!students.find(s => s.id === doc.id)) {
        students.push({ id: doc.id, ...doc.data(), source: 'assignedTeacher' });
        console.log('📝 Student assigned to teacher:', doc.data().name);
      }
    });

    console.log(`✅ Found ${students.length} students for teacher ${teacherId}`);
    console.log('👥 Students:', students.map(s => ({ name: s.name, source: s.source })));

    return { success: true, data: students };
  } catch (error) {
    console.error('❌ Error fetching students by teacher:', error);
    return { success: false, error: error.message };
  }
};

// Attendance Functions
export const markAttendance = async (studentId, status, markedBy, notes = '') => {
  try {
    const today = new Date().toISOString().split('T')[0];
    console.log('📅 Today\'s date:', today);
    console.log('🕐 Current time:', new Date().toISOString());

    // Check if attendance already exists for today
    const q = query(
      collection(db, 'attendance'),
      where('studentId', '==', studentId),
      where('date', '==', today)
    );
    const querySnapshot = await getDocs(q);

    const attendanceData = {
      studentId,
      date: today,
      status,
      markedBy,
      notes,
      timestamp: new Date().toISOString()
    };

    console.log('📊 Attendance data being saved:', attendanceData);

    if (!querySnapshot.empty) {
      // Update existing record
      const docId = querySnapshot.docs[0].id;
      await updateDoc(doc(db, 'attendance', docId), attendanceData);
      console.log('🔄 Updated existing attendance record');
    } else {
      // Create new record
      await setDoc(doc(db, 'attendance', Date.now().toString()), attendanceData);
      console.log('✅ Created new attendance record');
    }

    // Create notification for student
    await createAttendanceNotification(studentId, status, markedBy, today);

    return { success: true };
  } catch (error) {
    console.error('❌ Error marking attendance:', error);
    return { success: false, error: error.message };
  }
};

// Create attendance notification for student
const createAttendanceNotification = async (studentId, status, markedBy, date) => {
  try {
    console.log('🔔 Creating attendance notification for student:', studentId);
    console.log('📊 Attendance details:', { status, markedBy, date });

    // Get teacher's name
    const teacherDoc = await getDoc(doc(db, 'users', markedBy));
    const teacherName = teacherDoc.exists() ? teacherDoc.data().name : 'Your teacher';

    // Get student's name
    const studentDoc = await getDoc(doc(db, 'users', studentId));
    const studentName = studentDoc.exists() ? studentDoc.data().name : 'Student';

    console.log('👤 Teacher:', teacherName, 'Student:', studentName);
    console.log('📱 Student exists:', studentDoc.exists());
    console.log('🆔 Student ID:', studentId);

    // Create notification message
    const statusMessages = {
      present: 'marked as Present',
      absent: 'marked as Absent',
      late: 'marked as Late'
    };

    const notificationData = {
      studentId,
      title: 'Attendance Marked',
      message: `${teacherName} has ${statusMessages[status]} for today`,
      type: 'attendance',
      status,
      date,
      markedBy,
      read: false,
      timestamp: new Date().toISOString()
    };

    console.log('📝 Creating notification data:', notificationData);

    // Save notification to Firestore
    const notificationRef = doc(db, 'notifications', `${studentId}_${Date.now()}`);
    await setDoc(notificationRef, notificationData);
    console.log(`✅ Notification created with ID: ${notificationRef.id} for student ${studentName}`);
    console.log('🔗 Full notification path:', notificationRef.path);

  } catch (error) {
    console.error('❌ Error creating notification:', error);
  }
};

export const getAttendanceRecords = async (studentId = null, startDate = null, endDate = null) => {
  try {
    let q = query(collection(db, 'attendance'));

    if (studentId) {
      q = query(q, where('studentId', '==', studentId));
    }
    if (startDate) {
      q = query(q, where('date', '>=', startDate));
    }
    if (endDate) {
      q = query(q, where('date', '<=', endDate));
    }

    q = query(q, orderBy('date', 'desc'));
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

export const getAttendanceRecordsForTeacher = async (teacherId, studentIds = null) => {
  try {
    let q = query(collection(db, 'attendance'));

    // Filter by teacher's students
    if (studentIds && studentIds.length > 0) {
      q = query(q, where('studentId', 'in', studentIds));
    }

    q = query(q, orderBy('date', 'desc'));
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

// Notification Functions
export const createNotification = async (studentId, message, type = 'general') => {
  try {
    await setDoc(doc(db, 'notifications', Date.now().toString()), {
      studentId,
      message,
      type,
      date: new Date().toISOString(),
      read: false
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

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

    // Re-authenticate first
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);

    // Update password in Firebase Auth
    await updatePassword(user, newPassword);

    // Also update password in Firestore (so admin can see it)
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

// ── Student-Teacher Assignment ──────────────────────────────────────────────
export const assignStudentToTeacher = async (studentId, teacherId) => {
  try {
    await updateDoc(doc(db, 'users', studentId), {
      assignedTeacher: teacherId || null,
      updatedAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ── Departments ─────────────────────────────────────────────────────────────
export const getDepartments = async () => {
  try {
    const snap = await getDocs(collection(db, 'departments'));
    const departments = [];
    snap.forEach(d => departments.push({ id: d.id, ...d.data() }));
    return { success: true, data: departments };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const createDepartment = async (data) => {
  try {
    const ref = doc(collection(db, 'departments'));
    await setDoc(ref, {
      ...data,
      teacherIds: data.teacherIds || [],
      createdAt: new Date().toISOString(),
    });
    return { success: true, id: ref.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateDepartment = async (deptId, data) => {
  try {
    await updateDoc(doc(db, 'departments', deptId), {
      ...data,
      updatedAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteDepartment = async (deptId) => {
  try {
    await deleteDoc(doc(db, 'departments', deptId));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
