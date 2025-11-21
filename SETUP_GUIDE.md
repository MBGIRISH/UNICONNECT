# 🚀 UniConnect Setup Guide

## Current Status: ✅ Almost Ready!

Your project has been successfully configured and is ready to run. Here's what we've done:

### ✅ Completed Setup:
1. ✅ **Dependencies Installed** - All npm packages are ready
2. ✅ **Firebase Config** - Connected to `uni-connect-b63b0` project
3. ✅ **Gemini AI** - Service configured (needs API key)
4. ✅ **Code Fixed** - All imports and packages corrected
5. ✅ **Demo Mode** - App works without database

### ⚠️ Firebase Firestore Setup Required

The app detected that **Cloud Firestore is not enabled** in your Firebase project. Here's how to fix it:

## 🔧 Enable Firebase Firestore (5 minutes)

### Step 1: Open Firebase Console
Visit: https://console.firebase.google.com/project/uni-connect-b63b0/firestore

### Step 2: Enable Firestore
1. Click **"Create Database"** button
2. Select **"Start in Test Mode"** (for development)
3. Choose your preferred location (e.g., us-central1)
4. Click **"Enable"**

### Step 3: Set Up Security Rules (Optional - Recommended)
1. After Firestore is created, go to the **"Rules"** tab
2. Copy the contents from `firestore.rules` in your project
3. Paste and **"Publish"** the rules

### Step 4: Initialize Sample Data
Once Firestore is enabled, run:
```bash
npm run init-db
```

This will populate your database with sample posts, events, and marketplace items.

---

## 🎮 Running the Application NOW

**Good News!** The app will run perfectly in **Demo Mode** even without Firestore:

```bash
npm run dev
```

Then open: http://localhost:3000

### Demo Mode Features:
- ✅ Login page with "Try Demo Mode" button
- ✅ Browse sample posts and events
- ✅ Create posts (stored locally)
- ✅ All UI features work
- ⚠️ Data won't persist (until Firestore is enabled)

---

## 🤖 Optional: Add Gemini AI (For AI Features)

To enable AI post generation and study buddy:

1. **Get API Key**: https://aistudio.google.com/apikey
2. **Edit `.env` file**:
   ```env
   GEMINI_API_KEY=your_actual_api_key_here
   ```
3. **Restart the dev server**

Without this, AI features will show demo messages.

---

## 📱 Quick Start Commands

```bash
# Run the application (works right now!)
npm run dev

# After enabling Firestore, initialize database
npm run init-db

# Build for production
npm run build
```

---

## 🐛 Troubleshooting

### Issue: "Firebase initialization failed"
- **Solution**: The app will automatically fall back to demo mode
- **To fix permanently**: Follow "Enable Firebase Firestore" steps above

### Issue: "AI features not working"
- **Solution**: Add your Gemini API key to `.env` file
- **Free tier available**: https://aistudio.google.com/apikey

### Issue: "Database empty"
- **Solution**: Run `npm run init-db` after enabling Firestore

---

## 🎯 Next Steps

1. **Right Now**: Run `npm run dev` to see the app working!
2. **In 5 minutes**: Enable Firestore using the link above
3. **After that**: Run `npm run init-db` to add sample data
4. **Optional**: Add Gemini API key for AI features

---

## 📞 Need Help?

Check the main README.md for full documentation and troubleshooting.

**Happy Coding! 🎓**

