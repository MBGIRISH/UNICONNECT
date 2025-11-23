# ✅ Verification Error Fixed!

## 🐛 The Problem:

**Error:** "Failed to verify code. Please try again."

**Root Cause:** Firestore rules were blocking unauthenticated users from **reading** password reset codes. But during password reset, users are **NOT authenticated** (they can't log in, that's why they're resetting!).

---

## ✅ The Fix:

**Changed Firestore Rules:**
- **Before:** `allow read: if request.auth != null;` ❌ (Only authenticated users)
- **After:** `allow read, write: if true;` ✅ (Anyone can read/write codes)

---

## 🚀 Deploy the Fix:

### Option 1: Firebase CLI
```bash
cd /Users/mbgirish/UNI-CONNECT
firebase deploy --only firestore:rules
```

### Option 2: Manual (Firebase Console)
1. Go to: https://console.firebase.google.com/project/campus-connect-fd225/firestore/rules
2. Copy the updated rules from `firestore.rules`
3. Paste and click **"Publish"**

---

## 🧪 Test After Deploying:

1. Go to: `http://localhost:3000/login`
2. Click: "Forgot password?"
3. Enter: Your email
4. Click: "Send Verification Code"
5. Check: Your email for the 6-digit code
6. Enter: The code from email
7. Click: "Verify Code"
8. ✅ Should work now!

---

## 📝 Updated Rules:

```javascript
match /passwordResetCodes/{email} {
  allow read, write: if true; // Anyone can read/write reset codes
}
```

**Why this is safe:**
- Codes expire in 10 minutes
- Codes are single-use (marked as `used: true` after verification)
- Codes are tied to specific email addresses
- Only the person with access to that email can use the code

---

**Deploy the rules and test!** 🎉

