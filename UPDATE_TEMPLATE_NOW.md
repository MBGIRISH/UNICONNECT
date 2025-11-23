# 🔧 Update Your EmailJS Template - Step by Step

## ⚠️ IMPORTANT: You Need to Change the Template!

Your current template uses `{{link}}` but our code sends `{{reset_code}}`. Here's what to change:

---

## ✅ Step 1: Update Subject Line

**Current:** `Reset your password`

**Change to:**
```
UniConnect Password Reset Code
```

---

## ✅ Step 2: Update Email Content

**Click "Edit Content"** (top right of the email preview area)

**Replace the entire email body with:**

```
You have requested a password change

We received a request to reset the password for your account. 

Your verification code is: {{reset_code}}

This code will expire in 10 minutes.

If you didn't request this password reset, please ignore this email or let us know immediately. Your account remains secure.

Best regards,
UniConnect Team
```

**IMPORTANT:** 
- Remove the `{{link}}` variable
- Add `{{reset_code}}` where you want the code to appear
- The code will be a 6-digit number (e.g., 123456)

---

## ✅ Step 3: Update "To Email" Field

**Current:** `{{email}}`

**Change to:**
```
{{to_email}}
```

This matches what our code sends.

---

## ✅ Step 4: Optional - Update "From Name"

**Add:**
```
UniConnect
```

This will show as the sender name.

---

## ✅ Step 5: Save the Template

1. Click the blue **"Save"** button (top right)
2. Copy the **Template ID** from the URL or template settings
   - It will look like: `template_xxxxx`
   - You'll need this for your `.env` file

---

## ✅ Step 6: Test the Template

1. Click **"Test It"** button (top right)
2. Enter your email address
3. Click "Send Test Email"
4. Check your inbox - you should see the template with `{{reset_code}}` placeholder

---

## 📝 Quick Checklist

- [ ] Subject changed to "UniConnect Password Reset Code"
- [ ] Email body updated with `{{reset_code}}` (not `{{link}}`)
- [ ] "To Email" changed to `{{to_email}}` (not `{{email}}`)
- [ ] "From Name" set to "UniConnect" (optional)
- [ ] Template saved
- [ ] Template ID copied
- [ ] Test email sent and received

---

## ⚠️ Common Mistakes

1. **Using `{{link}}` instead of `{{reset_code}}`**
   - ❌ Wrong: `{{link}}`
   - ✅ Correct: `{{reset_code}}`

2. **Using `{{email}}` instead of `{{to_email}}`**
   - ❌ Wrong: `{{email}}`
   - ✅ Correct: `{{to_email}}`

3. **Variable name case sensitivity**
   - ❌ Wrong: `{{Reset_Code}}` or `{{resetCode}}`
   - ✅ Correct: `{{reset_code}}` (lowercase with underscore)

---

## 🎯 What Our Code Sends

When password reset is requested, our code sends:
- `reset_code` → The 6-digit verification code
- `to_email` → Recipient's email address
- `app_name` → "UniConnect"

Your template must use these exact variable names!

---

**After making these changes, your password reset emails will work correctly!** 🎉

