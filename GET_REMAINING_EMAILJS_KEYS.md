# 🔑 Get Your EmailJS Template ID and Public Key

## ✅ What's Already Done:

- ✅ Service ID: `service_l08krpg` (already in `.env`)

---

## 📋 Step 1: Get Template ID

1. **Go to Email Templates:**
   - In EmailJS dashboard, click **"Email Templates"** in the left sidebar

2. **Find Your Password Reset Template:**
   - Look for your "Password Reset" template in the list
   - Click on it to open

3. **Copy Template ID:**
   - The Template ID is in the URL: `dashboard.emailjs.com/admin/template/[TEMPLATE_ID]`
   - OR it's shown in the template card: "Template ID: template_xxxxx"
   - Copy the ID (e.g., `template_abc123xyz`)

4. **Update .env:**
   - Open `.env` file
   - Replace `your_password_reset_template_id_here` with your Template ID

---

## 📋 Step 2: Get Public Key

1. **Go to Account Settings:**
   - In EmailJS dashboard, click **"Account"** in the left sidebar
   - OR click your name/profile → **"General"**

2. **Find Public Key:**
   - Look for **"Public Key"** or **"API Key"** section
   - It will look like: `xxxxxxxxxxxxx` (long string of characters)

3. **Copy Public Key:**
   - Click the copy icon or select and copy the key

4. **Update .env:**
   - Open `.env` file
   - Replace `your_public_key_here` with your Public Key

---

## ✅ Final .env File Should Look Like:

```env
VITE_EMAILJS_SERVICE_ID=service_l08krpg
VITE_EMAILJS_TEMPLATE_ID=template_abc123xyz
VITE_EMAILJS_PUBLIC_KEY=your_actual_public_key_here
```

---

## 🔄 After Updating .env:

1. **Restart Dev Server:**
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

2. **Test Password Reset:**
   - Go to login page
   - Click "Forgot password?"
   - Enter your email
   - Check inbox for code!

---

## 🎯 Quick Checklist:

- [ ] Service ID added: `service_l08krpg` ✅
- [ ] Template ID copied from Email Templates
- [ ] Template ID added to `.env`
- [ ] Public Key copied from Account → General
- [ ] Public Key added to `.env`
- [ ] Dev server restarted
- [ ] Test password reset

---

**Once you have both Template ID and Public Key, update the `.env` file and restart your server!** 🚀

