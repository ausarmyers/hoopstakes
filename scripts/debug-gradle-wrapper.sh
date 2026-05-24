#!/bin/bash
# Pre-build hook: debug Gradle wrapper in EAS cloud
echo "🔍 DEBUG: Checking gradle-wrapper.jar in EAS environment"
ls -la android/gradle/wrapper/ || true
if [ -f android/gradle/wrapper/gradle-wrapper.jar ]; then
  file android/gradle/wrapper/gradle-wrapper.jar || true
  stat android/gradle/wrapper/gradle-wrapper.jar || true
else
  echo "❌ gradle-wrapper.jar not found"
fi
echo "🔍 DEBUG: Done"
