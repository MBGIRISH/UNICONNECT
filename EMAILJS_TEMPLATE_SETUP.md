# 📧 EmailJS Template Setup - Quick Guide

## ✅ What You Need to Do

### Step 1: Select Template Type

In the modal you're seeing:

1. **Click on "Password Reset"** or **"One-Time Password"** template
   - These are closest to what we need
   - OR click **"Create Template"** to make a custom one

2. **If using pre-made template:**
   - Click "Password Reset" or "One-Time Password"
   - Click **"Create Template"** button (blue button at bottom right)

### Step 2: Customize the Template

After creating, you'll see the template editor. Make sure it includes:

**Subject Line:**
```
UniConnect Password Reset Code
```

**Email Body:**
```
Hello,

You requested a password reset for your UniConnect account.

Your verification code is: {{reset_code}}

This code will expire in 10 minutes.

If you didn't request this, please ignore this email.

Thanks,
UniConnect Team
```

### Step 3: Important - Template Variables

**CRITICAL:** Your template MUST include this variable:
- `{{reset_code}}` - This is where the 6-digit code will appear

**Optional variables you can use:**
- `{{to_email}}` - Recipient's email address
- `{{app_name}}` - Will show "UniConnect"

### Step 4: Save and Get Template ID

1. **Click "Save"** in the template editor
2. **Copy the Template ID** (it will look like `template_xxxxx`)
   - You'll see it in the URL or template settings
   - Example: `template_abc123xyz`

### Step 5: Add to .env File

Create or update your `.env` file:

```env
VITE_EMAILJS_SERVICE_ID=service_l08krpg
VITE_EMAILJS_TEMPLATE_ID=your_template_id_here
VITE_EMAILJS_PUBLIC_KEY=your_public_key_here
```

Replace `your_template_id_here` with the Template ID you copied.

---

## 🎯 Quick Checklist

- [ ] Selected "Password Reset" or "One-Time Password" template
- [ ] Clicked "Create Template"
- [ ] Added `{{reset_code}}` variable in the template body
- [ ] Saved the template
- [ ] Copied the Template ID
- [ ] Added Template ID to `.env` file
- [ ] Got Public Key from Account → General
- [ ] Added Public Key to `.env` file
- [ ] Restarted dev server (`npm run dev`)

---

## ⚠️ Common Mistakes

1. **Missing `{{reset_code}}` variable:**
   - ❌ Wrong: "Your code is: 123456"
   - ✅ Correct: "Your code is: {{reset_code}}"

2. **Wrong variable name:**
   - ❌ Wrong: `{{code}}` or `{{resetCode}}`
   - ✅ Correct: `{{reset_code}}` (exact match)

3. **Not restarting server:**
   - After creating `.env`, you MUST restart the dev server

---

## 🧪 Test Your Template

1. Go to Email Templates in EmailJS
2. Click on your template
3. Click "Send Test Email"
4. Enter your email
5. Check if email arrives with the variable showing

---

## 📝 Example Template Structure

```
Subject: UniConnect Password Reset Code

Body:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Hello,

You requested a password reset for your UniConnect account.

Your verification code is: {{reset_code}}

This code will expire in 10 minutes.

If you didn't request this, please ignore this email.

Thanks,
UniConnect Team
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Remember:** The `{{reset_code}}` variable is REQUIRED!

---

**After completing these steps, your password reset will work!** 🎉

