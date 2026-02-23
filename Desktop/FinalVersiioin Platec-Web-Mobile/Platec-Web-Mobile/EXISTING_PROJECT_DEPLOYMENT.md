# Deployment Guide for Existing Project

## ⚠️ IMPORTANT: You Already Have a Firebase Project

Since you already have a Firebase project set up, **DO NOT run `firebase init` again** - it will overwrite your existing files!

Instead, follow these steps:

---

## Step 1: Extract the New System

1. Extract `attendance-system.zip` to a **new folder** (not your current project)
2. You'll have a folder like: `Downloads/attendance-system/`

---

## Step 2: Copy Files to Your Current Project

### A. Copy Cloud Functions

```bash
# From the NEW attendance-system folder, copy functions
cp -r attendance-system/functions/ your-current-project/

# Or manually copy these files:
# - functions/index.js
# - functions/package.json
```

### B. Update Your Firestore Rules

```bash
# Replace your current firestore.rules with the new one
cp attendance-system/firestore.rules your-current-project/

# Or manually copy the contents from:
# - attendance-system/firestore.rules
# To your existing firestore.rules file
```

### C. Update Web App Files

**Option 1: Replace entire web folder** (Recommended for clean start)
```bash
# Backup your old web folder first!
mv your-current-project/web your-current-project/web-old

# Copy new web folder
cp -r attendance-system/web/ your-current-project/
```

**Option 2: Copy specific files** (If you want to keep some of your code)
```bash
# Copy only the new/fixed files:
cp attendance-system/web/src/services/firebase.js your-current-project/web/src/services/
cp attendance-system/web/src/pages/TeacherDashboard.jsx your-current-project/web/src/pages/
cp attendance-system/web/src/pages/AdminDashboard.jsx your-current-project/web/src/pages/
cp attendance-system/web/src/pages/AttendanceReport.jsx your-current-project/web/src/pages/
cp attendance-system/web/src/pages/UserManagement.jsx your-current-project/web/src/pages/
cp attendance-system/web/src/App.jsx your-current-project/web/src/
```

---

## Step 3: Update Your Firebase Config

**VERY IMPORTANT:** Use your existing Firebase config!

1. Open `your-current-project/firebase/firebaseConfig.js` (or wherever you store it)
2. Make sure it has your actual Firebase credentials:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyAQzmlodRcsgNNcnnMw3-a80m86uaDJ6mA",
  authDomain: "attendance-management-b06ff.firebaseapp.com",
  projectId: "attendance-management-b06ff",
  storageBucket: "attendance-management-b06ff.firebasestorage.app",
  messagingSenderId: "979822571491",
  appId: "1:979822571491:web:86f12d24e4023b0d90bad6",
  measurementId: "G-EFBLYX1882"
};
```

3. **DO NOT** use the placeholder config from the new system!

---

## Step 4: Install Cloud Functions Dependencies

```bash
cd your-current-project/functions
npm install
cd ..
```

---

## Step 5: Deploy Firestore Rules

```bash
# Make sure you're in your project directory
firebase deploy --only firestore:rules
```

You should see:
```
✔  firestore: rules file firestore.rules compiled successfully
✔  firestore: released rules firestore.rules to cloud.firestore
```

---

## Step 6: Deploy Cloud Functions

```bash
firebase deploy --only functions
```

You should see:
```
✔  functions[createUser(us-central1)] Successful create operation.
✔  functions[onAttendanceMarked(us-central1)] Successful create operation.
```

---

## Step 7: Install Web Dependencies

```bash
cd web
npm install
```

This will install all the new packages including:
- `firebase` (already have it)
- `react-router-dom`
- `date-fns`
- And other dependencies

---

## Step 8: Test Web App Locally

```bash
npm run dev
```

Open `http://localhost:3000` and test:
1. Login as admin
2. Create a teacher
3. Logout and login as teacher
4. Create a student (**This should work without white screen!**)

---

## Step 9: (Optional) Setup Mobile App

```bash
cd ../mobile
npm install
npx expo start
```

---

## Troubleshooting

### Problem: "firebase.json already exists"

**Solution:** Update your existing `firebase.json` to include functions:

```json
{
  "firestore": {
    "rules": "firestore.rules"
  },
  "functions": [
    {
      "source": "functions",
      "codebase": "default",
      "ignore": [
        "node_modules",
        ".git",
        "firebase-debug.log",
        "firebase-debug.*.log"
      ]
    }
  ]
}
```

### Problem: "Module not found: firebase/functions"

**Solution:**
```bash
cd web
npm install firebase
```

### Problem: "Cloud Function not found"

**Solution:** Make sure you deployed functions:
```bash
firebase deploy --only functions
```

Check Firebase Console → Functions to verify deployment.

### Problem: Still getting white screen

**Check:**
1. Cloud Functions are deployed: `firebase functions:list`
2. Web app is using the new `firebase.js` service file
3. Browser console for errors (F12)

---

## File Checklist

After copying, you should have:

```
your-current-project/
├── firebase/
│   └── firebaseConfig.js         ← Your existing config (don't replace!)
├── functions/
│   ├── index.js                  ← NEW (with createUser function)
│   └── package.json              ← NEW
├── web/
│   ├── src/
│   │   ├── services/
│   │   │   └── firebase.js       ← UPDATED (uses Cloud Functions)
│   │   ├── pages/
│   │   │   ├── TeacherDashboard.jsx  ← UPDATED
│   │   │   ├── AdminDashboard.jsx    ← UPDATED
│   │   │   ├── AttendanceReport.jsx  ← NEW
│   │   │   └── UserManagement.jsx    ← NEW
│   │   └── App.jsx               ← UPDATED (new routes)
│   └── package.json
├── firestore.rules               ← UPDATED (strict security)
└── firebase.json                 ← Update to include functions
```

---

## Deployment Commands Summary

```bash
# 1. Install function dependencies
cd functions && npm install && cd ..

# 2. Deploy Firestore rules
firebase deploy --only firestore:rules

# 3. Deploy Cloud Functions
firebase deploy --only functions

# 4. Install web dependencies
cd web && npm install

# 5. Test locally
npm run dev

# 6. When ready, deploy web app (optional)
npm run build
cd ..
firebase deploy --only hosting
```

---

## Key Differences from Old System

### OLD (Causes White Screen):
```javascript
// In firebase.js
export const registerUser = async (email, password, name, role, createdBy) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  // ❌ This logs out the teacher!
}
```

### NEW (Fixed):
```javascript
// In firebase.js
export const createUser = async (email, password, name, role) => {
  const createUserFunction = httpsCallable(functions, 'createUser');
  const result = await createUserFunction({ email, password, name, role });
  // ✅ Cloud Function creates user, teacher stays logged in!
}
```

---

## Verification Steps

After deployment, verify:

1. **Cloud Functions deployed:**
   ```bash
   firebase functions:list
   ```
   Should show `createUser` and `onAttendanceMarked`

2. **Rules deployed:**
   - Go to Firebase Console → Firestore → Rules
   - Should see the new rules with role-based access

3. **Web app works:**
   - Login as teacher
   - Click "Add Student"
   - Fill form and submit
   - **NO WHITE SCREEN** ✅
   - Student appears in list

4. **Functions working:**
   - Firebase Console → Functions → Logs
   - Should see successful execution logs

---

## Need Help?

If you encounter any issues:

1. Check browser console (F12) for errors
2. Check Firebase Functions logs:
   ```bash
   firebase functions:log
   ```
3. Verify you're using the correct Firebase project:
   ```bash
   firebase use
   ```

---

## Summary

**DO NOT** run `firebase init` - it will erase your config!

**DO** this instead:
1. Copy new files to your existing project
2. Keep your existing `firebaseConfig.js`
3. Deploy functions and rules
4. Test!

Your white screen issue will be fixed! 🎉
