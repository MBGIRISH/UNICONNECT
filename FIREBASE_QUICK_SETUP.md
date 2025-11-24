# ⚡ Firebase Quick Setup for Password Reset

## 🚀 Quick Steps (5 minutes)

### 1. Deploy Firestore Rules

**Option A: Using Script (Easiest)**
```bash
cd /Users/mbgirish/UNI-CONNECT
./deploy-firebase-rules.sh
```

**Option B: Using Firebase CLI**
```bash
cd /Users/mbgirish/UNI-CONNECT
firebase login
firebase deploy --only firestore:rules
```

**Option C: Manual (If CLI doesn't work)**
1. Go to: https://console.firebase.google.com/project/campus-connect-fd225/firestore/rules
2. Copy contents from `firestore.rules` file
3. Paste and click **"Publish"**

---

### 2. Enable Email/Password Authentication

1. Go to: https://console.firebase.google.com/project/campus-connect-fd225/authentication/providers
2. Click **"Email/Password"**
3. Toggle **"Enable"** to ON
4. Click **"Save"**

---

### 3. Verify Password Reset Email

1. Go to: https://console.firebase.google.com/project/campus-connect-fd225/authentication/emails
2. Click **"Password reset"**
3. Verify it's enabled (should be by default)

---

## ✅ That's It!

Your Firebase is now configured for password reset. The Firestore rules are already correct in your code - you just need to deploy them.

---

## 🧪 Test It

1. Request password reset
2. Click Firebase email link
3. Enter EmailJS code
4. Enter new password
5. Should redirect to login
6. Sign in with new password → Works!

---

## 📝 Current Configuration

**✅ Firestore Rules:** Correct (just needs deployment)
**✅ Authentication:** Enable Email/Password in console
**✅ Email Template:** Auto-configured by Firebase
**✅ Security:** Properly set up

**Everything is ready!**

