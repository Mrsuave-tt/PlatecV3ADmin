# Quick Reference Guide

## Project Structure

```
attendance-system/
├── firebase/
│   ├── firebaseConfig.js         # Firebase configuration (ADD YOUR CONFIG HERE)
│   └── helpers.js                # Shared utility functions (TODO)
├── functions/
│   ├── index.js                  # Cloud Functions (createUser, onAttendanceMarked)
│   └── package.json
├── web/
│   ├── src/
│   │   ├── components/
│   │   │   └── ProtectedRoute.jsx
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   └── TeacherDashboard.jsx
│   │   ├── services/
│   │   │   └── firebase.js       # All Firebase operations
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── firestore.rules                # Security rules
├── firebase.json                  # Firebase config
├── SETUP.md                       # Detailed setup guide
└── README.md                      # Project overview
```

## Key Files to Edit

### 1. `firebase/firebaseConfig.js` ⚠️ MUST EDIT
```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",           // ← Get from Firebase Console
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  // ... rest of config
};
```

### 2. `firestore.rules` ✅ Already configured
Contains security rules for:
- Admin: Full access
- Teacher: Access to their students
- Student: Read-only their data

### 3. `functions/index.js` ✅ Already configured
Two Cloud Functions:
- `createUser`: Creates users without logging out current user
- `onAttendanceMarked`: Auto-creates notifications

## User Roles & Permissions

| Action | Admin | Teacher | Student |
|--------|-------|---------|---------|
| Create Admin | ✅ | ❌ | ❌ |
| Create Teacher | ✅ | ❌ | ❌ |
| Create Student | ✅ | ✅ | ❌ |
| View All Users | ✅ | ❌ | ❌ |
| View Their Students | - | ✅ | ❌ |
| Mark Attendance | ✅ | ✅ (own students) | ❌ |
| View All Attendance | ✅ | ❌ | ❌ |
| View Own Attendance | - | - | ✅ |
| Send Notifications | ✅ | ✅ (to own students) | ❌ |

## Database Schema

### users/{userId}
```javascript
{
  name: "John Doe",
  email: "john@example.com",
  role: "admin" | "teacher" | "student",
  createdBy: "teacherUID" | null,  // null for admin/teachers
  createdAt: timestamp
}
```

### attendance/{docId}
```javascript
{
  studentId: "studentUID",
  date: "2024-01-15",
  status: "present" | "absent" | "late",
  markedBy: "teacherUID",
  notes: "Optional notes",
  timestamp: timestamp
}
```

### notifications/{docId}
```javascript
{
  studentId: "studentUID",
  message: "You were marked absent",
  type: "attendance" | "general",
  date: timestamp,
  read: false
}
```

## Common Operations

### Creating a User (Admin/Teacher)
```javascript
import { createUser } from './services/firebase';

const result = await createUser(
  'student@example.com',
  'password123',
  'Student Name',
  'student'  // or 'teacher', 'admin'
);
```

### Marking Attendance
```javascript
import { markAttendance } from './services/firebase';

const result = await markAttendance(
  studentId,
  'present',  // or 'absent', 'late'
  teacherUID
);
```

### Getting Attendance Records
```javascript
import { getAttendanceRecords } from './services/firebase';

// All records
const result = await getAttendanceRecords();

// For specific student
const result = await getAttendanceRecords(studentId);

// Date range
const result = await getAttendanceRecords(studentId, '2024-01-01', '2024-01-31');
```

## Environment Setup

### Development
```bash
cd web
npm run dev
# Opens at http://localhost:3000
```

### Production Build
```bash
cd web
npm run build
# Creates web/dist/ folder
```

### Deploy
```bash
# Deploy everything
firebase deploy

# Deploy specific services
firebase deploy --only functions
firebase deploy --only firestore:rules
firebase deploy --only hosting
```

## Testing Credentials

After setup, you'll have:

**Admin**
- Email: admin@example.com
- Password: admin123

**Teacher** (created by admin)
- Email: teacher@example.com  
- Password: teacher123

**Student** (created by teacher)
- Email: student@example.com
- Password: student123

## Important Notes

⚠️ **Security**
- Never commit `firebaseConfig.js` with real credentials
- Always use environment variables in production
- Change default passwords immediately

⚠️ **Cloud Functions**
- Must be deployed for user creation to work
- Teachers cannot create students without Cloud Functions
- Check Firebase Console → Functions for errors

⚠️ **Firestore Rules**
- Must be deployed for security
- Test rules before production
- Students can only read their own data

## Troubleshooting Quick Fixes

### Problem: White screen after creating student
**Solution**: Cloud Functions fix this! Make sure they're deployed.

### Problem: Permission denied errors
**Solution**: Deploy Firestore rules
```bash
firebase deploy --only firestore:rules
```

### Problem: Cannot login
**Solution**: Check Firebase Console → Authentication to verify user exists

### Problem: Functions not working
**Solution**: Check function logs
```bash
firebase functions:log
```

## What's Next?

1. ✅ Basic authentication
2. ✅ Role-based access
3. ✅ Student creation (via Cloud Functions)
4. ✅ Attendance marking
5. ✅ Auto-notifications
6. ⏳ Mobile app (React Native)
7. ⏳ Attendance reports
8. ⏳ Push notifications (FCM)
9. ⏳ User management page
10. ⏳ Profile editing

## Support & Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [React Documentation](https://react.dev)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Cloud Functions Guide](https://firebase.google.com/docs/functions)
