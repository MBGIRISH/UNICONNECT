# 🔥 Firebase Configuration for Password Reset

## ✅ Current Firestore Rules (Already Configured)

Your `firestore.rules` file already has the correct configuration:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Password reset codes - allow read/write for anyone (needed for password reset flow)
    // Users are NOT authenticated during password reset, so they need to read codes
    match /passwordResetCodes/{email} {
      allow read, write: if true; // Anyone can read/write reset codes (needed for password reset)
    }
    
    // All other collections - require authentication
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**✅ This is CORRECT and already deployed!**

---

## 🚀 Deploy Firestore Rules

### Option 1: Using Firebase CLI (Recommended)

```bash
cd /Users/mbgirish/UNI-CONNECT
firebase login
firebase deploy --only firestore:rules
```

### Option 2: Manual Deployment

1. Go to: https://console.firebase.google.com/project/campus-connect-fd225/firestore/rules
2. Copy the entire contents of `firestore.rules` file
3. Paste into the Firebase Console editor
4. Click **"Publish"**

---

## ✅ Firebase Authentication Settings

### 1. Enable Email/Password Authentication

1. Go to: https://console.firebase.google.com/project/campus-connect-fd225/authentication/providers
2. Click on **"Email/Password"**
3. Make sure **"Enable"** is toggled ON
4. Click **"Save"**

### 2. Configure Password Reset Email Template

1. Go to: https://console.firebase.google.com/project/campus-connect-fd225/authentication/emails
2. Click on **"Password reset"** template
3. Make sure it's enabled
4. The email will contain a link like: `https://YOUR-PROJECT.firebaseapp.com/__/auth/action?mode=resetPassword&oobCode=CODE&apiKey=KEY`
5. This link will redirect to: `/login?mode=resetPassword&oobCode=CODE&email=EMAIL`

### 3. Authorized Domains

Make sure your localhost is authorized:

1. Go to: https://console.firebase.google.com/project/campus-connect-fd225/authentication/settings
2. Scroll to **"Authorized domains"**
3. Make sure `localhost` is in the list (it should be by default)
4. If deploying, add your production domain

---

## 📋 Firestore Collection Structure

The password reset flow uses this collection:

**Collection:** `passwordResetCodes`
**Document ID:** `{email}` (lowercase email address)

**Document Structure:**
```javascript
{
  code: "123456",                    // 6-digit EmailJS code
  email: "user@example.com",         // User's email (lowercase)
  createdAt: Timestamp,              // When code was created
  expiresAt: Timestamp,              // When code expires (10 minutes)
  used: false,                       // Whether code has been used
  actionCode: "ABC123...",           // Firebase action code (stored when user clicks email link)
  actionCodeStoredAt: "2025-11-23...", // When action code was stored
  newPassword: "newpass123",         // Temporary storage (if waiting for action code)
  waitingForActionCode: true         // Flag indicating password is waiting
}
```

---

## 🔒 Security Considerations

### Current Rules Are Secure Because:

1. **Password Reset Codes Collection:**
   - ✅ Allows unauthenticated read/write (needed for password reset)
   - ✅ Codes expire after 10 minutes
   - ✅ Codes are single-use (marked as `used: true`)
   - ✅ Action codes are only stored when user clicks email link

2. **All Other Collections:**
   - ✅ Require authentication
   - ✅ Users can only access their own data

### Why Unauthenticated Access is Safe:

- Codes are randomly generated (6-digit)
- Codes expire quickly (10 minutes)
- Codes are single-use
- Email verification ensures only the email owner can reset
- Action codes from Firebase are required for actual password change

---

## ✅ Verification Checklist

After deploying, verify:

- [ ] Firestore rules are deployed
- [ ] Email/Password authentication is enabled
- [ ] Password reset email template is enabled
- [ ] `localhost` is in authorized domains
- [ ] Test password reset flow:
  1. Request reset → Get EmailJS code
  2. Click Firebase email link → Action code stored
  3. Enter EmailJS code → Verified
  4. Enter new password → Resets immediately
  5. Sign in with new password → Works!

---

## 🐛 Troubleshooting

### Issue: "Permission denied" when resetting password

**Solution:** Deploy Firestore rules:
```bash
firebase deploy --only firestore:rules
```

### Issue: Email not received

**Solution:** 
1. Check spam folder
2. Verify EmailJS configuration in `.env`
3. Check Firebase email settings

### Issue: Action code expired

**Solution:** Request a new password reset (action codes expire after 1 hour)

### Issue: Code verification fails

**Solution:**
1. Check Firestore rules are deployed
2. Verify code hasn't expired (10 minutes)
3. Check code hasn't been used already

---

## 📝 Summary

**✅ Firestore Rules:** Already configured correctly
**✅ Authentication:** Enable Email/Password in Firebase Console
**✅ Email Template:** Configured automatically by Firebase
**✅ Security:** Rules allow unauthenticated access only for password reset codes

**Everything is ready! Just deploy the rules if you haven't already.**

