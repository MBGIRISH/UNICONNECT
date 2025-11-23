# 🔥 Deploy Firestore Rules - Fix Password Reset

## ⚠️ Issue Found

The password reset is failing because **Firestore rules require authentication**, but users requesting password reset **aren't authenticated yet**!

## ✅ Solution

I've updated the Firestore rules to allow writes to `passwordResetCodes` collection for unauthenticated users.

---

## 🚀 Deploy Updated Rules

### Option 1: Using Firebase CLI (Recommended)

```bash
cd /Users/mbgirish/UNI-CONNECT
firebase deploy --only firestore:rules
```

If you haven't logged in:
```bash
firebase login
firebase deploy --only firestore:rules
```

### Option 2: Manual Deployment (If CLI doesn't work)

1. **Go to Firebase Console:**
   - https://console.firebase.google.com/project/campus-connect-fd225/firestore/rules

2. **Copy the updated rules:**
   - Open `firestore.rules` file in your project
   - Copy ALL the contents

3. **Paste in Firebase Console:**
   - Delete the old rules
   - Paste the new rules
   - Click **"Publish"**

---

## 📋 Updated Rules

The new rules allow:
- ✅ **Anyone** can write to `passwordResetCodes` (needed for password reset)
- ✅ **Only authenticated users** can read from `passwordResetCodes` (security)
- ✅ **All other collections** require authentication (as before)

---

## ✅ After Deploying

1. **Test password reset again:**
   - Go to login page
   - Click "Forgot password?"
   - Enter email
   - Should work now!

2. **Check browser console (F12):**
   - Should see: "Verification code generated and stored: [code]"
   - No more "Failed to generate reset code" error

---

## 🎯 Quick Deploy Command

```bash
cd /Users/mbgirish/UNI-CONNECT && firebase deploy --only firestore:rules
```

**After deploying, the password reset will work!** 🎉

