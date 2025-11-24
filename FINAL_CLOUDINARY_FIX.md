# 🔧 FINAL CLOUDINARY 400 ERROR FIX

## ❌ **PROBLEM:**
Getting `400 Bad Request` from Cloudinary when uploading images/videos/documents.

---

## ✅ **ROOT CAUSE:**
Your Cloudinary upload preset `uniconnect_uploads` is set to **"Signed"** instead of **"Unsigned"**.

When a preset is "Signed", it requires authentication credentials that you don't have in the browser, causing the 400 error.

---

## 🔧 **FIX (5 MINUTES):**

### **Step 1: Go to Cloudinary Console**
1. **Open:** https://cloudinary.com/console/settings/upload
2. **Login** if needed

### **Step 2: Edit Upload Preset**
1. **Scroll down** to "Upload presets" section
2. **Find:** `uniconnect_uploads`
3. **Click** on it to edit

### **Step 3: Change Signing Mode**
1. **Click "General" tab** (first tab, gear icon)
2. **Find:** "Signing mode" dropdown
3. **Change from:** "Signed" 
4. **Change to:** **"Unsigned"** ✅
5. **Click "Save"** (top right)

### **Step 4: Set Access Control**
1. **Click "Optimize and Deliver" tab** (4th tab)
2. **Find:** "Access control" dropdown
3. **Set to:** **"Public"** ✅
4. **Click "Save"** (top right)

---

## ✅ **VERIFICATION:**

After fixing, test in browser console:

```javascript
const formData = new FormData();
formData.append('file', new Blob(['test'], {type: 'image/png'}), 'test.png');
formData.append('upload_preset', 'uniconnect_uploads');

fetch('https://api.cloudinary.com/v1_1/dlnlwudgr/image/upload', {
  method: 'POST',
  body: formData
})
.then(async r => {
  const data = await r.json();
  if (r.ok) {
    console.log('✅ SUCCESS!', data.secure_url);
    alert('✅ Upload works!');
  } else {
    console.error('❌ ERROR:', data);
    alert('❌ Error: ' + JSON.stringify(data, null, 2));
  }
});
```

**Expected:** Should show `✅ SUCCESS!` with a URL

---

## 📋 **CHECKLIST:**

- [ ] Cloudinary preset `uniconnect_uploads` exists
- [ ] **Signing Mode = "Unsigned"** (NOT Signed!)
- [ ] **Access control = "Public"**
- [ ] Preset is **Saved**
- [ ] Test upload works (run test code above)

---

## 🚨 **IF STILL NOT WORKING:**

1. **Check preset name** is exactly `uniconnect_uploads` (no typos)
2. **Check cloud name** is `dlnlwudgr` (in the URL)
3. **Try creating a new preset:**
   - Name: `uniconnect_uploads`
   - Signing Mode: `Unsigned`
   - Access control: `Public`
   - Save

---

## ✅ **AFTER FIX:**

Once you change to "Unsigned" and save:
1. **Refresh your app** (F5)
2. **Try uploading** an image/video
3. **Should work now!** ✅

---

## 📞 **SUMMARY:**

**Problem:** Preset is "Signed" → Needs auth → 400 Error
**Solution:** Change to "Unsigned" → No auth needed → Works! ✅

**Go fix it now and test!**

