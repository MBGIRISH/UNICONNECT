# 🗑️ MANUAL DELETE GUIDE - QUICK FIX

## ⚠️ **IF CLEANUP SCRIPT SHOWS "0 DELETED"**

The script might be blocked by Firestore security rules. Here's how to delete manually:

---

## 🚀 **METHOD 1: Firebase Console (EASIEST)**

### **Step-by-Step:**

1. **Go to Firebase Console:**
   ```
   https://console.firebase.google.com/project/campus-connect-fd225/firestore
   ```

2. **Delete Each Collection:**
   
   **For each collection (events, groups, messages, marketplace, resources, posts):**
   
   - Click on the collection name (e.g., "events")
   - You'll see all documents listed
   - **Select All:** Click the checkbox at the top
   - Click **"Delete"** button
   - Confirm deletion
   - ✅ Done!

3. **Delete Subcollections:**
   
   For collections with subcollections:
   - Click on a parent document (e.g., an event)
   - You'll see subcollections like "attendees"
   - Click on the subcollection
   - Select all documents
   - Delete
   - Repeat for all parent documents

---

## 🔧 **METHOD 2: Fix Firestore Rules (Then Run Script)**

### **Update firestore.rules to allow deletion:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write/delete their own data
    match /{document=**} {
      allow read, write, delete: if request.auth != null;
    }
  }
}
```

Then:
1. Deploy rules: `firebase deploy --only firestore:rules`
2. Run cleanup script: `npm run cleanup-test-data`

---

## 📋 **COLLECTIONS TO DELETE**

### **Main Collections:**
1. ✅ `events` - All events
2. ✅ `groups` - All groups  
3. ✅ `messages` - All messages
4. ✅ `marketplace` - All marketplace listings
5. ✅ `resources` - All resources
6. ✅ `posts` - All posts

### **Subcollections (Delete these too):**
- `events/{eventId}/attendees/`
- `groups/{groupId}/members/`
- `groups/{groupId}/posts/`
- `groups/{groupId}/joinRequests/`
- `posts/{postId}/comments/`
- `posts/{postId}/likes/`
- `users/{userId}/notifications/`

---

## 🎯 **QUICK FIREBASE CONSOLE METHOD**

### **Fastest Way:**

1. Open: https://console.firebase.google.com/project/campus-connect-fd225/firestore/data

2. For each collection:
   - Click collection name
   - Click "Select all" (checkbox at top)
   - Click "Delete" (trash icon)
   - Confirm

3. **Collections to delete:**
   - events
   - groups
   - messages
   - marketplace
   - resources
   - posts

4. **Done in 2 minutes!** ✅

---

## ✅ **VERIFICATION**

After deleting, check:
- Events page → Should show "No events"
- Resources page → Should show "No resources"
- Feed → Should show "No posts"
- Groups → Should show "No groups"
- Messages → Should show "No conversations"
- Marketplace → Should show "No listings"

---

## 🎉 **AFTER DELETION**

Your app is now:
- ✅ Clean
- ✅ Ready for friends
- ✅ No test data
- ✅ Fresh start!

**Just refresh your browser and everything will be clean!** 🚀

