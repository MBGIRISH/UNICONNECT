# ⏰ Timetable Class Reminders - Complete Guide

---

## ✅ **WHAT'S BEEN ADDED:**

Your Timetable now has an **intelligent reminder system** that automatically notifies you about upcoming and ongoing classes!

---

## 🔔 **REMINDER FEATURES:**

### **1. Upcoming Class Alerts (15 Minutes Before)**

When a class is starting within the next 15 minutes, you'll see:

**Visual Banner:**
```
┌─────────────────────────────────────────────┐
│ 🔔 Class Starting Soon                      │
│ Computer Science starts in less than        │
│ 15 minutes                                  │
│ ⏰ 09:00 - 10:30  📍 Room 301  👤 Dr. Smith │
└─────────────────────────────────────────────┘
```

**Features:**
- ✅ **Amber/yellow banner** at top of timetable
- ✅ Shows class details (time, location, professor)
- ✅ Dismissible (click X to close)
- ✅ **Firestore notification** added to your account
- ✅ **Browser notification** (if permission granted)

---

### **2. Ongoing Class Indicator**

When a class is currently in progress, you'll see:

**Visual Banner:**
```
┌─────────────────────────────────────────────┐
│ ✓ Class in Progress                         │
│ Computer Science is currently ongoing       │
│ ⏰ Ends at 10:30  📍 Room 301               │
└─────────────────────────────────────────────┘
```

**Features:**
- ✅ **Green banner** at top of timetable
- ✅ Shows when class ends
- ✅ Updates automatically
- ✅ Visible throughout the class duration

---

### **3. Class Card Badges**

Classes in your timetable now show status badges:

**Ongoing Class:**
```
┌──────────────────────────────────────┐
│ Computer Science  [● Live]           │
│ ⏰ 09:00 - 10:30                     │
│ 📍 Room 301                          │
│ 👤 Dr. Smith                         │
└──────────────────────────────────────┘
```
- Green "Live" badge with pulsing dot
- Green highlight border

**Upcoming Class (Within 15 min):**
```
┌──────────────────────────────────────┐
│ Mathematics  [Soon]                  │
│ ⏰ 11:00 - 12:30                     │
│ 📍 Room 205                          │
│ 👤 Prof. Johnson                     │
└──────────────────────────────────────┘
```
- Amber "Soon" badge
- Amber highlight border

---

## 🎯 **HOW IT WORKS:**

### **Automatic Checking:**
- System checks **every minute** for upcoming/ongoing classes
- Compares current time with your timetable
- Automatically detects your current day and time

### **15-Minute Warning:**
- If a class starts within the next 15 minutes
- You get an **amber banner** notification
- Only notified **once per class** (won't spam)

### **Ongoing Detection:**
- If current time is between start and end time
- Shows **green banner** that class is in progress
- Updates automatically when class ends

### **Browser Notifications:**
- App requests notification permission on first load
- If granted, sends **browser popup notification**
- Works even if browser is in background
- Format: "Class Reminder: [Subject] starts at [Time] in [Location]"

### **Firestore Notifications:**
- Adds notification to your Firestore account
- Stored in `users/{uid}/notifications` collection
- Can be viewed in notifications panel (if implemented)
- Persists for future reference

---

## 📊 **VISUAL INDICATORS:**

### **Banner Colors:**

**Green (Ongoing):**
- Class is happening right now
- Shows end time
- Non-dismissible (auto-hides when class ends)

**Amber/Yellow (Upcoming):**
- Class starts within 15 minutes
- Shows start time and location
- Dismissible (click X)

### **Card Highlights:**

**Live Badge:**
- Green "Live" badge
- Pulsing dot animation
- Green ring border
- Green background tint

**Soon Badge:**
- Amber "Soon" badge
- Amber ring border
- Amber background tint

---

## 🔔 **NOTIFICATION TYPES:**

### **1. In-App Banner (Always)**
- Visible at top of Timetable page
- Shows class details
- Real-time updates

### **2. Browser Notification (Optional)**
- Popup notification outside app
- Requires permission
- Works in background
- Click to open app

### **3. Firestore Notification (Always)**
- Saved to your account
- Can be viewed in notification center
- Persistent record
- Type: `class_reminder`

---

## ⚙️ **SETTINGS & PERMISSIONS:**

### **Browser Notification Permission:**

**First Time:**
- App automatically requests permission
- Browser shows popup: "Allow notifications?"
- Click **"Allow"** to enable

**Later:**
- Check browser settings
- Site settings → Notifications
- Change to "Allow"

**If Blocked:**
- Desktop: Click 🔒 icon in address bar
- Mobile: Browser settings → Site settings
- Find your app → Enable notifications

---

## 📱 **EXAMPLE SCENARIO:**

### **Morning Class:**

**8:45 AM:**
- You're checking your timetable
- No notifications yet

**8:46 AM:**
- Computer Science class at 9:00 AM
- 14 minutes away - notification triggers!

**What You See:**
1. **Amber banner** at top: "Class starting soon"
2. **Browser popup**: "Computer Science starts at 09:00 in Room 301"
3. **"Soon" badge** on class card in Monday column
4. **Amber highlight** around the class card

**8:50 AM:**
- Still showing "Soon" badge
- Banner still visible (if not dismissed)

**9:00 AM:**
- Class starts!
- Banner changes to **green**: "Class in Progress"
- Card shows **"Live" badge** with pulsing dot
- Green highlight replaces amber

**9:05 AM:**
- "Live" badge still showing
- Green banner shows "Ends at 10:30"

**10:30 AM:**
- Class ends
- All indicators disappear
- Back to normal view

**10:46 AM:**
- Mathematics class at 11:00 AM
- New notification: "Mathematics starting soon"
- Process repeats!

---

## 🎨 **UI ELEMENTS:**

### **Upcoming Class Banner:**
```css
Background: Amber (yellow-orange)
Border: Left border amber (thick)
Icon: 🔔 Bell
Title: "Class Starting Soon"
Content: Subject name + "starts in less than 15 minutes"
Details: Time, Location, Professor
Button: X (close/dismiss)
```

### **Ongoing Class Banner:**
```css
Background: Green
Border: Left border green (thick)
Icon: ✓ Check/Alert circle
Title: "Class in Progress"
Content: Subject name + "is currently ongoing"
Details: End time, Location
Button: None (auto-hides)
```

### **Live Badge:**
```css
Background: Green
Text: White
Icon: Pulsing dot (animated)
Label: "Live"
Size: Small, rounded pill
```

### **Soon Badge:**
```css
Background: Amber
Text: White
Label: "Soon"
Size: Small, rounded pill
```

---

## ✅ **FEATURES CHECKLIST:**

✅ Automatic time checking (every minute)  
✅ 15-minute advance warning  
✅ Ongoing class detection  
✅ Visual banner notifications  
✅ Class card status badges  
✅ Browser popup notifications  
✅ Firestore notification storage  
✅ One notification per class (no spam)  
✅ Auto-dismiss when class starts/ends  
✅ Current day detection  
✅ Real-time updates  
✅ Color-coded indicators  
✅ Pulsing "Live" animation  
✅ Dismissible upcoming alerts  

---

## 🧪 **HOW TO TEST:**

### **Method 1: Wait for Real Class**
1. Add a class to your timetable
2. Set start time to ~15 minutes from now
3. Wait 15 minutes
4. See notification appear!

### **Method 2: Test Now (Manual)**
1. Check current time (e.g., 2:30 PM)
2. Add a class:
   - Day: Today's day
   - Start time: 2:45 PM (15 min from now)
   - End time: 3:45 PM
3. Refresh page
4. Wait a few minutes
5. Notification appears when <= 15 min away!

### **Method 3: Test Ongoing**
1. Check current time (e.g., 2:30 PM)
2. Add a class:
   - Day: Today's day
   - Start time: 2:00 PM (already started)
   - End time: 3:00 PM (not ended yet)
3. Refresh page
4. See green "Class in Progress" banner!

---

## 💡 **PRO TIPS:**

### **Enable Browser Notifications:**
- Always click "Allow" for best experience
- Works even when app is closed
- Get reminded outside browser

### **Don't Dismiss Too Early:**
- Upcoming alerts are useful reminders
- Only dismiss if you've already seen it
- Re-appears next time (different class)

### **Check Timetable in Morning:**
- See all upcoming classes for the day
- Banners show next/current class
- Plan your day better

### **Use "Live" Indicator:**
- Quickly see which class is now
- Know when it ends
- Useful if you're running late

---

## 🔧 **TECHNICAL DETAILS:**

### **Check Interval:**
- Runs every **60 seconds** (1 minute)
- Efficient, doesn't drain battery
- Stops when page closed

### **Notification Timing:**
- Triggered when **0-15 minutes** before class
- Not triggered if > 15 minutes away
- Not re-triggered for same class

### **Day Matching:**
- Uses your device's current day
- Converts to timetable day (Monday-Saturday)
- Sunday defaults to Saturday

### **Time Comparison:**
- Uses 24-hour format (HH:MM)
- Compares current time to class times
- Accurate to the minute

### **Firestore Structure:**
```javascript
users/{uid}/notifications/{notifId}
- type: 'class_reminder'
- message: 'Class starting soon: [Subject] at [Time] in [Location]'
- createdAt: Timestamp
- read: false
```

---

## 📍 **WHERE TO SEE NOTIFICATIONS:**

### **1. Timetable Page (Primary)**
- http://localhost:3000/#/timetable
- Banners at top
- Badges on cards

### **2. Browser Notifications**
- Desktop: Top right corner (or notification center)
- Mobile: Notification bar

### **3. Firestore (Backend)**
- `users/{uid}/notifications` collection
- Can build notification center to display these

---

## 🎉 **SUMMARY:**

**Your Timetable now actively reminds you about classes!**

✅ **15-minute warning** - Never miss a class  
✅ **Ongoing indicator** - Know what's happening now  
✅ **Visual badges** - Quick status at a glance  
✅ **Browser notifications** - Alerts outside app  
✅ **Automatic** - No manual work needed  

---

## 🚀 **WHAT'S NEXT:**

**Future Enhancements (Optional):**
- Customizable reminder time (5, 10, 15 min)
- Snooze option for reminders
- Notification center page to view all past reminders
- Email/SMS notifications
- Homework/assignment reminders
- Exam reminders

---

**Your class reminder system is live and working!** ⏰

Open your Timetable and add classes to test it out! 🎓

