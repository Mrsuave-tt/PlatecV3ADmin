const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

/**
 * Cloud Function to delete a user completely
 * This deletes from both Firebase Auth and Firestore
 */
exports.deleteUser = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  // Get caller's data
  const callerDoc = await admin.firestore()
    .collection('users')
    .doc(context.auth.uid)
    .get();

  if (!callerDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Caller user data not found');
  }

  const callerData = callerDoc.data();
  const { userId } = data;

  // Only admins can delete users
  if (callerData.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can delete users');
  }

  if (!userId) {
    throw new functions.https.HttpsError('invalid-argument', 'User ID is required');
  }

  try {
    // Get user data before deletion for logging
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(userId)
      .get();

    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const userData = userDoc.data();

    // Delete from Firestore
    await admin.firestore().collection('users').doc(userId).delete();
    console.log(`✅ User document deleted: ${userId}`);

    // Delete from Firebase Auth
    await admin.auth().deleteUser(userId);
    console.log(`✅ User deleted from Auth: ${userId}`);

    return {
      success: true,
      message: `${userData.role.charAt(0).toUpperCase() + userData.role.slice(1)} "${userData.name}" deleted successfully.`
    };

  } catch (error) {
    console.error('❌ Error deleting user:', error);
    
    if (error.code === 'auth/user-not-found') {
      throw new functions.https.HttpsError('not-found', 'User not found in Firebase Auth');
    }
    
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Cloud Function to create a student or teacher
 * This prevents the auth conflict where createUserWithEmailAndPassword logs out the current user
 */
exports.createUser = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  // Get caller's data
  const callerDoc = await admin.firestore()
    .collection('users')
    .doc(context.auth.uid)
    .get();

  if (!callerDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Caller user data not found');
  }

  const callerData = callerDoc.data();
  const { email, password, name, role } = data;

  // Validate input
  if (!email || !password || !name || !role) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
  }

  if (!['student', 'teacher', 'admin'].includes(role)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid role');
  }

  // Authorization checks
  if (callerData.role === 'teacher' && role !== 'student') {
    throw new functions.https.HttpsError('permission-denied', 'Teachers can only create students');
  }

  if (callerData.role === 'student') {
    throw new functions.https.HttpsError('permission-denied', 'Students cannot create users');
  }

  try {
    // Create the user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: name,
    });

    // Create user document in Firestore
    await admin.firestore().collection('users').doc(userRecord.uid).set({
      email: email,
      name: name,
      role: role,
      createdBy: callerData.role === 'admin' ? null : context.auth.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`User created: ${userRecord.uid} (${role}) by ${context.auth.uid}`);

    return {
      success: true,
      uid: userRecord.uid,
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} created successfully`
    };

  } catch (error) {
    console.error('Error creating user:', error);
    
    // Handle specific errors
    if (error.code === 'auth/email-already-exists') {
      throw new functions.https.HttpsError('already-exists', 'Email already in use');
    }
    
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Cloud Function to send notification when attendance is marked
 */
exports.onAttendanceMarked = functions.firestore
  .document('attendance/{attendanceId}')
  .onCreate(async (snap, context) => {
    const attendanceData = snap.data();
    
    // Only notify if absent or late
    if (attendanceData.status === 'present') {
      return null;
    }

    try {
      // Create notification
      await admin.firestore().collection('notifications').add({
        studentId: attendanceData.studentId,
        message: `You were marked ${attendanceData.status} on ${new Date(attendanceData.date).toLocaleDateString()}`,
        type: 'attendance',
        date: admin.firestore.FieldValue.serverTimestamp(),
        read: false,
      });

      console.log(`Notification created for student ${attendanceData.studentId}`);
      
      // TODO: Send push notification via FCM if fcmToken exists
      // const studentDoc = await admin.firestore().collection('users').doc(attendanceData.studentId).get();
      // if (studentDoc.exists && studentDoc.data().fcmToken) {
      //   await admin.messaging().send({
      //     token: studentDoc.data().fcmToken,
      //     notification: {
      //       title: 'Attendance Alert',
      //       body: `You were marked ${attendanceData.status}`,
      //     }
      //   });
      // }

      return null;
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  });
