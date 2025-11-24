# 🔍 UPLOAD DEBUG GUIDE - Images, Videos, Documents, Stickers

## ✅ **VERIFIED CONFIGURATIONS**

### **1. GIPHY API Key (Stickers)**
- ✅ API Key: `3XEocAPxmO6auiyHBqiHea0eeu9XnGo4`
- ✅ Already configured in code
- ✅ Used for GIF search and sticker selection

---

## 🔥 **FIREBASE FIRESTORE RULES CHECK**

### **Current Rules Status:**
Your Firestore rules **SHOULD** allow:
- ✅ Authenticated users can **create** messages
- ✅ Messages can contain: `text`, `imageUrl`, `videoUrl`, `documentUrl`, `stickerUrl`, `poll`

### **Verify Your Rules:**

1. **Go to:** https://console.firebase.google.com
2. **Select:** Your project
3. **Click:** Firestore Database → Rules
4. **Verify this section exists:**

```javascript
// Group messages with polls, videos, documents
match /messages/{messageId} {
  allow read: if request.auth != null;
  allow create: if request.auth != null;  // ✅ This allows uploads
  allow update: if request.auth != null; // Allow poll voting
  allow delete: if request.auth != null && 
                 request.auth.uid == resource.data.senderId;
}
```

5. **If missing or different, UPDATE and PUBLISH**

---

## ☁️ **CLOUDINARY CONFIGURATION CHECK**

### **Step 1: Verify Upload Preset**

1. **Go to:** https://cloudinary.com/console/settings/upload
2. **Find preset:** `uniconnect_uploads`
3. **Check these settings:**

   **In "General" tab:**
   - ✅ **Signing Mode:** `Unsigned` (MOST IMPORTANT!)
   - ✅ **Folder:** `uniconnect` (or leave empty)

   **In "Optimize and Deliver" tab:**
   - ✅ **Access control:** `Public`
   - ✅ **Format:** Leave empty
   - ✅ **Allowed formats:** Leave empty

   **In "Transform" or "Advanced" tab:**
   - ✅ **Resource type:** `Auto` (or checkboxes for Image, Video, Raw)

4. **Click:** "Save"

---

### **Step 2: Test Cloudinary Upload**

**Open browser console (F12) and test:**

```javascript
// Test Image Upload
const testImageUpload = async () => {
  const formData = new FormData();
  formData.append('file', new Blob(['test'], { type: 'image/png' }), 'test.png');
  formData.append('upload_preset', 'uniconnect_uploads');
  formData.append('folder', 'uniconnect/test');
  formData.append('resource_type', 'image');
  
  const response = await fetch('https://api.cloudinary.com/v1_1/dlnlwudgr/image/upload', {
    method: 'POST',
    body: formData
  });
  
  const data = await response.json();
  console.log('Image upload test:', data);
};

// Test Video Upload
const testVideoUpload = async () => {
  const formData = new FormData();
  formData.append('file', new Blob(['test'], { type: 'video/mp4' }), 'test.mp4');
  formData.append('upload_preset', 'uniconnect_uploads');
  formData.append('folder', 'uniconnect/test');
  formData.append('resource_type', 'video');
  
  const response = await fetch('https://api.cloudinary.com/v1_1/dlnlwudgr/video/upload', {
    method: 'POST',
    body: formData
  });
  
  const data = await response.json();
  console.log('Video upload test:', data);
};

// Run tests
testImageUpload();
testVideoUpload();
```

**Expected Result:**
- ✅ Should return `{ secure_url: "https://...", ... }`
- ❌ If error: Check Cloudinary preset configuration

---

## 🐛 **COMMON ISSUES & FIXES**

### **Issue 1: "Permission Denied" Error**

**Symptom:** Console shows `Permission denied` when sending message

**Fix:**
1. Check Firestore rules are published
2. Verify user is authenticated
3. Check browser console for exact error

---

### **Issue 2: "Upload Failed" Error**

**Symptom:** Image/video upload fails with Cloudinary error

**Possible Causes:**
1. **Upload preset not set to "Unsigned"**
   - Fix: Go to Cloudinary → Settings → Upload → Edit preset → Set to "Unsigned"

2. **Resource type not enabled**
   - Fix: Enable "Video uploads" and "Raw file uploads" in preset settings

3. **File too large**
   - Fix: Check file size (Cloudinary free tier: 10MB max)

4. **CORS error**
   - Fix: Check Cloudinary CORS settings

---

### **Issue 3: "GIF Not Loading"**

**Symptom:** Sticker picker shows no GIFs

**Fix:**
1. Check GIPHY API key is correct: `3XEocAPxmO6auiyHBqiHea0eeu9XnGo4`
2. Check browser console for API errors
3. Verify internet connection
4. Check GIPHY API quota (free tier: 42 requests/hour)

---

### **Issue 4: Send Button Disabled**

**Symptom:** Send button stays disabled even with file selected

**Check:**
1. Open browser console (F12)
2. Type: `console.log('Image:', imageFile, 'Video:', videoFile)`
3. Verify file is actually selected
4. Check if `selectedGroup` and `user` are set

---

## 🧪 **STEP-BY-STEP TESTING**

### **Test 1: Image Upload**

1. Open Study Groups page
2. Select a group
3. Click **Plus (+)** → **Photos**
4. Select an image file
5. **Check console:** Should see "Uploading image: filename.jpg"
6. Click **Send** button
7. **Expected:** Image appears in chat
8. **If fails:** Check console error message

---

### **Test 2: Video Upload**

1. Click **Plus (+)** → **Videos**
2. Select a video file (small size, < 10MB)
3. **Check console:** Should see "Uploading video: filename.mp4"
4. Click **Send** button
5. **Expected:** Video player appears in chat
6. **If fails:** Check console error message

---

### **Test 3: Document Upload**

1. Click **Plus (+)** → **Documents**
2. Select a PDF/DOC file
3. **Check console:** Should see document upload
4. Click **Send** button
5. **Expected:** Document link appears in chat
6. **If fails:** Check console error message

---

### **Test 4: Sticker (GIF)**

1. Click **Plus (+)** → **Sticker (GIF)**
2. **Check console:** Should see "GIPHY API request: ..."
3. GIFs should load (trending or search results)
4. Click a GIF
5. **Check console:** Should see "Sending sticker/GIF: https://..."
6. Click **Send** button
7. **Expected:** GIF appears in chat
8. **If fails:** Check GIPHY API key and console errors

---

## 📋 **QUICK CHECKLIST**

### **Firebase:**
- [ ] Firestore rules allow `create` on `groups/{groupId}/messages/{messageId}`
- [ ] Rules are published (not just saved)
- [ ] User is authenticated (check `user` object exists)

### **Cloudinary:**
- [ ] Upload preset `uniconnect_uploads` exists
- [ ] Preset is set to **"Unsigned"** (most important!)
- [ ] Access control is set to **"Public"**
- [ ] Resource type allows: Image, Video, Raw
- [ ] Test upload works (use browser console test above)

### **GIPHY:**
- [ ] API key is correct: `3XEocAPxmO6auiyHBqiHea0eeu9XnGo4`
- [ ] API key is not rate-limited
- [ ] Internet connection is working

### **Code:**
- [ ] Browser console shows upload attempts
- [ ] No JavaScript errors in console
- [ ] Send button enables when file is selected

---

## 🚨 **IF STILL NOT WORKING**

1. **Open browser console (F12)**
2. **Try uploading an image/video**
3. **Copy ALL error messages** from console
4. **Check Network tab:**
   - Look for failed requests to Cloudinary
   - Check response status codes
   - Check request payload

5. **Share error messages** for further debugging

---

## ✅ **EXPECTED CONSOLE OUTPUT (Success)**

When uploading successfully, you should see:

```
handleSendMessage called: { hasContent: true, imageFile: true, ... }
Uploading image: photo.jpg 1234567
Image uploaded successfully: https://res.cloudinary.com/...
```

When sending sticker:

```
GIPHY API request: https://api.giphy.com/v1/gifs/trending?api_key=...
GIPHY API success: 20 GIFs found
Sending sticker/GIF: https://media.giphy.com/...
```

---

## 📞 **NEXT STEPS**

If uploads still fail after checking all above:
1. Share browser console errors
2. Share Network tab screenshots
3. Verify Cloudinary preset settings
4. Test with a small file first (< 1MB)

