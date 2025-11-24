# 🔒 Cloudinary Security Settings - Step by Step

## 📋 What to Configure in Security Settings

Based on your Cloudinary Security page, here's exactly what to do:

---

## ✅ STEP 1: Allowed Fetch Domains (IMPORTANT!)

**This is for CORS - allows your app to upload files**

1. **Find:** "Allowed fetch domains:" section
2. **In the empty text field, add these domains (one per line):**
   ```
   localhost:3000
   localhost:5173
   localhost:5174
   ```
3. **For production, also add:**
   ```
   yourdomain.com
   www.yourdomain.com
   ```
4. **Click:** "Save" (if there's a save button)

**Why:** This allows your app running on localhost to upload files to Cloudinary without CORS errors.

---

## ✅ STEP 2: Enable PDF and ZIP Files Delivery

**This allows PDF documents to be downloaded**

1. **Find:** "PDF and ZIP files delivery:" section
2. **Check the checkbox:** "Allow delivery of PDF and ZIP files"
3. **Click:** "Save"

**Why:** Your app uploads PDF documents, so they need to be deliverable/downloadable.

---

## ✅ STEP 3: Verify Other Settings

### **Video Details:**
- ✅ "Auto video details" - Keep checked (helps with video metadata)
- ⬜ "In-video search" - Can leave unchecked (optional feature)

### **Usage of tags/context/metadata:**
- ✅ Keep as "Enabled" (allows dynamic URLs)

### **Temporary Cloudinary support access:**
- ⬜ Leave unchecked (only enable if Cloudinary support needs access)

---

## 📝 QUICK CHECKLIST

In the Security page, make sure:

- [ ] **Allowed fetch domains:** Added `localhost:3000` and `localhost:5173`
- [ ] **PDF and ZIP files delivery:** Checkbox is **CHECKED** ✅
- [ ] **Auto video details:** Checked (should already be)
- [ ] Clicked "Save" or changes are auto-saved

---

## 🧪 TEST AFTER CONFIGURING

After saving these settings:

1. **Restart your dev server:**
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

2. **Test uploads:**
   - Upload a PDF in Resources → Should work ✅
   - Upload a video in Group Chat → Should work ✅
   - Upload a document in Group Chat → Should work ✅

---

## ⚠️ IF YOU GET ERRORS

### **Error: "CORS policy blocked"**
- **Solution:** Make sure you added `localhost:3000` and `localhost:5173` to "Allowed fetch domains"

### **Error: "PDF not accessible"**
- **Solution:** Make sure "Allow delivery of PDF and ZIP files" checkbox is checked

### **Error: "Upload failed"**
- **Solution:** 
  1. Check "Allowed fetch domains" includes your localhost port
  2. Verify upload preset is "Unsigned"
  3. Check browser console for specific error

---

## 🎯 SUMMARY

**In Security Settings, you need to:**

1. ✅ **Add localhost domains** to "Allowed fetch domains"
2. ✅ **Check the box** for "Allow delivery of PDF and ZIP files"
3. ✅ **Save** the changes

**That's it!** Your Cloudinary is now configured for all file types! 🎉

