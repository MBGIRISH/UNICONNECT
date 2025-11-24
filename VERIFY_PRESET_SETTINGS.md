# ✅ Verify Your Upload Preset Settings

## 🎯 What You Have (From Your Screenshot)

### ✅ CORRECT Settings:

1. **Upload preset name:** `uniconnect_uploads` ✅
2. **Signing mode:** "Unsigned" ✅ **PERFECT!**
3. **Asset folder:** `uniconnect/resources` ✅ (This is fine - code overrides it)
4. **Generated public ID:** "Auto-generate" ✅
5. **Generated display name:** "Use filename" ✅

---

## ⚠️ WHAT TO CHECK NEXT

### **Step 1: Check "Resource Type" Setting**

The preset needs to allow **all resource types** (images, videos, raw files).

**Where to find it:**

1. **In the same preset page**, look for tabs at the top:
   - "General" (you're currently here)
   - "Transform"
   - "Manage and Analyze"
   - **"Optimize and Deliver"** ← Check this tab
   - "Advanced"

2. **OR scroll down** in the "General" tab to find:
   - "Resource type" dropdown
   - "Allowed resource types"
   - "File type restrictions"

3. **What to set:**
   - **Resource type:** "Auto" or "All types" ✅
   - **OR** if dropdown shows options, select: "Auto"

---

### **Step 2: Check File Size Limits**

**Where to find:**

1. **Scroll down** in "General" tab
2. **OR** go to "Advanced" tab
3. **Look for:**
   - "Max file size"
   - "Upload size limit"
   - Set to: **100MB** (or at least 10MB for free tier)

---

### **Step 3: Check Access Mode**

**Where to find:**

1. **In "General" tab**, look for:
   - "Access mode"
   - "Delivery type"
   - Should be: **"Public"** ✅

---

## ✅ FINAL CHECKLIST

Before clicking "Save", verify:

- [x] **Signing mode:** Unsigned ✅ (You have this!)
- [ ] **Resource type:** Auto or All types (Check this!)
- [ ] **Access mode:** Public (Verify this!)
- [ ] **Max file size:** 100MB or 10MB (Check this!)
- [x] **Preset name:** uniconnect_uploads ✅ (You have this!)

---

## 🔍 WHERE TO LOOK FOR "RESOURCE TYPE"

### **Option 1: In "General" Tab**
- Scroll down past "Generated display name"
- Look for "Resource type" or "Allowed resource types"

### **Option 2: In "Optimize and Deliver" Tab**
- Click this tab at the top
- Look for resource type settings

### **Option 3: In "Advanced" Tab**
- Click "Advanced" tab
- Look for file type or resource type settings

---

## 💡 IF YOU CAN'T FIND "RESOURCE TYPE"

**Don't worry!** If you can't find it:

1. **The preset might already allow all types by default**
2. **Your code specifies `resource_type` in the upload request**, which overrides preset
3. **Just make sure:**
   - Signing mode = Unsigned ✅ (You have this!)
   - Access mode = Public (Check this!)
   - Click "Save"

---

## 🎯 RECOMMENDED ACTION

1. **Scroll down** in the "General" tab to see if there's more settings
2. **OR click** "Optimize and Deliver" tab to check resource type
3. **Look for** "Access mode" and set to "Public" if not already
4. **Click "Save"** button (top right)

---

## ✅ WHAT'S ALREADY CORRECT

- ✅ Preset name: `uniconnect_uploads`
- ✅ Signing mode: Unsigned (Perfect!)
- ✅ Asset folder: Set (Code will override anyway)

**You're almost there! Just need to verify resource type and access mode!**

