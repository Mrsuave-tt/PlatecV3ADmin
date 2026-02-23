# Attendance Management System

A complete attendance management system with role-based access control.

## Architecture
- **Web App** (React + Vite): Admin & Teacher dashboards
- **Mobile App** (React Native + Expo): Student attendance viewing
- **Backend**: Firebase (Auth + Firestore + Cloud Functions)

## Roles & Permissions

### Admin
- Create teachers and students
- View and manage ALL users
- View all attendance records
- Generate reports

### Teacher
- Create students (students will be linked to them)
- Mark attendance ONLY for their students
- View reports for their students
- Send notifications to their students

### Student
- View their own attendance history
- View notifications
- Read-only access

## Setup Instructions

### 1. Firebase Setup
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Create a new Firebase project at https://console.firebase.google.com

# Initialize Firebase in this project
firebase init
# Select: Firestore, Functions, Hosting (optional)
```

### 2. Configure Firebase
1. Go to Firebase Console → Project Settings
2. Add a Web App and copy the config
3. Paste config into `firebase/firebaseConfig.js`
4. Enable Authentication → Email/Password
5. Create Firestore database

### 3. Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### 4. Deploy Cloud Functions
```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

### 5. Web App Setup
```bash
cd web
npm install
npm run dev
```

### 6. Mobile App Setup
```bash
cd mobile
npm install
npx expo start
```

## Default Admin Account
After deploying, create an admin account manually in Firebase Console:
1. Authentication → Add User
2. Email: admin@example.com / Password: admin123
3. Firestore → users collection → Create document with Auth UID
   ```json
   {
     "name": "Admin",
     "email": "admin@example.com",
     "role": "admin",
     "createdBy": null,
     "createdAt": <current timestamp>
   }
   ```

## Tech Stack
- **Frontend**: React 18, React Router v6, Tailwind CSS
- **Mobile**: React Native, Expo
- **Backend**: Firebase Auth, Firestore, Cloud Functions
- **State Management**: React Context API

## Features
✅ Role-based authentication
✅ Student creation by teachers
✅ Real-time attendance marking
✅ Attendance reports
✅ Push notifications
✅ Secure Firestore rules

## Security
- All routes are protected based on user role
- Firestore security rules enforce data access
- Teachers can only access their own students
- Students can only view their own data
