# ☁️ Cloudinary Video & Document Upload Setup

## 🎯 Quick Setup Guide

This guide helps you configure Cloudinary to support:
- ✅ **Videos** (MP4, MOV, AVI, etc.)
- ✅ **Documents** (PDF, DOC, DOCX, TXT)
- ✅ **Images** (JPG, PNG, GIF, etc.)

---

## 📋 STEP-BY-STEP SETUP

### **Step 1: Login to Cloudinary**

1. Go to: https://cloudinary.com
2. Login with your account
3. Your Cloud Name: `dlnlwudgr`

---

### **Step 2: Configure Upload Preset**

1. **Go to:** Settings → Upload
2. **Scroll to:** "Upload presets"
3. **Find or create:** `uniconnect_uploads`

#### **Preset Configuration:**

```
Preset name: uniconnect_uploads
Signing Mode: Unsigned ✅
Access mode: Public ✅
Resource type: Auto ✅ (or leave empty)
Folder: uniconnect (optional)
```

#### **File Upload Settings:**

1. **In the preset settings, scroll to "Upload Manipulations"**
2. **Set:**
   - **Max file size:** 100MB (or as needed)
   - **Allowed formats:** Leave empty (allows all) OR specify:
     - Images: jpg, png, gif, webp
     - Videos: mp4, mov, avi, webm
     - Documents: pdf, doc, docx, txt

3. **Click:** "Save"

---

### **Step 3: Enable Video Uploads**

1. **Go to:** Settings → Upload
2. **Check:** "Enable video uploads" is ON
3. **Video settings:**
   - **Max file size:** 100MB (free tier: 10MB)
   - **Allowed formats:** mp4, mov, avi, webm (or leave empty for all)
   - **Auto-format:** Enable (optional)

---

### **Step 4: Enable Raw/Document Uploads**

1. **Go to:** Settings → Upload
2. **Check:** "Enable raw file uploads" is ON
3. **Raw file settings:**
   - **Max file size:** 100MB (free tier: 10MB)
   - **Allowed formats:** pdf, doc, docx, txt (or leave empty for all)

---

### **Step 5: Configure CORS (Important!)**

If you get CORS errors when uploading:

1. **Go to:** Settings → Security
2. **Find:** "Allowed fetch domains"
3. **Add these domains:**
   ```
   localhost:3000
   localhost:5173
   localhost:5174
   ```
4. **For production, also add:**
   ```
   yourdomain.com
   www.yourdomain.com
   ```
5. **Click:** "Save"

---

### **Step 6: Test Upload**

#### **Test Video Upload:**

1. Go to: Media Library
2. Click "Upload"
3. Select a video file (MP4, MOV, etc.)
4. **Upload preset:** Select `uniconnect_uploads`
5. **Resource type:** Video
6. Click "Upload"
7. **Verify:** Video appears in media library

#### **Test Document Upload:**

1. Go to: Media Library
2. Click "Upload"
3. Select a PDF or DOC file
4. **Upload preset:** Select `uniconnect_uploads`
5. **Resource type:** Raw
6. Click "Upload"
7. **Verify:** Document appears in media library

---

## 🔍 VERIFICATION

### **Check Upload Preset:**

1. Go to: Settings → Upload
2. Find: `uniconnect_uploads`
3. **Verify:**
   - ✅ Signing Mode: **Unsigned**
   - ✅ Access Mode: **Public**
   - ✅ Resource Type: **Auto** (or empty)
   - ✅ Max file size: **100MB** (or your limit)

### **Check API Endpoints:**

Your app uses these Cloudinary endpoints:

- **Images:** `https://api.cloudinary.com/v1_1/dlnlwudgr/image/upload`
- **Videos:** `https://api.cloudinary.com/v1_1/dlnlwudgr/video/upload`
- **Documents:** `https://api.cloudinary.com/v1_1/dlnlwudgr/raw/upload`

All use the same preset: `uniconnect_uploads`

---

## 📊 FILE SIZE LIMITS

### **Cloudinary Free Tier:**
- **Images:** 10MB max
- **Videos:** 10MB max
- **Documents:** 10MB max
- **Total Storage:** 25GB
- **Bandwidth:** 25GB/month

### **Recommended Limits:**
- **Images:** 5MB (compress before upload)
- **Videos:** 10MB (or compress)
- **Documents:** 10MB (PDFs usually smaller)

---

## 🐛 TROUBLESHOOTING

### **Error: "Upload preset not found"**

**Solution:**
1. Verify preset name is exactly: `uniconnect_uploads`
2. Check preset is set to "Unsigned"
3. Try creating a new preset with the same name

### **Error: "File too large"**

**Solution:**
1. Check file size is under 10MB (free tier)
2. Compress the file before upload
3. Or upgrade Cloudinary plan for larger files

### **Error: "CORS policy blocked"**

**Solution:**
1. Go to Settings → Security
2. Add your domain to "Allowed fetch domains"
3. Include `localhost:3000` and `localhost:5173`
4. Save and retry

### **Error: "Resource type not allowed"**

**Solution:**
1. Check preset allows the resource type
2. Set "Resource type" to "Auto" in preset
3. Or specify allowed types in preset settings

---

## ✅ FINAL CHECKLIST

Before using the app:

- [ ] Upload preset `uniconnect_uploads` exists
- [ ] Preset is set to "Unsigned"
- [ ] Preset allows all resource types (Auto)
- [ ] Video uploads enabled
- [ ] Raw/document uploads enabled
- [ ] CORS configured with localhost domains
- [ ] Test video upload works
- [ ] Test document upload works
- [ ] Test image upload works

---

## 🚀 PRODUCTION DEPLOYMENT

When deploying to production:

1. **Add production domain** to CORS settings
2. **Update file size limits** if needed
3. **Monitor usage** in Cloudinary dashboard
4. **Set up alerts** for bandwidth/storage limits
5. **Consider upgrading** if you exceed free tier

---

**Cloudinary is now configured for all file types! 🎉**

