#!/bin/bash
# Pre-build hook: debug Gradle wrapper in EAS cloud
set -euo pipefail
echo "🔍 DEBUG: Checking gradle-wrapper.jar in EAS environment"
if ls -la android/gradle/wrapper/ >/dev/null 2>&1; then
  echo "android/gradle/wrapper exists"
else
  echo "android/gradle/wrapper does not exist, creating..."
  mkdir -p android/gradle/wrapper
fi

if [ -f android/gradle/wrapper/gradle-wrapper.jar ]; then
  echo "🔍 DEBUG: gradle-wrapper.jar present"
  file android/gradle/wrapper/gradle-wrapper.jar || true
  stat android/gradle/wrapper/gradle-wrapper.jar || true
else
  echo "❌ gradle-wrapper.jar not found. Attempting to download from Gradle distribution..."
  # Match the distributionUrl used by the project. Update if your project uses a different Gradle version.
  DIST_VERSION="8.14.3"
  DIST_URL="https://services.gradle.org/distributions/gradle-${DIST_VERSION}-bin.zip"
  TMPZIP="/tmp/gradle-${DIST_VERSION}.zip"
  echo "Downloading $DIST_URL (this may take a few seconds)"
  if command -v curl >/dev/null 2>&1; then
    curl -fsSL "$DIST_URL" -o "$TMPZIP" || (echo "Download failed"; exit 0)
  elif command -v wget >/dev/null 2>&1; then
    wget -qO "$TMPZIP" "$DIST_URL" || (echo "Download failed"; exit 0)
  else
    echo "No curl or wget available to download Gradle distribution"
    exit 0
  fi

  # Extract gradle-wrapper.jar from the distribution zip
  if command -v unzip >/dev/null 2>&1; then
    unzip -p "$TMPZIP" "gradle-${DIST_VERSION}/lib/gradle-wrapper.jar" > android/gradle/wrapper/gradle-wrapper.jar || true
  else
    echo "unzip is not available; cannot extract gradle-wrapper.jar"
  fi

  # Create a minimal gradle-wrapper.properties if missing
  if [ ! -f android/gradle/wrapper/gradle-wrapper.properties ]; then
    cat > android/gradle/wrapper/gradle-wrapper.properties <<EOF
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\://services.gradle.org/distributions/gradle-${DIST_VERSION}-bin.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
EOF
  fi

  if [ -f android/gradle/wrapper/gradle-wrapper.jar ]; then
    echo "✅ gradle-wrapper.jar downloaded/extracted"
    chmod 0644 android/gradle/wrapper/gradle-wrapper.jar || true
    file android/gradle/wrapper/gradle-wrapper.jar || true
    stat android/gradle/wrapper/gradle-wrapper.jar || true
  else
    echo "❌ Failed to obtain gradle-wrapper.jar"
  fi
fi

echo "🔍 DEBUG: Done"
