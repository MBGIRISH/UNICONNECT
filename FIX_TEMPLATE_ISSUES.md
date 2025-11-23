# 🔧 Fix Template Issues - Quick Guide

## ⚠️ Issues Found:

1. **Duplicate content** - Some text appears multiple times
2. **Wrong variable** - `{{email}}` should be `{{to_email}}`
3. **Placeholder not replaced** - `[Company Name]` should be `UniConnect`

---

## ✅ What to Fix:

### Issue 1: Remove Duplicates

You have duplicate text. Keep only ONE copy of each section:

**Keep this ONCE:**
```
You have requested a password change

We received a request to reset the password for your account.

Your verification code is: {{reset_code}}

This code will expire in 10 minutes.

If you didn't request this password reset, please ignore this email or let us know immediately. Your account remains secure.

Best regards,
UniConnect Team
```

**Delete all duplicates!**

---

### Issue 2: Fix Footer Variable

**Find this:**
```
The email was sent to {{email}}
```

**Change to:**
```
The email was sent to {{to_email}}
```

---

### Issue 3: Replace Company Name

**Find this:**
```
Best regards, [Company Name] Team
```

**Change to:**
```
Best regards, UniConnect Team
```

**Also find:**
```
You received this email because you are registered with [Company Name]
```

**Change to:**
```
You received this email because you are registered with UniConnect
```

---

## ✅ Final Clean Template:

Your template should look like this (ONCE, no duplicates):

```
You have requested a password change

We received a request to reset the password for your account.

Your verification code is: {{reset_code}}

This code will expire in 10 minutes.

If you didn't request this password reset, please ignore this email or let us know immediately. Your account remains secure.

Best regards,
UniConnect Team

The email was sent to {{to_email}}
You received this email because you are registered with UniConnect
```

---

## 📋 Checklist:

- [ ] Removed all duplicate text
- [ ] Changed `{{email}}` to `{{to_email}}`
- [ ] Changed `[Company Name]` to `UniConnect` (both places)
- [ ] Kept `{{reset_code}}` exactly as is
- [ ] Template looks clean with no duplicates
- [ ] Clicked "Apply Changes"
- [ ] Saved template

---

**After fixing these, your template will be perfect!** 🎉

