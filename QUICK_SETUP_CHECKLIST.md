# ✅ Quick Setup Checklist

## 🔥 FIREBASE - DO THIS NOW

### **1. Update Firestore Rules** (2 minutes)

1. Go to: https://console.firebase.google.com
2. Select project: `campus-connect-fd225`
3. Click: **Firestore Database** → **Rules**
4. **Copy and paste** the rules from `firestore.rules` file
5. Click: **"Publish"**

✅ **Done!** Your Firestore rules now support:
- Resources with module numbers
- Group messages with videos, documents, polls
- Profile background images
- Poll voting

---

## ☁️ CLOUDINARY - DO THIS NOW

### **1. Configure Upload Preset** (3 minutes)

1. Go to: https://cloudinary.com/console/settings/upload
2. Find or create preset: **`uniconnect_uploads`**
3. **In "General" tab:**
   - ✅ Signing Mode: **Unsigned**
4. **In "Optimize and Deliver" tab:**
   - ✅ Access control: **Public** ⭐ (IMPORTANT!)
   - ✅ Format: Leave empty
   - ✅ Allowed formats: Leave empty
5. Click: **"Save"**

### **2. Enable Video & Document Uploads** (2 minutes)

**Location:** Settings → Upload → Upload presets → `uniconnect_uploads`

1. **Click on your preset:** `uniconnect_uploads`
2. **Find:** "Resource type" dropdown
3. **Select:** **"Auto"** ✅ (This enables videos, images, and raw files automatically)
4. **OR** if "Auto" is not available:
   - Look for checkboxes: "Enable video uploads" ✅
   - Look for checkboxes: "Enable raw file uploads" ✅
5. **Set max file size:** 100MB (or your preference)
6. **Click:** "Save"

### **3. Configure CORS & PDF Delivery** (2 minutes)

1. Go to: **Settings** → **Security**
2. **In "Allowed fetch domains" section:**
   - Add these domains (one per line):
     ```
     localhost:3000
     localhost:5173
     localhost:5174
     ```
3. **In "PDF and ZIP files delivery" section:**
   - ✅ **Check the box:** "Allow delivery of PDF and ZIP files"
4. Click: **"Save"** (or changes auto-save)

✅ **Done!** Cloudinary now supports:
- Images ✅
- Videos ✅
- Documents (PDF, DOC, etc.) ✅

---

## 🧪 TEST IT

### **Quick Test:**

1. **Resources:**
   - Upload a resource with Module Number
   - ✅ Should save successfully

2. **Group Chat:**
   - Upload a video
   - ✅ Should appear with player
   - Upload a document
   - ✅ Should appear with download link
   - Create a poll
   - ✅ Should appear with voting buttons

3. **Profile:**
   - Upload background image
   - ✅ Should appear on profile

---

## 📚 DETAILED GUIDES

For detailed instructions, see:
- **`FIREBASE_CLOUDINARY_SETUP.md`** - Complete setup guide
- **`CLOUDINARY_VIDEO_DOCUMENT_SETUP.md`** - Video & document specific

---

## ⚠️ IMPORTANT NOTES

### **File Size Limits:**
- **Free Tier:** 10MB per file
- **Images:** Usually under 5MB ✅
- **Videos:** May need compression if > 10MB
- **Documents:** Usually under 10MB ✅

### **If Uploads Fail:**
1. Check browser console for errors
2. Verify preset name: `uniconnect_uploads`
3. Verify preset is "Unsigned"
4. Check CORS settings
5. Verify file size is under limit

---

**That's it! Everything should work now! 🎉**

