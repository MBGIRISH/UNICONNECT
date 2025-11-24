# 🍎 How to Clear Cache in Safari

## ✅ **METHOD 1: Clear Cache via Settings** (Recommended)

1. **Open Safari**
2. **Click "Safari" in the menu bar** (top left)
3. **Click "Settings"** (or "Preferences" on older versions)
4. **Go to "Advanced" tab**
5. **Check the box:** "Show Develop menu in menu bar"
6. **Close Settings**
7. **Click "Develop" in the menu bar** (top)
8. **Click "Empty Caches"**
9. **Done!**

---

## ✅ **METHOD 2: Clear via Develop Menu** (If already enabled)

1. **Click "Develop" in the menu bar** (top)
2. **Click "Empty Caches"**
3. **Done!**

---

## ✅ **METHOD 3: Clear All Website Data** (Most thorough)

1. **Click "Safari" in the menu bar**
2. **Click "Settings"** (or "Preferences")
3. **Go to "Privacy" tab**
4. **Click "Manage Website Data..."**
5. **Click "Remove All"**
6. **Click "Remove Now"**
7. **Close Settings**
8. **Done!**

---

## ✅ **METHOD 4: Private Browsing Mode** (Easiest for testing)

1. **Click "File" in the menu bar**
2. **Click "New Private Window"** (or press `Cmd+Shift+N`)
3. **Go to your app** (localhost)
4. **Test if CORS error still appears**
5. **Private mode bypasses all cache!**

---

## 🎯 **RECOMMENDED FOR YOUR ISSUE:**

**Use Method 4 (Private Browsing) first:**
- Fastest way to test
- Bypasses all cache
- No settings changes needed

**If that works, then use Method 1 to clear cache permanently.**

---

## ✅ **AFTER CLEARING CACHE:**

1. **Close ALL Safari tabs** with your app
2. **Open new tab**
3. **Go to your app:** http://localhost:5173 (or your dev server)
4. **Open Developer Console:**
   - Press `Cmd+Option+C` (or right-click → Inspect Element)
5. **Check console for:**
   - ✅ `✅ Firestore initialized`
   - ✅ `✅ Firestore listener connected`
   - ❌ **NO CORS errors!**

---

## 🆘 **IF DEVELOP MENU NOT VISIBLE:**

1. **Safari → Settings → Advanced**
2. **Check:** "Show Develop menu in menu bar"
3. **Now "Develop" menu will appear in menu bar**

---

**🎯 TRY PRIVATE BROWSING MODE FIRST - IT'S THE FASTEST WAY TO TEST!**

