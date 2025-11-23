# 📧 Firebase Email Configuration Guide

## Issue: Password Reset Emails Not Arriving

If you're seeing the success message but not receiving emails, follow these steps:

---

## ✅ Step 1: Check Firebase Email Templates

Firebase uses default email templates, but you may need to configure them:

1. **Go to Firebase Console:**
   - https://console.firebase.google.com/project/campus-connect-fd225/authentication/emails

2. **Check Email Templates:**
   - Click on **"Password reset"** template
   - Verify it's enabled
   - Check the email content

3. **Configure Email Settings:**
   - **Action URL:** Should be your app's URL (e.g., `http://localhost:3000` for development)
   - **Email format:** HTML or Plain text
   - **Sender name:** Can be customized (e.g., "UniConnect")

---

## ✅ Step 2: Verify Email Address is Registered

**Important:** Firebase only sends reset emails to **registered email addresses**.

1. **Check if email exists:**
   - Go to: https://console.firebase.google.com/project/campus-connect-fd225/authentication/users
   - Search for your email address
   - If it's not there, you need to **sign up first** before using forgot password

2. **If email doesn't exist:**
   - The app shows success (for security), but no email is sent
   - You need to create an account first

---

## ✅ Step 3: Check Spam/Junk Folder

1. **Check Spam Folder:**
   - Emails from Firebase might go to spam
   - Look for emails from `noreply@firebaseapp.com` or `noreply@[your-project].firebaseapp.com`

2. **Whitelist Firebase Emails:**
   - Add `noreply@firebaseapp.com` to your contacts
   - Mark as "Not Spam" if found in spam

---

## ✅ Step 4: Verify Firebase Project Settings

1. **Check Authentication Settings:**
   - Go to: https://console.firebase.google.com/project/campus-connect-fd225/authentication/settings
   - Verify **"Authorized domains"** includes your domain
   - For localhost: Make sure `localhost` is in authorized domains

2. **Check Email Sending:**
   - Go to: https://console.firebase.google.com/project/campus-connect-fd225/authentication/emails
   - Verify **"Email sending"** is enabled
   - Check if there are any restrictions

---

## ✅ Step 5: Test with Console

1. **Use Firebase Console to test:**
   - Go to: https://console.firebase.google.com/project/campus-connect-fd225/authentication/users
   - Find your user
   - Click **"Reset password"** button
   - Check if email arrives

2. **If Console works but app doesn't:**
   - Check browser console for errors
   - Verify Firebase config is correct
   - Check network tab for failed requests

---

## ✅ Step 6: Check Email Provider

Some email providers block automated emails:

1. **Gmail:**
   - Check "All Mail" folder
   - Check "Spam" folder
   - Check "Promotions" tab

2. **Outlook/Hotmail:**
   - Check "Junk Email" folder
   - Check "Other" folder

3. **University/Corporate Email:**
   - May have strict spam filters
   - Check with IT department
   - Try with personal email (Gmail, Yahoo, etc.)

---

## 🔧 Quick Fix: Use Firebase Console

If emails still don't arrive:

1. **Manual Reset via Console:**
   - Go to: https://console.firebase.google.com/project/campus-connect-fd225/authentication/users
   - Find your user
   - Click **"Reset password"**
   - This will send email directly from Firebase

2. **Check Email Logs:**
   - Firebase Console → Authentication → Users
   - Check if email was actually sent
   - Look for any error messages

---

## 📝 Common Issues & Solutions

### Issue 1: "Email sent" but nothing arrives
- **Solution:** Email might not be registered. Sign up first, then use forgot password.

### Issue 2: Emails go to spam
- **Solution:** Check spam folder, whitelist Firebase emails.

### Issue 3: "Too many requests" error
- **Solution:** Wait 5-10 minutes, Firebase has rate limits.

### Issue 4: Email format invalid
- **Solution:** Use a valid email format: `user@domain.com`

### Issue 5: Network error
- **Solution:** Check internet connection, try again.

---

## 🎯 Verification Checklist

- [ ] Email is registered in Firebase Auth
- [ ] Email templates are configured in Firebase Console
- [ ] Checked spam/junk folder
- [ ] Authorized domains include your domain
- [ ] Email sending is enabled in Firebase
- [ ] No errors in browser console
- [ ] Tried with different email provider

---

## 💡 Pro Tip

**For Development/Testing:**
- Use a real email address (Gmail, Yahoo, etc.)
- Check spam folder immediately
- Try the reset from Firebase Console directly
- Verify email is registered before testing

**For Production:**
- Configure custom email templates
- Set up custom domain for emails
- Monitor email delivery in Firebase Console
- Set up email analytics

---

## 🆘 Still Not Working?

If emails still don't arrive after checking all above:

1. **Check Firebase Console Logs:**
   - Go to: https://console.firebase.google.com/project/campus-connect-fd225/authentication
   - Look for any error messages

2. **Verify Email in Firebase:**
   - Go to Users tab
   - Find your email
   - Verify it's verified (email verified = true)

3. **Try Different Email:**
   - Use a different email provider
   - Test with Gmail or Yahoo
   - Some providers block automated emails

4. **Contact Support:**
   - Check Firebase status: https://status.firebase.google.com/
   - Check if there are any service outages

---

## ✅ Expected Behavior

**When working correctly:**
1. User enters email → Validates format
2. Clicks "Send Reset Link" → Shows success message
3. Email arrives within 1-2 minutes
4. Email contains reset link
5. Clicking link opens password reset page
6. User sets new password
7. Can sign in with new password

**Security Note:**
- App shows success even if email doesn't exist (prevents email enumeration)
- Only registered emails receive reset emails
- Reset links expire after 1 hour (Firebase default)

---

**Last Updated:** November 22, 2025

