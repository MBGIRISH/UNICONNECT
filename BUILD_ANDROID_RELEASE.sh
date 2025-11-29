#!/bin/bash

# Script to build Android release AAB for Google Play Store

echo "📱 Building UniConnect Android Release"
echo "======================================"
echo ""

cd "$(dirname "$0")"

# Step 0: Ensure Java is available (prefer JDK 21 for latest Android plugins)
if [ -d "/opt/homebrew/opt/openjdk@21" ]; then
  export PATH="/opt/homebrew/opt/openjdk@21/bin:$PATH"
  export JAVA_HOME="/opt/homebrew/opt/openjdk@21"
elif [ -d "/opt/homebrew/opt/openjdk@17" ]; then
  export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"
  export JAVA_HOME="/opt/homebrew/opt/openjdk@17"
fi

if ! command -v java >/dev/null 2>&1; then
  echo "❌ Java is not installed. Install with: brew install openjdk@21"
  exit 1
fi

echo "✅ Using Java version: $(java -version 2>&1 | head -n 1)"
echo ""

# Step 1: Build web app
echo "1️⃣  Building web app..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Web build failed!"
    exit 1
fi

echo "✅ Web app built successfully"
echo ""

# Step 2: Sync to Android
echo "2️⃣  Syncing to Android..."
npx cap sync android

if [ $? -ne 0 ]; then
    echo "❌ Sync failed!"
    exit 1
fi

echo "✅ Sync completed"
echo ""

# Step 3: Check for keystore
echo "3️⃣  Checking keystore..."
if [ ! -f "android/app/release.keystore" ]; then
    echo "⚠️  WARNING: release.keystore not found!"
    echo ""
    echo "You need to create a keystore first:"
    echo "  cd android && ./CREATE_KEYSTORE.sh"
    echo ""
    echo "Or manually:"
    echo "  cd android/app"
    echo "  keytool -genkey -v -keystore release.keystore -alias uniconnect -keyalg RSA -keysize 2048 -validity 10000"
    echo ""
    read -p "Continue anyway? (will use debug signing - NOT for Play Store) (yes/no): " continue
    if [ "$continue" != "yes" ]; then
        exit 1
    fi
else
    echo "✅ Keystore found"
fi

# Ensure release passwords are set (no placeholders)
if grep -q "REPLACE_WITH_KEYSTORE_PASSWORD" android/gradle.properties; then
    echo "❌ Please edit android/gradle.properties and replace the placeholder KEYSTORE_PASSWORD value."
    exit 1
fi

if grep -q "REPLACE_WITH_KEY_PASSWORD" android/gradle.properties; then
    echo "❌ Please edit android/gradle.properties and replace the placeholder KEY_PASSWORD value."
    exit 1
fi

echo ""

# Step 4: Build release AAB
echo "4️⃣  Building release Android App Bundle (AAB)..."
cd android
./gradlew bundleRelease

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build successful!"
    echo ""
    echo "📦 Your AAB file is ready:"
    echo "   android/app/build/outputs/bundle/release/app-release.aab"
    echo ""
    echo "📤 Next steps:"
    echo "   1. Go to Google Play Console"
    echo "   2. Create new release"
    echo "   3. Upload app-release.aab"
    echo "   4. Complete store listing"
    echo "   5. Submit for review"
    echo ""
else
    echo ""
    echo "❌ Build failed! Check the errors above."
    exit 1
fi

