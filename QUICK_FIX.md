# 🚨 QUICK FIX: Authentication Error

## The Error You're Seeing

```
Error (auth/operation-not-allowed)
```

This error occurs because **Email/Password authentication** is not enabled in your Firebase project.

---

## ⚡ 5-Minute Fix

### Step 1: Enable Email/Password Authentication

1. **Click this link** to go directly to your Firebase Authentication settings:
   
   👉 https://console.firebase.google.com/project/uni-connect-b63b0/authentication/providers

2. If you see "Get Started", click it first

3. Click on **"Email/Password"** in the list of providers

4. Toggle the switch to **"Enable"**

5. Click **"Save"**

### Step 2: Enable Google Sign-In (Optional but Recommended)

While you're there:

1. Click on **"Google"** in the providers list

2. Toggle the switch to **"Enable"**

3. Select your support email from the dropdown

4. Click **"Save"**

### Step 3: Refresh Your App

Go back to your browser at `http://localhost:3000` and refresh the page (Cmd+R or F5)

---

## ✅ You're Done!

You can now:
- ✅ Sign up with the email and password you entered
- ✅ Sign in with Google (if you enabled it)
- ✅ Use all app features

---

## 🎯 What to Do Now

### Create Your Account

1. Enter your details:
   - Name: M B GIRISH (already filled)
   - Email: 1ds23cs121@dsce.edu.in (already filled)
   - Password: (choose a password)

2. Click **"Create Account"**

3. You'll be taken to the onboarding flow to complete your profile

4. Start using UniConnect!

---

## 🔧 Additional Setup (5 More Minutes)

To unlock all features, complete these steps:

### Enable Firestore Database

1. Go to: https://console.firebase.google.com/project/uni-connect-b63b0/firestore

2. Click **"Create Database"**

3. Select **"Test mode"** (for development)

4. Choose location (e.g., us-central1)

5. Click **"Enable"**

6. After it's enabled, run in your terminal:
   ```bash
   npm run init-db
   ```

### Enable Cloud Storage

1. Go to: https://console.firebase.google.com/project/uni-connect-b63b0/storage

2. Click **"Get Started"**

3. Select **"Test mode"**

4. Choose the same location as Firestore

5. Click **"Done"**

---

## 📱 Features You Get After Full Setup

Once you complete all steps above, you'll have access to:

- ✅ **Social Feed**: Create posts with images, like, comment
- ✅ **Events**: Create and RSVP to campus events
- ✅ **Groups**: Join study groups and collaborate
- ✅ **Marketplace**: Buy and sell items
- ✅ **Profile**: Upload avatar, edit bio, add social links
- ✅ **Notifications**: Get notified about activities

---

## 🐛 Still Having Issues?

### Issue: Can't access Firebase Console
- Make sure you're logged in with the Google account that owns the Firebase project

### Issue: Don't see "Email/Password" option
- Make sure you clicked "Get Started" in Authentication first

### Issue: App still shows error after enabling
- Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
- Clear browser cache
- Restart the dev server: Ctrl+C then `npm run dev`

---

## 📚 Need More Help?

Check the full setup guide in `README.md` for detailed instructions on:
- Security rules
- Advanced configuration
- Deployment
- All features

---

**That's it! You should be up and running in 5 minutes! 🚀**

