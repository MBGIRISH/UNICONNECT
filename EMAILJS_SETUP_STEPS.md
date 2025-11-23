# 📧 EmailJS Setup - Step by Step Guide

Based on your current setup, here's what you need to complete:

## ✅ Step 1: Complete Gmail Service Setup (You're Here!)

1. **In EmailJS Dashboard:**
   - Service ID: `service_l08krpg` ✅ (You have this)
   - Click **"Connect Account"** button
   - Authorize Gmail access
   - Click **"Create Service"**

2. **Verify Service:**
   - Make sure "Send test email to verify configuration" is checked
   - Test email should arrive in your inbox

---

## ✅ Step 2: Create Email Template

1. **Go to Email Templates:**
   - Click **"Email Templates"** in EmailJS dashboard
   - Click **"Create New Template"**

2. **Template Settings:**
   - **Template Name:** `Password Reset Code`
   - **Subject:** `UniConnect Password Reset Code`

3. **Template Content:**
   ```
   Hello,

   You requested a password reset for your UniConnect account.

   Your verification code is: {{reset_code}}

   This code will expire in 10 minutes.

   If you didn't request this, please ignore this email.

   Thanks,
   UniConnect Team
   ```

4. **Template Variables:**
   - Make sure these variables are in your template:
     - `{{reset_code}}` - The 6-digit code
     - `{{to_email}}` - Recipient email (optional)
     - `{{app_name}}` - App name (optional)

5. **Save Template:**
   - Click **"Save"**
   - **Copy the Template ID** (e.g., `template_xxxxx`)

---

## ✅ Step 3: Get Public Key

1. **Go to Account Settings:**
   - Click your profile/account icon
   - Go to **"General"** or **"Account"**

2. **Find Public Key:**
   - Look for **"Public Key"** or **"API Key"**
   - Copy it (e.g., `xxxxxxxxxxxxx`)

---

## ✅ Step 4: Create .env File

1. **In your project root** (`/Users/mbgirish/UNI-CONNECT/`)

2. **Create `.env` file** with:

```env
# EmailJS Configuration
VITE_EMAILJS_SERVICE_ID=service_l08krpg
VITE_EMAILJS_TEMPLATE_ID=your_template_id_here
VITE_EMAILJS_PUBLIC_KEY=your_public_key_here
```

3. **Replace:**
   - `your_template_id_here` → Your template ID from Step 2
   - `your_public_key_here` → Your public key from Step 3

---

## ✅ Step 5: Restart Dev Server

```bash
# Stop current server (Ctrl+C)
# Then restart:
npm run dev
```

---

## 🧪 Testing

1. **Go to Login Page:**
   - Click "Forgot password?"
   - Enter your registered email
   - Click "Send Verification Code"

2. **Check Email:**
   - You should receive email with 6-digit code
   - Code expires in 10 minutes

3. **Complete Reset:**
   - Enter code in app
   - Enter new password
   - Password reset complete!

---

## ⚠️ Important Notes

1. **Template Variables Must Match:**
   - Code uses: `reset_code`, `to_email`, `app_name`
   - Make sure your template has `{{reset_code}}` at minimum

2. **Service ID:**
   - Your service ID: `service_l08krpg` ✅
   - Make sure Gmail service is connected

3. **Free Tier Limits:**
   - 200 emails/month (free)
   - 500 emails/day (Gmail personal service)

4. **If EmailJS Not Configured:**
   - Code will appear in browser console (F12)
   - Check console for: `Verification code generated: XXXXXX`

---

## 🔍 Verify Your Setup

After completing all steps, check:

- [ ] Gmail service connected in EmailJS
- [ ] Email template created with `{{reset_code}}`
- [ ] Template ID copied
- [ ] Public key copied
- [ ] `.env` file created with all 3 values
- [ ] Dev server restarted
- [ ] Test email sent successfully

---

## 🐛 Troubleshooting

### Email Not Received:
1. Check spam folder
2. Verify Gmail service is connected
3. Check EmailJS dashboard for errors
4. Verify template has correct variables

### Code Not Sending:
1. Check browser console (F12) for errors
2. Verify `.env` file has correct values
3. Make sure dev server was restarted after creating `.env`
4. Check EmailJS dashboard → Logs for errors

### Template Variables Error:
- Make sure template has `{{reset_code}}` variable
- Variable names are case-sensitive

---

**Need Help?** Check `CODE_BASED_PASSWORD_RESET.md` for more details.

