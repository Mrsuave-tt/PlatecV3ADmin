# Mobile App Setup Guide (React Native + Expo)

## Prerequisites

- Node.js 16+ installed
- Expo CLI installed (`npm install -g expo-cli`)
- Expo Go app on your phone (iOS/Android)
- Firebase project already set up (from web setup)

## Installation Steps

### 1. Navigate to Mobile Directory

```bash
cd mobile
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start the Development Server

```bash
npx expo start
```

or

```bash
npm start
```

### 4. Run on Device

**Option A: Scan QR Code**
1. Open Expo Go app on your phone
2. Scan the QR code shown in terminal
3. App will load on your device

**Option B: Run on Emulator**

For Android:
```bash
npm run android
```

For iOS (Mac only):
```bash
npm run ios
```

## Testing the Mobile App

### 1. Create a Test Student Account

Use the web app (as teacher or admin) to create a student account:
- Email: student@test.com
- Password: student123
- Name: Test Student

### 2. Login on Mobile

1. Open the mobile app
2. Enter student credentials
3. You should see the home dashboard

### 3. Test Features

**Home Screen:**
- View today's attendance status
- See attendance statistics
- View attendance percentage

**Attendance History:**
- Tap "View Attendance History"
- See all past attendance records
- Pull down to refresh

**Notifications:**
- Tap "View Notifications"
- See notifications (created when marked absent/late)
- Tap notification to mark as read

## Important Notes

### Student-Only Access

The mobile app is **restricted to students only**. If a teacher or admin tries to login, they'll see a message to use the web portal instead.

### Real-time Updates

- Pull down to refresh any screen
- Data syncs with Firebase in real-time
- Notifications appear automatically when created

### Offline Behavior

- App requires internet connection
- Shows loading states appropriately
- Error messages for network issues

## Troubleshooting

### "Network request failed"

**Solution**: Check your Firebase configuration in `firebase/firebaseConfig.js`

### "Metro bundler not starting"

**Solution**:
```bash
# Clear cache
npx expo start -c

# Or reset everything
rm -rf node_modules
npm install
npx expo start
```

### "Unable to resolve module"

**Solution**:
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### App crashes on login

**Solution**: 
1. Check console for errors
2. Verify student account exists in Firebase
3. Check Firestore security rules are deployed

## Building for Production

### Android APK

```bash
# Build APK
eas build --platform android --profile preview

# Or create production build
eas build --platform android --profile production
```

### iOS App

```bash
# Build for iOS
eas build --platform ios --profile production
```

**Note**: Requires Expo Application Services (EAS) account

## Push Notifications (Optional)

To enable push notifications when students are marked absent/late:

### 1. Setup Expo Notifications

Already included in `package.json` and `app.json`

### 2. Register for Push Token

Add this to `HomeScreen.js`:

```javascript
import * as Notifications from 'expo-notifications';

// In useEffect
const registerForPushNotifications = async () => {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status === 'granted') {
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    // Save token to Firestore user document
    await updateDoc(doc(db, 'users', user.uid), { fcmToken: token });
  }
};
```

### 3. Send Notifications from Cloud Function

Update `functions/index.js`:

```javascript
// In onAttendanceMarked function
const studentDoc = await admin.firestore()
  .collection('users')
  .doc(attendanceData.studentId)
  .get();

if (studentDoc.exists && studentDoc.data().fcmToken) {
  await admin.messaging().send({
    token: studentDoc.data().fcmToken,
    notification: {
      title: 'Attendance Alert',
      body: `You were marked ${attendanceData.status}`,
    },
    data: {
      type: 'attendance',
      status: attendanceData.status
    }
  });
}
```

## File Structure

```
mobile/
├── App.js                          # Main app with navigation
├── app.json                        # Expo configuration
├── package.json
└── src/
    ├── contexts/
    │   └── AuthContext.js         # Auth state management
    ├── screens/
    │   ├── LoginScreen.js         # Student login
    │   ├── HomeScreen.js          # Main dashboard
    │   ├── AttendanceScreen.js    # Attendance history
    │   └── NotificationsScreen.js # Notifications list
    └── services/
        └── firebase.js            # Firebase operations
```

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Firebase not initialized" | Check firebaseConfig.js path |
| "Cannot read property 'role'" | User data not loaded, check getUserData() |
| Students see blank screen | Check Firestore rules for student read permissions |
| Notifications not appearing | Verify Cloud Function is deployed and working |

## Testing Checklist

- [ ] Student can login
- [ ] Home screen shows correct data
- [ ] Today's attendance displays if marked
- [ ] Statistics calculate correctly
- [ ] Attendance history shows all records
- [ ] Notifications appear and mark as read
- [ ] Pull-to-refresh works on all screens
- [ ] Logout works properly
- [ ] Non-students are blocked from access

## Development Tips

1. **Use Expo Go for rapid development** - No need to build until production
2. **Test on real device** - Better than emulator for testing
3. **Check console logs** - Use `console.log()` liberally
4. **Monitor Firebase** - Watch Firestore and Auth in Firebase Console
5. **Use hot reload** - Save files to see changes instantly

## Next Steps

- [ ] Customize colors in styles
- [ ] Add profile picture upload
- [ ] Implement calendar view for attendance
- [ ] Add charts for statistics
- [ ] Enable biometric authentication
- [ ] Add dark mode support
- [ ] Implement offline mode with local storage

## Resources

- [Expo Documentation](https://docs.expo.dev)
- [React Navigation](https://reactnavigation.org)
- [Firebase React Native](https://rnfirebase.io)
- [Expo Notifications](https://docs.expo.dev/push-notifications/overview/)
