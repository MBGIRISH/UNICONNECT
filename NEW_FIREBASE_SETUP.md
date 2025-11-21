# 🚀 NEW FIREBASE PROJECT SETUP GUIDE

**Project:** campus-connect-fd225  
**Updated:** November 21, 2025

Your app has been updated to use the new Firebase project. Follow these steps to complete the setup:

---

## ✅ STEP 1: Enable Firebase Authentication

1. Go to: https://console.firebase.google.com/project/campus-connect-fd225/authentication/providers
2. Click **"Get started"** (if you see it)
3. Enable **Email/Password**:
   - Click on "Email/Password"
   - Toggle **Enable** to ON
   - Click **Save**
4. Enable **Google Sign-In**:
   - Click on "Google"
   - Toggle **Enable** to ON
   - Click **Save**

---

## ✅ STEP 2: Create Firestore Database

1. Go to: https://console.firebase.google.com/project/campus-connect-fd225/firestore
2. Click **"Create database"**
3. Select **"Start in test mode"** (for development)
4. Choose a location (e.g., `asia-south1` for India)
5. Click **"Enable"**
6. Wait 1-2 minutes for provisioning to complete

---

## ✅ STEP 3: Enable Cloud Storage

1. Go to: https://console.firebase.google.com/project/campus-connect-fd225/storage
2. Click **"Get started"**
3. Click **"Next"** to accept the default security rules
4. Choose the same location as Firestore (e.g., `asia-south1`)
5. Click **"Done"**

---

## ✅ STEP 4: Deploy Security Rules

### Option A: Using Firebase CLI (Recommended)

```bash
cd /Users/mbgirish/UNI-CONNECT
firebase login
firebase deploy --only firestore:rules,storage
```

### Option B: Manual Deployment (if CLI fails)

**For Firestore Rules:**
1. Go to: https://console.firebase.google.com/project/campus-connect-fd225/firestore/rules
2. Copy the contents from `firestore.rules` in your project
3. Paste into the editor
4. Click **"Publish"**

**For Storage Rules:**
1. Go to: https://console.firebase.google.com/project/campus-connect-fd225/storage/rules
2. Copy the contents from `storage.rules` in your project
3. Paste into the editor
4. Click **"Publish"**

---

## ✅ STEP 5: Run Your Application

```bash
cd /Users/mbgirish/UNI-CONNECT
npm run dev
```

Open http://localhost:5173 in your browser.

---

## 🎯 Quick Test Checklist

After completing the above steps:

- [ ] Sign up with email/password works
- [ ] Login works
- [ ] Profile page shows your data (not "Alex Johnson")
- [ ] Create a post (with or without image)
- [ ] Create an event
- [ ] Create a marketplace listing
- [ ] Join/create a study group

---

## 🔧 Troubleshooting

### "Auth operation not allowed"
→ Enable Email/Password in Authentication (Step 1)

### "Permission denied" errors
→ Deploy security rules (Step 4)

### "Storage bucket not found"
→ Enable Cloud Storage (Step 3)

### App not loading/blank page
→ Make sure `npm run dev` is running without errors

---

## 📝 Summary

**What Changed:**
- ✅ Firebase config updated to `campus-connect-fd225`
- ✅ CLI config (`.firebaserc`) updated
- ✅ All code already wired to Firebase services

**What You Need To Do:**
1. Enable Authentication (2 minutes)
2. Create Firestore database (2 minutes)
3. Enable Storage (1 minute)
4. Deploy rules (1 minute)
5. Run the app!

**Total Setup Time:** ~6 minutes

---

Good luck! 🎉

