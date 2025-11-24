# 🔔 How to Test Timetable Notifications

## 📋 Quick Test Guide

### **Step 1: Enable Browser Notifications**

1. **Open the app** in your browser
2. **Navigate to Timetable page** (`/timetable`)
3. **Browser will ask:** "Allow notifications?"
4. **Click "Allow"** ✅

---

### **Step 2: Create a Test Class**

1. **Click "Add Class"** button
2. **Fill in the form:**
   - **Subject:** "Test Class"
   - **Day:** Today's day (e.g., "Monday")
   - **Start Time:** Set to **5-10 minutes from now**
     - Example: If it's 2:30 PM, set start time to **2:35 PM** or **2:40 PM**
   - **End Time:** 1 hour after start time
   - **Location:** "Room 101"
   - **Professor:** "Dr. Test"
   - **Color:** Any color

3. **Click "Add Class"**

---

### **Step 3: Wait for Notification**

The notification will trigger **5-10 minutes before** the class start time.

**What happens:**
- ✅ **Browser notification popup** appears (if permission granted)
- ✅ **In-app notification** saved to Firestore
- ✅ **Amber banner** appears on timetable page
- ✅ **Notification bell** shows unread count

---

### **Step 4: Verify Notifications**

#### **A. Browser Notification:**
- Look for popup in **top-right corner** (desktop) or **notification bar** (mobile)
- Should show: "📚 Class Reminder"
- Message: "Test Class starts in X minutes..."

#### **B. In-App Notification:**
1. Click the **🔔 bell icon** in the header
2. You should see: "Class Starting Soon"
3. Message: "Test Class starts in X minutes at [time] in Room 101"

#### **C. Timetable Page:**
- **Amber banner** at top: "Class Starting Soon"
- Shows class details with "Soon" badge

---

## 🧪 **Quick Test (Fast Method)**

### **Option 1: Set Class for Current Time + 5-7 Minutes**

1. Check current time (e.g., 2:30 PM)
2. Add class with start time: **2:35 PM** or **2:37 PM**
3. Wait 30 seconds - 2 minutes
4. Notification should appear! 🔔

### **Option 2: Temporarily Modify Code (For Testing)**

If you want to test immediately, you can temporarily change the notification window:

**In `pages/Timetable.tsx`, line ~67:**
```typescript
// Change from:
return diffMinutes >= 5 && diffMinutes <= 10;

// To (for testing - notify 0-2 minutes before):
return diffMinutes >= 0 && diffMinutes <= 2;
```

**Then:**
1. Add a class starting in 1-2 minutes
2. Wait 30 seconds
3. Notification appears!
4. **Remember to change it back** after testing

---

## ✅ **What to Check**

### **1. Browser Notification Permission**
- Go to browser settings → Site settings → Notifications
- Should show "Allowed" for your app

### **2. Notification Timing**
- Notification appears **5-10 minutes** before class
- **Not** 15 minutes (old behavior)
- **Not** after class starts

### **3. Notification Content**
- Shows **subject name**
- Shows **minutes until class** (e.g., "starts in 7 minutes")
- Shows **start time**
- Shows **location**
- Shows **professor** (if provided)

### **4. One Notification Per Class**
- Each class only triggers **one notification**
- No duplicate notifications for the same class

### **5. Daily Reset**
- Notifications reset each day
- You'll get notifications again tomorrow for the same classes

---

## 🔍 **Debugging**

### **Check Browser Console:**
1. Open **Developer Tools** (F12)
2. Go to **Console** tab
3. Look for:
   - `✅ Notification permission granted` (if allowed)
   - `❌ Notification permission denied` (if blocked)
   - Any error messages

### **Check Firestore:**
1. Go to Firebase Console
2. Navigate to: `users/{yourUserId}/notifications`
3. Should see notifications with:
   - `type: "class_reminder"`
   - `message: "Test Class starts in X minutes..."`
   - `read: false`

### **Check Notification State:**
- Open browser console
- Type: `localStorage` (to see if state is stored)
- Check if `notifiedClasses` is tracking class IDs

---

## 📱 **Mobile Testing**

### **On Mobile Browser:**
1. Open app in mobile browser
2. Allow notifications when prompted
3. Add test class (5-10 min from now)
4. **Lock phone** or **switch apps**
5. Notification should appear in **notification bar**

---

## 🎯 **Expected Behavior**

### **Timeline Example:**
- **2:30 PM:** You add class starting at **2:37 PM**
- **2:32 PM:** Notification appears! (5 minutes before)
- **2:37 PM:** Class starts, banner changes to "Class in Progress"

### **Notification Window:**
- **5-10 minutes before:** Notification sent ✅
- **Less than 5 minutes:** No notification (too late)
- **More than 10 minutes:** No notification (too early)
- **After class starts:** No notification (already started)

---

## 🐛 **Troubleshooting**

### **No Browser Notification:**
1. Check browser permission: Settings → Notifications
2. Make sure you clicked "Allow"
3. Try refreshing the page
4. Check console for errors

### **No In-App Notification:**
1. Check Firestore: `users/{userId}/notifications`
2. Check notification bell icon in header
3. Make sure you're logged in

### **Notification Too Early/Late:**
- Current window: **5-10 minutes** before class
- If you need different timing, modify line ~67 in `Timetable.tsx`

### **Multiple Notifications:**
- Should only get **one notification per class**
- If getting duplicates, check `notifiedClasses` state

---

## 📝 **Test Checklist**

- [ ] Browser notification permission granted
- [ ] Added test class 5-10 minutes from now
- [ ] Browser notification popup appears
- [ ] In-app notification appears in bell icon
- [ ] Amber banner shows on timetable page
- [ ] Notification shows correct minutes until class
- [ ] Only one notification per class
- [ ] Notification resets next day

---

## 🚀 **Quick Start Test**

**Fastest way to test:**

1. **Set class start time to 5-7 minutes from now**
2. **Wait 30-60 seconds** (check runs every 30 seconds)
3. **Notification should appear!** 🔔

**Example:**
- Current time: **3:00 PM**
- Add class starting: **3:05 PM** or **3:07 PM**
- Wait 1-2 minutes
- ✅ Notification appears!

---

## 💡 **Tips**

- **Best time to test:** Set class for 5-7 minutes from now
- **Check runs every 30 seconds** - so max wait is 30 seconds
- **Notifications reset daily** - test again tomorrow
- **Mobile works too** - test on phone browser

---

**Need help?** Check browser console for errors or check Firestore for notification documents!

