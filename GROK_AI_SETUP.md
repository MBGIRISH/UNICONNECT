# 🤖 Grok AI Setup Guide

## ✅ AI Assistant Updated!

The AI assistant now uses **Grok API** (free tier with $25/month credits) instead of Gemini.

---

## 🚀 Quick Setup (2 minutes):

### Step 1: Get Your Free Grok API Key

1. **Visit:** https://console.x.ai/
2. **Sign up** or **Log in** with your account
3. **Navigate to:** API Keys section
4. **Click:** "Create API Key"
5. **Copy** your API key (you'll only see it once!)

---

### Step 2: Add API Key to .env File

1. Open `.env` file in your project root
2. Add this line:
   ```env
   VITE_GROK_API_KEY=your_grok_api_key_here
   ```
3. **Replace** `your_grok_api_key_here` with your actual key
4. **Save** the file

---

### Step 3: Restart Your Dev Server

```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

---

## 🎯 How It Works:

### In Study Groups:
- Type `@AI` in any group chat
- Ask any study question
- Get instant AI-powered help!

### Example:
```
You: @AI What is the difference between SQL and NoSQL?
AI: [Provides helpful explanation]
```

---

## 💰 Free Tier Details:

- **$25 free credits per month** during public beta
- **No credit card required** for free tier
- **Perfect for testing and small projects**

---

## 🔧 Troubleshooting:

### "Add your Grok API key" message:
- ✅ Check that `.env` file has `VITE_GROK_API_KEY=your_key`
- ✅ Make sure the key starts with `xai-`
- ✅ Restart your dev server after adding the key

### "API request failed" error:
- ✅ Check your internet connection
- ✅ Verify the API key is correct
- ✅ Check if you've exceeded free tier limits
- ✅ Visit https://console.x.ai/ to check your usage

### Still not working?
1. Check browser console for errors
2. Verify the API key in `.env` file
3. Make sure you restarted the server
4. Try getting a new API key from https://console.x.ai/

---

## 📝 Example .env File:

```env
# EmailJS Configuration
VITE_EMAILJS_SERVICE_ID=service_l08krpg
VITE_EMAILJS_TEMPLATE_ID=template_lvz04tb
VITE_EMAILJS_PUBLIC_KEY=Np1nLzp3Vnzrgu1Au

# Grok AI API Key (Free $25/month credits)
# Get your free key at: https://console.x.ai/
VITE_GROK_API_KEY=xai-your-actual-api-key-here
```

---

## 🎉 That's It!

Once you add the API key and restart, the AI assistant will work perfectly in your study groups!

**Get your free key now:** https://console.x.ai/

