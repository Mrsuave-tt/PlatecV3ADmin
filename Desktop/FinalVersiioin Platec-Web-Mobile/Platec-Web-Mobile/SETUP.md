# Complete Setup Guide

## Step-by-Step Instructions

### 1. Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add Project" or select existing project
3. Project name: `attendance-management` (or your choice)
4. Enable Google Analytics (optional)
5. Click "Create Project"

### 2. Enable Firebase Services

#### Authentication
1. In Firebase Console → Authentication
2. Click "Get Started"
3. Enable "Email/Password" sign-in method
4. Save

#### Firestore Database
1. In Firebase Console → Firestore Database
2. Click "Create Database"
3. Start in **Production mode**
4. Choose location closest to your users
5. Click "Enable"

### 3. Get Firebase Configuration

1. In Firebase Console → Project Settings (gear icon)
2. Scroll to "Your apps" section
3. Click Web icon (</>) to add web app
4. Register app with nickname: "Attendance Web"
5. Copy the `firebaseConfig` object
6. Paste it into `firebase/firebaseConfig.js`

### 4. Install Dependencies

```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in project root
cd attendance-system
firebase use --add
# Select your project from the list
```

### 5. Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

### 6. Deploy Cloud Functions

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

Wait for deployment to complete. You should see:
```
✔ functions[createUser]: Successful create operation
✔ functions[onAttendanceMarked]: Successful create operation
```

### 7. Setup Web App

```bash
cd web
npm install
npm run dev
```

The app should open at `http://localhost:3000`

### 8. Create Initial Admin Account

You need to manually create the first admin account:

#### Method 1: Firebase Console (Recommended)
1. Go to Firebase Console → Authentication
2. Click "Add User"
3. Email: `admin@example.com`
4. Password: `admin123` (or your choice)
5. Click "Add User"
6. Copy the User UID

7. Go to Firestore Database
8. Click "Start Collection"
9. Collection ID: `users`
10. Click "Next"
11. Document ID: [paste the User UID you copied]
12. Add fields:
    - `name` (string): "Admin"
    - `email` (string): "admin@example.com"
    - `role` (string): "admin"
    - `createdBy` (null): null
    - `createdAt` (timestamp): [current time]
13. Click "Save"

#### Method 2: Using Firebase CLI (Advanced)
```bash
# In project root
firebase auth:import initial-users.json
```

Where `initial-users.json` contains:
```json
{
  "users": [
    {
      "localId": "admin-uid-here",
      "email": "admin@example.com",
      "passwordHash": "...",
      "displayName": "Admin"
    }
  ]
}
```

Then add the user document in Firestore as described in Method 1.

### 9. Test the Application

1. Open `http://localhost:3000`
2. Login with admin credentials:
   - Email: `admin@example.com`
   - Password: `admin123`
3. You should be redirected to Admin Dashboard

### 10. Create Your First Teacher

1. In Admin Dashboard, click "Create User"
2. Fill in:
   - Name: "John Teacher"
   - Email: "teacher@example.com"
   - Password: "teacher123"
   - Role: "Teacher"
3. Click "Create User"

### 11. Create Your First Student

1. Logout from admin account
2. Login as teacher:
   - Email: `teacher@example.com`
   - Password: `teacher123`
3. Click "Add Student"
4. Fill in student details
5. Click "Add Student"

### 12. Mark Attendance

1. Still logged in as teacher
2. Click "Mark Attendance"
3. Select a student
4. Choose status (Present/Absent/Late)
5. Click "Mark Attendance"

## Troubleshooting

### "createUser is not a function"
- Make sure Cloud Functions are deployed: `firebase deploy --only functions`
- Check Firebase Console → Functions to verify deployment

### "Permission denied" errors
- Ensure Firestore rules are deployed: `firebase deploy --only firestore:rules`
- Check that user role is set correctly in Firestore

### White screen after creating student (as teacher)
- This is fixed in the new system! The Cloud Function handles user creation
- Teacher stays logged in

### Cannot see students in teacher dashboard
- Verify the student's `createdBy` field matches teacher's UID
- Check Firestore rules are deployed

### Functions not working locally
```bash
# Test functions locally
firebase emulators:start
```

## Production Deployment

### Deploy to Firebase Hosting

```bash
# Build web app
cd web
npm run build

# Deploy
cd ..
firebase deploy --only hosting
```

Your app will be live at: `https://your-project-id.web.app`

## Environment Variables (Optional)

For production, you may want to use different Firebase projects:

1. Create `.env.development` and `.env.production`
2. Add Firebase configs for each environment
3. Update build scripts in `package.json`

## Next Steps

- Add mobile app setup (React Native)
- Implement push notifications
- Add attendance reports
- Create user management page
- Add profile editing
- Implement password reset

## Support

- Firebase Docs: https://firebase.google.com/docs
- React Router: https://reactrouter.com
- Vite: https://vitejs.dev

## Common Commands

```bash
# Start web dev server
cd web && npm run dev

# Deploy everything
firebase deploy

# Deploy only functions
firebase deploy --only functions

# Deploy only Firestore rules
firebase deploy --only firestore:rules

# View logs
firebase functions:log

# Test locally with emulators
firebase emulators:start
```
