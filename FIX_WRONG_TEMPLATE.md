# 🔧 Fix: Wrong Email Template Being Used

## ⚠️ Problem

You're receiving the **"Contact Us"** template email instead of the **"Password Reset"** template!

**Current Template ID:** `template_gmmzgxd` (This is the Contact Us template)

---

## ✅ Solution

You need to use the **Password Reset** template ID, not the Contact Us template.

---

## 🔍 Step 1: Find Your Password Reset Template ID

1. **Go to EmailJS Dashboard:**
   - https://dashboard.emailjs.com/admin/template

2. **Look for "Password Reset" template:**
   - You should see it in the list
   - It should have the content with `{{reset_code}}`

3. **Copy the Template ID:**
   - It will look like: `template_xxxxx`
   - It's different from `template_gmmzgxd`

---

## 🔍 Step 2: If You Don't Have Password Reset Template

If you only see "Contact Us" template, you need to create the Password Reset template:

1. **Click "Create New Template"**
2. **Select "Password Reset" or "One-Time Password"**
3. **Edit the template** with this content:

```
Subject: UniConnect Password Reset Code

You have requested a password change

We received a request to reset the password for your account.

Your verification code is: {{reset_code}}

This code will expire in 10 minutes.

If you didn't request this password reset, please ignore this email or let us know immediately. Your account remains secure.

Best regards,
UniConnect Team

The email was sent to {{to_email}}
You received this email because you are registered with UniConnect
```

4. **Save the template**
5. **Copy the NEW Template ID**

---

## 🔧 Step 3: Update .env File

Once you have the correct Password Reset template ID:

1. **Open `.env` file**
2. **Replace the Template ID:**

```env
VITE_EMAILJS_SERVICE_ID=service_l08krpg
VITE_EMAILJS_TEMPLATE_ID=your_password_reset_template_id_here  ← Change this!
VITE_EMAILJS_PUBLIC_KEY=Np1nLzp3Vnzrgu1Au
```

3. **Save the file**
4. **Server will auto-restart**

---

## 🎯 Quick Checklist

- [ ] Go to EmailJS → Email Templates
- [ ] Find "Password Reset" template (or create it)
- [ ] Copy the Template ID
- [ ] Update `.env` file with correct Template ID
- [ ] Test password reset again

---

## ⚠️ Important

**Current Issue:**
- Using: `template_gmmzgxd` (Contact Us template) ❌
- Should use: Password Reset template ID ✅

**The Contact Us template doesn't have `{{reset_code}}` variable, so it won't show the code!**

---

**After updating the template ID, your password reset emails will show the 6-digit code correctly!** 🎉

