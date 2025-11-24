# 🔍 DEEP CORS TROUBLESHOOTING

## 🚨 **IF YOU'VE DONE EVERYTHING 100 TIMES AND STILL GETTING CORS ERROR:**

The error URL shows: `projects/connect-fd225/databases/(default)`
But your config shows: `campus-connect-fd225`

**This might be a project ID mismatch!**

---

## ✅ **CHECK 1: Verify Project ID Match**

1. **Check your Firebase Console:**
   - Go to: https://console.firebase.google.com/
   - What project name do you see?
   - Is it `campus-connect-fd225` or `connect-fd225`?

2. **Check your `firebaseConfig.ts`:**
   - Project ID should match exactly
   - Current config shows: `campus-connect-fd225`

3. **If they don't match:**
   - Update `firebaseConfig.ts` to match your actual Firebase project ID
   - OR create/use the correct Firebase project

---

## ✅ **CHECK 2: Verify Database Mode**

1. **Go to:** https://console.firebase.google.com/project/campus-connect-fd225/firestore

2. **Check the database mode:**
   - Should be **"Native mode"** (not Datastore mode)
   - If it's in Datastore mode, you need to create a NEW database in Native mode

3. **To check/create:**
   - Click on the database
   - Look for "Mode" - should say "Native mode"
   - If it says "Datastore mode", create a new database

---

## ✅ **CHECK 3: Verify API is Enabled in CORRECT Project**

1. **Go to:** https://console.cloud.google.com/apis/library/firestore.googleapis.com

2. **Check the project selector (top bar):**
   - Make sure it shows: `campus-connect-fd225`
   - If it shows a different project, switch to the correct one

3. **Verify API is enabled:**
   - Should see "API Enabled" ✅
   - If not, enable it

---

## ✅ **CHECK 4: Verify Rules are Published in CORRECT Project**

1. **Go to:** https://console.firebase.google.com/project/campus-connect-fd225/firestore/rules

2. **Verify:**
   - Top right says **"Published"** (not "Saved")
   - Rules match your `firestore.rules` file

3. **If not published:**
   - Copy rules from `firestore.rules`
   - Paste into editor
   - Click **"PUBLISH"**
   - Wait for confirmation

---

## ✅ **CHECK 5: Clear Browser Cache**

1. **Close ALL browser tabs** with your app

2. **Clear browser cache:**
   - Chrome: Settings → Privacy → Clear browsing data
   - Select "Cached images and files"
   - Clear last hour

3. **Or use Incognito/Private mode:**
   - Open app in incognito window
   - Test if CORS error still appears

---

## ✅ **CHECK 6: Verify Firebase Project Settings**

1. **Go to:** https://console.firebase.google.com/project/campus-connect-fd225/settings/general

2. **Check "Your apps" section:**
   - Is your web app registered?
   - App ID should match: `1:258370587794:web:86b682bbcb6ef5d068aa4b`

3. **If app is not registered:**
   - Click "Add app" → Web (</> icon)
   - Register the app
   - Copy the config (but you already have it)

---

## ✅ **CHECK 7: Test with Different Browser**

1. **Try a different browser:**
   - If using Chrome, try Firefox
   - If using Firefox, try Chrome

2. **This helps identify:**
   - Browser-specific cache issues
   - Extension conflicts

---

## ✅ **CHECK 8: Verify Network/Firewall**

1. **Check if you're behind a firewall:**
   - Some corporate networks block Firebase
   - Try from a different network (mobile hotspot)

2. **Check browser extensions:**
   - Disable ad blockers
   - Disable privacy extensions
   - Test in incognito mode

---

## 🆘 **IF STILL NOT WORKING:**

### **Option 1: Create New Firebase Project**

1. **Go to:** https://console.firebase.google.com/
2. **Click "Add project"**
3. **Name it:** `campus-connect-fd225` (or any name)
4. **Follow setup wizard**
5. **Enable Firestore** (Native mode)
6. **Update `firebaseConfig.ts`** with new project config
7. **Publish rules**

### **Option 2: Check Firebase Console for Errors**

1. **Go to:** https://console.firebase.google.com/project/campus-connect-fd225
2. **Check for any warnings/errors**
3. **Look for "Billing" warnings** (some features require billing)

---

## 📞 **QUICK VERIFICATION:**

Run this in your browser console (F12):

```javascript
// Check Firebase config
console.log('Project ID:', firebase.app().options.projectId);
console.log('Auth Domain:', firebase.app().options.authDomain);

// Check Firestore
import { getFirestore } from 'firebase/firestore';
const db = getFirestore();
console.log('Firestore:', db);
```

---

## 🎯 **MOST LIKELY ISSUES:**

1. **Project ID mismatch** - Config says one thing, Firebase uses another
2. **Rules not published** - Most common issue
3. **Database in wrong mode** - Should be Native, not Datastore
4. **Browser cache** - Old cached config causing issues

---

**Try these checks in order. One of them should reveal the issue!**

