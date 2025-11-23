# 📧 Exact Template Content to Copy-Paste

## ✅ What to Replace

In the EmailJS editor, **replace the entire email body** with this content:

---

## 📝 Copy This Exact Content:

```
You have requested a password change

We received a request to reset the password for your account.

Your verification code is: {{reset_code}}

This code will expire in 10 minutes.

If you didn't request this password reset, please ignore this email or let us know immediately. Your account remains secure.

Best regards,
UniConnect Team
```

---

## 🔧 Step-by-Step Instructions:

### Step 1: Select and Delete Old Content
1. In the email editor, **select all the text** from "You have requested..." to the end
2. **Delete it** (or press Backspace/Delete)

### Step 2: Paste New Content
1. **Paste** the content above into the editor
2. Make sure `{{reset_code}}` is included (this is the placeholder for the 6-digit code)

### Step 3: Update Footer (if visible)
If you see a footer section with:
```
The email was sent to {{email}}
```

**Change it to:**
```
The email was sent to {{to_email}}
```

### Step 4: Update Company Name
If you see `[Company Name]` anywhere, replace it with:
```
UniConnect
```

### Step 5: Click "Apply Changes"
Click the blue **"Apply Changes"** button at the bottom right

---

## ✅ What You Should See:

**Before (Old):**
```
...please click the link below to create a new password: {{link}}
This link will expire in one hour.
```

**After (New):**
```
Your verification code is: {{reset_code}}
This code will expire in 10 minutes.
```

---

## ⚠️ Important Notes:

1. **Keep `{{reset_code}}` exactly as shown** - don't change it to `{{link}}` or anything else
2. **The code will be a 6-digit number** (e.g., 123456) when the email is sent
3. **Remove any mention of "click the link"** - we're using codes, not links
4. **Change expiration from "one hour" to "10 minutes"**

---

## 🎯 Final Checklist:

- [ ] Deleted old content about clicking link
- [ ] Pasted new content with `{{reset_code}}`
- [ ] Changed `{{email}}` to `{{to_email}}` (in footer)
- [ ] Changed `[Company Name]` to `UniConnect`
- [ ] Changed expiration from "one hour" to "10 minutes"
- [ ] Clicked "Apply Changes"
- [ ] Saved the template

---

**After this, your password reset emails will show the 6-digit code instead of a link!** 🎉

