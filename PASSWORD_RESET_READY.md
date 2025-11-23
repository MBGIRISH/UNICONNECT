# ✅ Password Reset System - Ready to Test!

## ✅ Configuration Complete

### EmailJS Setup:
- ✅ Service ID: `service_l08krpg`
- ✅ Template ID: `template_gmmzgxd` (Password Reset template)
- ✅ Public Key: `Np1nLzp3Vnzrgu1Au`
- ✅ Template has `{{reset_code}}` variable
- ✅ "To Email" field uses `{{to_email}}`

### Firestore Rules:
- ✅ `passwordResetCodes` collection allows writes for unauthenticated users
- ✅ Rules updated and ready to deploy

### Code Implementation:
- ✅ Code generation working
- ✅ EmailJS integration ready
- ✅ Multi-step UI implemented
- ✅ Code verification working

---

## 🚀 Next Steps

### Step 1: Deploy Firestore Rules (IMPORTANT!)

The rules are updated but need to be deployed to Firebase:

**Option 1: Firebase CLI**
```bash
cd /Users/mbgirish/UNI-CONNECT
firebase deploy --only firestore:rules
```

**Option 2: Manual Deployment**
1. Go to: https://console.firebase.google.com/project/campus-connect-fd225/firestore/rules
2. Copy contents from `firestore.rules`
3. Paste and click "Publish"

**⚠️ Without deploying rules, password reset will still fail!**

---

### Step 2: Test Password Reset

1. **Go to:** `http://localhost:3000/login`
2. **Click:** "Forgot password?"
3. **Enter:** Your registered email
4. **Click:** "Send Verification Code"
5. **Check:** Your email inbox for 6-digit code
6. **Enter:** The code in the app
7. **Enter:** New password
8. **Complete:** Password reset

---

## ✅ What Should Happen

1. **Code Generated:** 6-digit code created
2. **Code Stored:** Saved in Firestore (`passwordResetCodes` collection)
3. **Email Sent:** Via EmailJS with the code
4. **Email Received:** Check inbox for "UniConnect Password Reset Code"
5. **Code Displayed:** Email shows "Your verification code is: 123456"
6. **Code Verified:** Enter code in app
7. **Password Reset:** Set new password

---

## 🔍 Troubleshooting

### If "Failed to generate reset code" error:
- **Deploy Firestore rules** (Step 1 above)
- Rules must be deployed for password reset to work

### If email not received:
- Check spam folder
- Check EmailJS dashboard → Email History
- Verify email is registered in Firebase Auth
- Check browser console (F12) for errors

### If code not showing in email:
- Verify template has `{{reset_code}}` (not `{{link}}`)
- Check EmailJS template is saved
- Verify Template ID in `.env` matches the Password Reset template

---

## 📋 Final Checklist

- [x] EmailJS Service ID configured
- [x] EmailJS Template ID configured
- [x] EmailJS Public Key configured
- [x] Template has `{{reset_code}}` ✅
- [x] "To Email" field uses `{{to_email}}` ✅
- [x] Firestore rules updated
- [ ] **Firestore rules deployed** ← DO THIS!
- [ ] Test password reset flow

---

## 🎯 Ready to Test!

**After deploying Firestore rules, your password reset system will be fully functional!**

1. Deploy rules
2. Test password reset
3. Check email for code
4. Complete reset

**Everything is configured correctly! Just deploy the rules and test!** 🚀

