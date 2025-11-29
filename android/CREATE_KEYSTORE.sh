#!/bin/bash

# Script to create Android release keystore for UniConnect

echo "🔐 Creating Android Release Keystore for UniConnect"
echo "=================================================="
echo ""
echo "This will create a keystore file to sign your app for Google Play Store."
echo "IMPORTANT: Save the password you enter - you'll need it for all future updates!"
echo ""

cd "$(dirname "$0")/app"

# Check if keystore already exists
if [ -f "release.keystore" ]; then
    echo "⚠️  WARNING: release.keystore already exists!"
    read -p "Do you want to overwrite it? (yes/no): " overwrite
    if [ "$overwrite" != "yes" ]; then
        echo "Cancelled. Using existing keystore."
        exit 0
    fi
fi

echo "Enter the following information:"
echo ""

keytool -genkey -v -keystore release.keystore \
    -alias uniconnect \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Keystore created successfully!"
    echo ""
    echo "📝 IMPORTANT INFORMATION:"
    echo "   - Keystore file: android/app/release.keystore"
    echo "   - Key alias: uniconnect"
    echo "   - Validity: 10000 days (~27 years)"
    echo ""
    echo "⚠️  SAVE YOUR PASSWORD SECURELY!"
    echo "   You'll need it every time you update your app on Play Store."
    echo ""
    echo "Next steps:"
    echo "1. Update android/app/build.gradle with your keystore password"
    echo "2. Or set environment variables: KEYSTORE_PASSWORD and KEY_PASSWORD"
    echo "3. Build release AAB: cd android && ./gradlew bundleRelease"
else
    echo ""
    echo "❌ Failed to create keystore. Please try again."
    exit 1
fi

