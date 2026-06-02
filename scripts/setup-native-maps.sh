#!/usr/bin/env bash
set -euo pipefail

echo "Installing native map dependencies..."
npm install react-native-maps react-native-geolocation-service react-native-permissions --save

if [ -d ios ]; then
  echo "Installing CocoaPods..."
  (cd ios && pod install)
fi

echo "Done. Rebuild the app for changes to take effect."
