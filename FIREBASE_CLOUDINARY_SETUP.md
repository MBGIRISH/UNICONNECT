# 🔥 Firebase & Cloudinary Setup Guide

## 📋 Complete Configuration for All Features

This guide covers all necessary Firebase and Cloudinary configurations for:
- ✅ Resources with Module Numbers
- ✅ Group Chat (Videos, Documents, Polls, Stickers)
- ✅ Profile Background Images
- ✅ Multiple PDF Uploads

---

## 🔥 FIREBASE FIRESTORE SETUP

### **Step 1: Update Firestore Security Rules**

1. **Go to:** https://console.firebase.google.com
2. **Select your project:** `campus-connect-fd225` (or your project name)
3. **Click:** Firestore Database → Rules
4. **Replace with this:**

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Password reset codes - allow read/write for anyone (needed for password reset flow)
    match /passwordResetCodes/{email} {
      allow read, write: if true;
    }
    
    // Resources collection - supports moduleNumber field
    match /resources/{resourceId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
                              request.auth.uid == resource.data.uploadedBy;
    }
    
    // Groups and group messages - supports videos, documents, polls
    match /groups/{groupId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
                              request.auth.uid == resource.data.creatorId;
      
      // Group messages with polls, videos, documents
      match /messages/{messageId} {
        allow read: if request.auth != null;
        allow create: if request.auth != null;
        allow update: if request.auth != null; // Allow poll voting
        allow delete: if request.auth != null && 
                       request.auth.uid == resource.data.senderId;
      }
      
      // Group members
      match /members/{memberId} {
        allow read: if request.auth != null;
        allow write: if request.auth != null;
      }
      
      // Join requests
      match /joinRequests/{requestId} {
        allow read: if request.auth != null;
        allow create: if request.auth != null;
        allow update: if request.auth != null && 
                        (request.auth.uid == resource.data.userId || 
                         get(/databases/$(database)/documents/groups/$(groupId)/members/$(request.auth.uid)).data.role in ['owner', 'admin']);
      }
    }
    
    // Users collection - supports backgroundImage
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // All other collections - require authentication
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

5. **Click:** "Publish" to save

---

## ☁️ CLOUDINARY SETUP

### **Step 1: Login to Cloudinary**

1. **Go to:** https://cloudinary.com
2. **Login** to your account
3. **Cloud Name:** `dlnlwudgr`
4. **API Key:** `589967352537727`

---

### **Step 2: Configure Upload Preset**

1. **Go to:** https://cloudinary.com/console/settings/upload
2. **Scroll down** to "Upload presets"
3. **Find or create:** `uniconnect_uploads`

#### **If Creating New Preset:**

1. Click **"Add upload preset"**
2. **Fill in:**
   ```
   Preset name: uniconnect_uploads
   Signing Mode: Unsigned ✅
   Folder: uniconnect (optional)
   Access mode: Public ✅
   Resource type: Auto ✅
   ```

#### **If Updating Existing Preset:**

1. Click on `uniconnect_uploads`
2. **Verify these settings:**
   - ✅ **Signing Mode:** Unsigned
   - ✅ **Access Mode:** Public
   - ✅ **Resource Type:** Auto (or leave empty)
   - ✅ **Allowed Formats:** Leave empty (allows all formats)

3. **Click:** "Save"

---

### **Step 3: Enable Video Uploads**

Cloudinary supports videos by default, but verify:

1. **Go to:** Settings → Upload
2. **Check:** "Video uploads" is enabled
3. **Max file size:** Should be at least 100MB (free tier allows 10MB, paid allows more)
4. **Allowed formats:** mp4, mov, avi, etc. (or leave empty for all)

---

### **Step 4: Enable Raw/Document Uploads**

1. **Go to:** Settings → Upload
2. **Check:** "Raw file uploads" is enabled
3. **Allowed formats:** pdf, doc, docx, txt (or leave empty for all)
4. **Max file size:** Should be at least 10MB

---

### **Step 5: Configure CORS (If Needed)**

If you get CORS errors:

1. **Go to:** Settings → Security
2. **Find:** "Allowed fetch domains"
3. **Add:**
   - `localhost:3000`
   - `localhost:5173` (Vite default)
   - Your production domain (if deployed)
4. **Click:** "Save"

---

### **Step 6: Verify Upload Preset**

**Test the preset:**

1. **Go to:** Media Library
2. **Click:** "Upload" button
3. **Select:** Any file (image, video, or document)
4. **Check:** Upload preset shows `uniconnect_uploads`
5. **Upload** and verify it works

---

## 📊 FIRESTORE COLLECTIONS STRUCTURE

### **Resources Collection**

```
resources/{resourceId}
├── title: string
├── description: string
├── fileUrl: string (Cloudinary URL)
├── fileName: string
├── fileSize: number
├── department: string
├── year: string
├── subject: string
├── moduleNumber: string (NEW - optional)
├── uploadedBy: string
├── uploaderName: string
├── uploaderPhoto?: string
├── createdAt: Timestamp
└── downloads: number
```

### **Group Messages Collection**

```
groups/{groupId}/messages/{messageId}
├── text: string
├── imageUrl?: string (Cloudinary URL)
├── videoUrl?: string (Cloudinary URL - NEW)
├── documentUrl?: string (Cloudinary URL - NEW)
├── documentName?: string (NEW)
├── stickerUrl?: string (NEW - for future use)
├── poll?: {
│   ├── question: string
│   ├── options: string[]
│   ├── votes: { [optionIndex: string]: number }
│   └── userVotes: { [optionIndex: string]: string[] }
│ }
├── senderId: string
├── senderName: string
├── senderPhoto?: string
├── timestamp: Timestamp
└── isAi: boolean
```

### **Users Collection**

```
users/{userId}
├── uid: string
├── email: string
├── displayName: string
├── photoURL?: string
├── backgroundImage?: string (NEW - Cloudinary URL)
├── bio?: string
├── college?: string
├── location?: string
├── ... (other fields)
├── createdAt: Timestamp
└── updatedAt: Timestamp
```

---

## ✅ VERIFICATION CHECKLIST

### **Firebase:**
- [ ] Firestore rules updated and published
- [ ] Rules allow authenticated users to read/write
- [ ] Rules allow poll voting (update on messages)
- [ ] Rules allow resource creation with moduleNumber

### **Cloudinary:**
- [ ] Upload preset `uniconnect_uploads` exists
- [ ] Preset is set to "Unsigned"
- [ ] Preset allows all resource types (Auto)
- [ ] Video uploads enabled
- [ ] Raw/document uploads enabled
- [ ] CORS configured (if needed)
- [ ] Test upload works (image, video, document)

---

## 🧪 TESTING

### **Test 1: Resource Upload with Module Number**

1. Go to Resources page
2. Click "Upload"
3. Fill in form:
   - Title: "Test Resource"
   - Department: Select any
   - Year: Select any
   - Subject: "Test"
   - **Module Number: Select "Module 1"** ✅
   - Upload PDF file
4. Click "Upload Resource"
5. **Verify:** Resource appears with Module 1 tag

### **Test 2: Group Chat - Video Upload**

1. Go to Study Groups
2. Select or create a group
3. Click **Plus (+)** button
4. Select **"Videos"**
5. Upload a video file
6. **Verify:** Video appears in chat with player controls

### **Test 3: Group Chat - Document Upload**

1. In group chat, click **Plus (+)** button
2. Select **"Documents"**
3. Upload a PDF or DOC file
4. **Verify:** Document appears with download link

### **Test 4: Group Chat - Poll**

1. In group chat, click **Plus (+)** button
2. Select **"Poll"**
3. Enter question and options
4. Send poll
5. **Verify:** Poll appears with voting buttons
6. Click an option to vote
7. **Verify:** Vote count updates

### **Test 5: Profile Background Image**

1. Go to Profile
2. Click "Edit Profile"
3. Click "Add Background" in banner area
4. Upload an image
5. Click "Save"
6. **Verify:** Background image appears on profile

---

## 🐛 TROUBLESHOOTING

### **Issue: Video Upload Fails**

**Solution:**
1. Check Cloudinary preset allows videos
2. Verify file size is under limit (10MB free tier)
3. Check browser console for error
4. Verify `resource_type: 'video'` in upload request

### **Issue: Document Upload Fails**

**Solution:**
1. Check Cloudinary preset allows raw files
2. Verify file format is allowed (PDF, DOC, DOCX, TXT)
3. Check file size is under limit
4. Verify `resource_type: 'raw'` in upload request

### **Issue: Poll Voting Doesn't Work**

**Solution:**
1. Check Firestore rules allow `update` on messages
2. Verify user is authenticated
3. Check browser console for errors
4. Verify message document exists in Firestore

### **Issue: Module Number Not Saving**

**Solution:**
1. Check Firestore rules allow resource creation
2. Verify `moduleNumber` field is included in document
3. Check browser console for errors
4. Verify resource document in Firestore

---

## 📝 NOTES

### **Cloudinary Free Tier Limits:**
- **Storage:** 25GB
- **Bandwidth:** 25GB/month
- **Video:** 10MB max file size
- **Transformations:** 25,000/month

### **Firebase Free Tier:**
- **Firestore:** 1GB storage, 50K reads/day, 20K writes/day
- **Authentication:** Unlimited users
- **Storage:** 5GB (if using Firebase Storage)

### **Best Practices:**
1. ✅ Use Cloudinary for all media (images, videos, documents)
2. ✅ Use Firestore for metadata only
3. ✅ Compress large files before upload
4. ✅ Set appropriate file size limits
5. ✅ Monitor usage in both dashboards

---

## 🚀 DEPLOYMENT CHECKLIST

Before deploying to production:

- [ ] Update CORS settings in Cloudinary with production domain
- [ ] Verify Firestore rules are production-ready
- [ ] Test all upload types (image, video, document)
- [ ] Test poll voting functionality
- [ ] Verify module number filtering works
- [ ] Check file size limits are appropriate
- [ ] Monitor Cloudinary usage
- [ ] Monitor Firestore usage

---

**All configurations are now complete! 🎉**

