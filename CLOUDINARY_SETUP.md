# 🎉 Cloudinary Setup - Final Step!

Your Cloudinary credentials are configured:
- ✅ Cloud Name: `dlnlwudgr`
- ✅ API Key: `589967352537727`

---

## ⚡ ONE MORE STEP: Enable Unsigned Uploads

Cloudinary requires you to enable "unsigned uploads" for security.

### 📋 Do This Now:

1. **Go to:** https://cloudinary.com/console/settings/upload
2. **Scroll down** to "Upload presets" section
3. **Click** "Add upload preset"
4. **Fill in:**
   - Upload preset name: `uniconnect_uploads`
   - Signing Mode: **Unsigned**
   - Folder: `uniconnect` (optional)
5. **Click** "Save"

---

## 🔧 Alternative (Easier): Use Existing Preset

OR just enable the default unsigned preset:

1. Go to: https://cloudinary.com/console/settings/upload
2. Find the preset named **"ml_default"** or any unsigned preset
3. If it's "signed", change it to **"Unsigned"**
4. Click **"Save"**

---

## 🚀 Then Restart Your App:

After enabling the upload preset, restart your dev server:

```bash
# Press Ctrl+C in the terminal to stop the current server
# Then run:
npm run dev
```

---

## ✅ What Will Work After This:

- ✅ Profile avatar uploads
- ✅ Post images
- ✅ Event cover images
- ✅ Marketplace product photos
- ✅ Group cover images

**All without Firebase billing!** 🎉

---

## 🧪 Test Image Upload:

1. Open http://localhost:3000
2. Sign up / Login
3. Go to Profile → Edit → Upload avatar
4. It should work! 📸

---

**Let me know once you've enabled the upload preset, and I'll help you test!**

