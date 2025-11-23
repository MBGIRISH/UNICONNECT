# 📧 Understanding EmailJS Template Variables

## What is `{{reset_code}}`?

`{{reset_code}}` is a **placeholder variable** in your email template. Think of it like a blank space that EmailJS will fill in with the actual 6-digit code when sending the email.

---

## 🔍 How It Works

### Step 1: Your App Generates a Code
When a user requests password reset, your app:
- Generates a random 6-digit code (e.g., `123456`)
- Stores it in Firestore
- Sends it to EmailJS with the variable name `reset_code`

### Step 2: EmailJS Replaces the Variable
EmailJS looks at your template and:
- Finds `{{reset_code}}` in the email
- Replaces it with the actual code (e.g., `123456`)
- Sends the email with the real code

### Step 3: User Receives Email
The user gets an email like:
```
Your verification code is: 123456
```

---

## 📝 Example

### In Your Template (Before Sending):
```
Your verification code is: {{reset_code}}
```

### In the Email (After Sending):
```
Your verification code is: 123456
```

The `{{reset_code}}` gets replaced with the actual code!

---

## ⚠️ Why Variable Names Must Match

Our code sends data with these variable names:
- `reset_code` → The 6-digit code
- `to_email` → Recipient's email
- `app_name` → "UniConnect"

**Your template MUST use the exact same names:**
- ✅ `{{reset_code}}` → Will work (matches our code)
- ❌ `{{link}}` → Won't work (doesn't match our code)
- ❌ `{{code}}` → Won't work (doesn't match our code)
- ❌ `{{resetCode}}` → Won't work (wrong format)

---

## 🔄 The Complete Flow

```
1. User clicks "Forgot Password"
   ↓
2. App generates code: 123456
   ↓
3. App sends to EmailJS:
   {
     reset_code: "123456",
     to_email: "user@example.com",
     app_name: "UniConnect"
   }
   ↓
4. EmailJS looks at template:
   "Your code is: {{reset_code}}"
   ↓
5. EmailJS replaces variable:
   "Your code is: 123456"
   ↓
6. Email sent to user with actual code
```

---

## 📋 Template Variable Checklist

In your EmailJS template, you need:

| Variable Name | What It Does | Example Value |
|--------------|--------------|---------------|
| `{{reset_code}}` | Shows the 6-digit code | `123456` |
| `{{to_email}}` | Recipient's email address | `user@example.com` |
| `{{app_name}}` | App name (optional) | `UniConnect` |

---

## 🎯 Real Example

### Template Content:
```
Hello,

Your verification code is: {{reset_code}}

This code expires in 10 minutes.

Thanks,
{{app_name}} Team
```

### What User Receives:
```
Hello,

Your verification code is: 123456

This code expires in 10 minutes.

Thanks,
UniConnect Team
```

---

## ❌ Common Mistakes

### Mistake 1: Wrong Variable Name
**Template:**
```
Your code is: {{link}}
```
**Result:** Email shows `{{link}}` literally (not replaced)
**Fix:** Use `{{reset_code}}`

### Mistake 2: Case Sensitivity
**Template:**
```
Your code is: {{Reset_Code}}
```
**Result:** Variable not replaced
**Fix:** Use lowercase `{{reset_code}}`

### Mistake 3: Wrong Format
**Template:**
```
Your code is: {{resetCode}}
```
**Result:** Variable not replaced
**Fix:** Use underscore `{{reset_code}}`

---

## ✅ Correct Template Example

```
Subject: UniConnect Password Reset Code

Body:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
You have requested a password change

Your verification code is: {{reset_code}}

This code will expire in 10 minutes.

If you didn't request this, please ignore this email.

Best regards,
{{app_name}} Team
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Settings:**
- To Email: `{{to_email}}`
- From Name: `UniConnect`

---

## 🧪 How to Test

1. **In EmailJS Template Editor:**
   - Add `{{reset_code}}` where you want the code
   - Save template

2. **Click "Test It":**
   - Enter your email
   - Send test email

3. **Check Your Email:**
   - You'll see `{{reset_code}}` as placeholder
   - When real email is sent, it will be replaced with actual code

---

## 💡 Summary

- `{{reset_code}}` = Placeholder for the 6-digit code
- EmailJS replaces it with the actual code when sending
- Variable name must match exactly: `reset_code`
- Use `{{reset_code}}` in your template, not `{{link}}`

**Think of it like a form letter where `{{reset_code}}` is the blank that gets filled in!**

