# 📍 Where to Enable Video & Raw File Uploads in Cloudinary

## 🎯 LOCATION: Upload Settings Page

### **Step 1: Go to Upload Settings**

1. **Login to Cloudinary:** https://cloudinary.com
2. **Click:** Settings (gear icon in top right or left sidebar)
3. **Click:** **"Upload"** tab (in the settings menu)

**Direct Link:** https://cloudinary.com/console/settings/upload

---

## ✅ STEP 2: Enable Video Uploads

### **Where to Find:**

1. **On the Upload settings page**, scroll down
2. **Look for:** "Upload settings" or "Upload options" section
3. **Find:** "Video uploads" or "Enable video uploads"
4. **Check the box** or toggle to **ON** ✅

**Alternative Location:**
- Sometimes it's under "Upload presets" → Edit your preset → "Resource type" → Select "Video" or "Auto"
- Or in "Upload settings" → "Allowed resource types" → Check "Video"

---

## ✅ STEP 3: Enable Raw File Uploads

### **Where to Find:**

1. **On the same Upload settings page**
2. **Look for:** "Raw file uploads" or "Enable raw file uploads"
3. **Check the box** or toggle to **ON** ✅

**Alternative Names:**
- "Raw files"
- "Document uploads"
- "File uploads"
- "Other file types"

---

## 📋 DETAILED STEPS WITH SCREENSHOTS GUIDE

### **Method 1: Upload Preset Settings (Recommended)**

1. **Go to:** Settings → Upload
2. **Scroll to:** "Upload presets" section
3. **Click on:** `uniconnect_uploads` preset (or create it)
4. **In the preset settings, look for:**
   - **"Resource type"** dropdown
   - **Select:** "Auto" (this enables all types including video and raw)
   - OR select "Video" and "Raw" separately if available
5. **Scroll down to "Upload settings"** in the preset
6. **Check:**
   - ✅ "Enable video uploads"
   - ✅ "Enable raw file uploads"
7. **Click:** "Save"

### **Method 2: Global Upload Settings**

1. **Go to:** Settings → Upload
2. **Scroll to:** "Upload settings" or "General upload settings"
3. **Look for checkboxes:**
   - ✅ "Video uploads" - Check this
   - ✅ "Raw file uploads" - Check this
4. **Click:** "Save"

---

## 🔍 IF YOU CAN'T FIND IT

### **Check These Locations:**

1. **Settings → Upload → Upload presets → Edit preset**
   - Look for "Resource type" or "Allowed resource types"
   - Set to "Auto" to allow all types

2. **Settings → Upload → Upload settings**
   - Scroll through all options
   - Look for video/raw file toggles

3. **Settings → Media Library → Upload**
   - Sometimes settings are here too

4. **Account Settings → Product Environment Settings → Upload**
   - Check here if not in main settings

---

## ✅ QUICK VERIFICATION

After enabling:

1. **Go to:** Media Library
2. **Click:** "Upload" button
3. **Try uploading:**
   - A video file (MP4, MOV) → Should work ✅
   - A PDF file → Should work ✅
   - A DOC file → Should work ✅

If uploads work, you're all set! 🎉

---

## 🎯 RECOMMENDED SETTINGS

### **For Upload Preset `uniconnect_uploads`:**

```
Preset name: uniconnect_uploads
Signing Mode: Unsigned ✅
Access Mode: Public ✅
Resource Type: Auto ✅ (enables all types)
Folder: uniconnect
Max file size: 100MB (or your preference)
```

**With "Auto" resource type, you don't need to enable video/raw separately - it's already included!**

---

## 💡 TIP

**Easiest Way:**
- Set **"Resource type"** to **"Auto"** in your upload preset
- This automatically enables videos, images, and raw files
- No need to enable them separately!

---

**If you still can't find it, let me know and I'll help you locate it!**

