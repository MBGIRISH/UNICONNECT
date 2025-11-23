# 🧹 CLEANUP TEST DATA - COMPLETE GUIDE

## ✅ **QUICK CLEANUP**

Run this command to delete ALL test data:

```bash
npm run cleanup-test-data
```

This will remove:
- ✅ All Events
- ✅ All Groups
- ✅ All Messages
- ✅ All Marketplace listings
- ✅ All Resources
- ✅ All Posts
- ✅ All Comments
- ✅ All Notifications
- ✅ All Subcollections (attendees, members, etc.)

---

## 🎯 **WHAT GETS DELETED**

### **Main Collections:**
- `events/` - All events
- `groups/` - All study groups
- `messages/` - All private messages
- `marketplace/` - All marketplace listings
- `resources/` - All shared resources (PDFs/Notes)
- `posts/` - All feed posts

### **Subcollections:**
- `events/{eventId}/attendees/` - Event attendees
- `groups/{groupId}/members/` - Group members
- `groups/{groupId}/posts/` - Group posts
- `groups/{groupId}/joinRequests/` - Join requests
- `posts/{postId}/comments/` - Post comments
- `posts/{postId}/likes/` - Post likes
- `users/{userId}/notifications/` - User notifications

### **What's NOT Deleted:**
- ✅ User accounts (`users/` collection)
- ✅ User profiles
- ✅ Authentication data

---

## 🚀 **HOW TO RUN**

### **Option 1: Using npm script (Recommended)**
```bash
npm run cleanup-test-data
```

### **Option 2: Direct command**
```bash
npx tsx scripts/cleanup-test-data.ts
```

---

## 📊 **OUTPUT EXAMPLE**

```
🧹 Starting cleanup of all test data...

⚠️  WARNING: This will delete ALL data from the following collections:
   - events
   - groups
   - messages
   - marketplace
   - resources
   - posts
   - comments
   - notifications

🗑️  Deleting all events...
✅ Deleted 5 events

🗑️  Deleting all groups...
✅ Deleted 3 groups

🗑️  Deleting all messages...
✅ Deleted 12 messages

🗑️  Deleting all marketplace...
✅ Deleted 8 marketplace

🗑️  Deleting all resources...
✅ Deleted 15 resources

🗑️  Deleting all posts...
✅ Deleted 20 posts

🗑️  Deleting all events/*/attendees...
✅ Deleted 25 attendees from events

🗑️  Deleting all groups/*/members...
✅ Deleted 18 members from groups

🗑️  Deleting all user notifications...
✅ Deleted 30 notifications

✨ Cleanup complete!
📊 Total documents deleted: 156

✅ Your Firebase is now clean and ready for friends to test!

🎉 Done!
```

---

## ⚠️ **IMPORTANT NOTES**

### **Before Running:**
1. ✅ Make sure you're connected to the correct Firebase project
2. ✅ This action **CANNOT BE UNDONE**
3. ✅ All test data will be permanently deleted
4. ✅ User accounts will remain (only content is deleted)

### **After Running:**
1. ✅ Your Firebase will be clean
2. ✅ Friends can start fresh
3. ✅ No test data will interfere
4. ✅ Users can create new content

---

## 🔧 **TROUBLESHOOTING**

### **Error: "Permission denied"**
**Solution:** Make sure your Firestore rules allow deletion, or run from Firebase Console

### **Error: "Cannot find module"**
**Solution:** Run `npm install` first

### **Error: "Firebase not initialized"**
**Solution:** Check that `firebaseConfig` in the script matches your project

---

## 🎯 **ALTERNATIVE: Manual Cleanup via Firebase Console**

If the script doesn't work, you can manually delete:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `campus-connect-fd225`
3. Go to **Firestore Database**
4. For each collection:
   - Click on collection name
   - Select all documents
   - Click "Delete"
5. Repeat for all collections listed above

---

## ✅ **VERIFICATION**

After cleanup, verify:

1. ✅ Events page shows "No events"
2. ✅ Groups page shows "No groups"
3. ✅ Messages page shows "No conversations"
4. ✅ Marketplace shows "No listings"
5. ✅ Resources page shows "No resources"
6. ✅ Feed shows "No posts"

---

## 🎉 **READY FOR FRIENDS!**

After cleanup:
- ✅ Clean environment
- ✅ No test data
- ✅ Fresh start for everyone
- ✅ Friends can test all features

**Your app is ready to share!** 🚀

---

## 💡 **TIP**

**To keep some data:**
- Modify the script to skip specific collections
- Or manually delete only what you want to remove
- Or use Firebase Console to delete selectively

---

## 📝 **SCRIPT LOCATION**

The cleanup script is located at:
```
scripts/cleanup-test-data.ts
```

You can modify it if needed!

---

**Run `npm run cleanup-test-data` now to clean your Firebase!** 🧹✨

