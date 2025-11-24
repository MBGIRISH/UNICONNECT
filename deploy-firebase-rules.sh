#!/bin/bash

# Deploy Firebase Firestore Rules for Password Reset
# This script deploys the Firestore security rules to Firebase

echo "🔥 Deploying Firebase Firestore Rules..."
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI is not installed."
    echo "   Install it with: npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in
if ! firebase projects:list &> /dev/null; then
    echo "⚠️  Not logged in to Firebase. Logging in..."
    firebase login
fi

# Deploy Firestore rules
echo "📤 Deploying Firestore rules..."
firebase deploy --only firestore:rules

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Firestore rules deployed successfully!"
    echo ""
    echo "📋 Rules Summary:"
    echo "   - passwordResetCodes collection: Allow read/write for anyone (needed for password reset)"
    echo "   - All other collections: Require authentication"
    echo ""
    echo "🎉 Password reset flow is now fully configured!"
else
    echo ""
    echo "❌ Deployment failed. Please check the error messages above."
    echo ""
    echo "💡 Manual Deployment:"
    echo "   1. Go to: https://console.firebase.google.com/project/campus-connect-fd225/firestore/rules"
    echo "   2. Copy contents from firestore.rules"
    echo "   3. Paste and click 'Publish'"
    exit 1
fi

