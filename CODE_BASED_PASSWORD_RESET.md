# 🔐 Code-Based Password Reset - Setup Guide

## ✅ What's Implemented

Your app now has a **code-based password reset system** that works as follows:

1. **User enters email** → System generates 6-digit code
2. **Code sent to email** → User receives code via EmailJS (or console in dev mode)
3. **User enters code** → System verifies code
4. **User enters new password** → Password is reset

---

## 🚀 How It Works

### Step 1: User Requests Reset
- User clicks "Forgot password?"
- Enters their registered email
- System generates 6-digit code
- Code stored in Firestore with 10-minute expiration

### Step 2: Code Sent to Email
- Code is sent via EmailJS (if configured)
- Or displayed in browser console (development mode)
- User receives code in their email inbox

### Step 3: User Verifies Code
- User enters 6-digit code
- System verifies code from Firestore
- Checks if code is expired or already used

### Step 4: User Sets New Password
- User enters new password
- Confirms password
- System resets password using Firebase

---

## 📧 EmailJS Setup (Optional but Recommended)

EmailJS allows sending emails directly from the browser without a backend.

### Step 1: Create EmailJS Account

1. Go to: https://www.emailjs.com/
2. Sign up for free account (200 emails/month free)
3. Verify your email

### Step 2: Create Email Service

1. Go to **Email Services** → **Add New Service**
2. Choose your email provider (Gmail, Outlook, etc.)
3. Connect your email account
4. Copy the **Service ID**

### Step 3: Create Email Template

1. Go to **Email Templates** → **Create New Template**
2. Use this template:

```
Subject: UniConnect Password Reset Code

Hello,

You requested a password reset for your UniConnect account.

Your verification code is: {{reset_code}}

This code will expire in 10 minutes.

If you didn't request this, please ignore this email.

Thanks,
UniConnect Team
```

3. Set variables:
   - `{{reset_code}}` → Maps to `reset_code` in code
   - `{{to_email}}` → Maps to `to_email` in code

4. Copy the **Template ID**

### Step 4: Get Public Key

1. Go to **Account** → **General**
2. Copy your **Public Key**

### Step 5: Configure in App

Create a `.env` file in your project root:

```env
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TEMPLATE_ID=your_template_id
VITE_EMAILJS_PUBLIC_KEY=your_public_key
```

### Step 6: Restart Dev Server

```bash
npm run dev
```

---

## 🧪 Testing Without EmailJS

If EmailJS is not configured, the code will be:
- **Logged to browser console** (for development)
- **Stored in Firestore** (for verification)

To test:
1. Open browser console (F12)
2. Request password reset
3. Check console for the code
4. Enter code in the app

---

## 🔧 How to Use

### For Users:

1. Click **"Forgot password?"** on login page
2. Enter your registered email
3. Click **"Send Verification Code"**
4. Check your email for 6-digit code
5. Enter code in the app
6. Enter new password
7. Confirm password
8. Click **"Reset Password"**

### For Developers:

**Check Firestore:**
- Collection: `passwordResetCodes`
- Document ID: `{email}`
- Fields:
  - `code`: 6-digit code
  - `email`: User's email
  - `createdAt`: Timestamp
  - `expiresAt`: Timestamp (10 minutes)
  - `used`: Boolean

**Check Console:**
- Code is logged when EmailJS is not configured
- Look for: `Verification code generated: XXXXXX`

---

## ⚠️ Important Notes

1. **Code Expiration**: Codes expire after 10 minutes
2. **One-Time Use**: Each code can only be used once
3. **Email Required**: Email must be registered in Firebase Auth
4. **Security**: Codes are stored in Firestore with expiration
5. **Rate Limiting**: Firebase has rate limits on password reset emails

---

## 🐛 Troubleshooting

### Code Not Received

1. **Check Spam Folder**: Email might be in spam
2. **Check Console**: Code might be in browser console
3. **Verify EmailJS**: Check EmailJS configuration
4. **Check Firestore**: Verify code exists in Firestore

### Code Invalid/Expired

1. **Request New Code**: Codes expire after 10 minutes
2. **Check Firestore**: Verify code hasn't been used
3. **Clear Old Codes**: Delete expired codes from Firestore

### EmailJS Not Working

1. **Check API Keys**: Verify all keys are correct
2. **Check Template**: Verify template variables match
3. **Check Service**: Verify email service is connected
4. **Check Limits**: Free tier has 200 emails/month

---

## 📝 Code Flow

```
User Request
    ↓
Generate Code (6 digits)
    ↓
Store in Firestore (10 min expiry)
    ↓
Send via EmailJS (or console)
    ↓
User Enters Code
    ↓
Verify Code (check Firestore)
    ↓
User Enters New Password
    ↓
Reset Password (Firebase)
    ↓
Success!
```

---

## ✅ Features

- ✅ 6-digit verification code
- ✅ 10-minute expiration
- ✅ One-time use codes
- ✅ EmailJS integration
- ✅ Firestore storage
- ✅ Secure verification
- ✅ Multi-step UI
- ✅ Error handling
- ✅ Success messages

---

## 🎯 Next Steps

1. **Set up EmailJS** (optional but recommended)
2. **Test the flow** with a registered email
3. **Check Firestore** to see codes being stored
4. **Monitor email delivery** in EmailJS dashboard

---

**Last Updated:** November 22, 2025

