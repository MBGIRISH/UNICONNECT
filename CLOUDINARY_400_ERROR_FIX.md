# 🚨 CLOUDINARY 400 ERROR - FIX GUIDE

## ❌ **ERROR:**
`400 Bad Request` from Cloudinary API

This means the upload request is invalid or the preset is misconfigured.

---

## 🔍 **STEP 1: Get Full Error Details**

**In browser console, run this to see the actual error:**

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
  console.log('Response status:', r.status);
  console.log('Response data:', data);
  if (!r.ok) {
    console.error('❌ ERROR:', data);
    alert('Error: ' + JSON.stringify(data, null, 2));
  } else {
    console.log('✅ SUCCESS:', data);
  }
})
.catch(err => {
  console.error('❌ FETCH ERROR:', err);
  alert('Fetch error: ' + err.message);
});
```

**This will show you the EXACT error message from Cloudinary.**

---

## 🔧 **COMMON 400 ERROR CAUSES:**

### **1. Upload Preset Not Set to "Unsigned"** ⭐ MOST COMMON

**Fix:**
1. Go to: https://cloudinary.com/console/settings/upload
2. Edit preset: `uniconnect_uploads`
3. **General tab:** Signing Mode = `Unsigned` (NOT Signed!)
4. **Save**

---

### **2. Upload Preset Doesn't Exist**

**Fix:**
1. Go to: https://cloudinary.com/console/settings/upload
2. Check if `uniconnect_uploads` preset exists
3. If not, create it:
   - Name: `uniconnect_uploads`
   - Signing Mode: `Unsigned`
   - Access control: `Public`
   - Save

---

### **3. Invalid File Format**

**Fix:**
- Use a real image file (not a Blob with 'test' text)
- Try with an actual PNG/JPG file

---

### **4. Missing Required Parameters**

**Fix:**
- Make sure `upload_preset` is correct
- Check Cloudinary cloud name is correct: `dlnlwudgr`

---

## ✅ **QUICK FIX CHECKLIST:**

1. [ ] **Cloudinary preset exists:** `uniconnect_uploads`
2. [ ] **Signing Mode:** `Unsigned` (NOT Signed!)
3. [ ] **Access control:** `Public`
4. [ ] **Preset is saved** (clicked Save button)

---

## 🧪 **BETTER TEST (With Real File):**

**Instead of Blob, use a real file:**

```javascript
// Create file input
const input = document.createElement('input');
input.type = 'file';
input.accept = 'image/*';
input.onchange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'uniconnect_uploads');
  
  try {
    const response = await fetch('https://api.cloudinary.com/v1_1/dlnlwudgr/image/upload', {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    console.log('Response:', response.status, data);
    
    if (response.ok) {
      alert('✅ SUCCESS! URL: ' + data.secure_url);
    } else {
      alert('❌ ERROR: ' + JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('Error:', error);
    alert('❌ Error: ' + error.message);
  }
};
input.click();
```

---

## 🎯 **MOST LIKELY FIX:**

**The preset is probably set to "Signed" instead of "Unsigned"!**

1. **Go to Cloudinary Console**
2. **Settings → Upload**
3. **Edit `uniconnect_uploads` preset**
4. **General tab → Signing Mode → Change to "Unsigned"**
5. **Save**

---

## 📞 **NEXT STEPS:**

1. **Run the better test code above** (with full error details)
2. **Check Cloudinary preset** (Signing Mode = Unsigned)
3. **Share the exact error message** from the test

