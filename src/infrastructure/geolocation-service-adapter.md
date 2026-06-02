Geolocation service adapter (migration notes)

This document describes recommended steps to migrate from @react-native-community/geolocation
to react-native-geolocation-service (Agontuk) which offers better reliability on Android via
FusedLocationProvider and improved accuracy controls.

Steps summary
1. Install the new native module
   npm install react-native-geolocation-service

2. Android native setup
   - Add Google Play Services location dependency if not already present (usually included by RN)
   - Ensure AndroidManifest has ACCESS_FINE_LOCATION and optionally ACCESS_BACKGROUND_LOCATION
   - Follow README of react-native-geolocation-service for Android specific gradle changes

3. iOS native setup
   - cd ios && pod install
   - Ensure Info.plist has NSLocationWhenInUseUsageDescription (already present)

4. Update the facade
   - Replace imports of @react-native-community/geolocation with react-native-geolocation-service
   - Keep the public API of src/infrastructure/locationService.ts stable (getCurrentPosition, watchPosition, clearWatch)

5. Tests
   - Update __mocks__ to mock react-native-geolocation-service instead of the old module
   - Run unit tests and manual validations on Android emulator/device to verify fused provider behavior

6. Rollout
   - Release via staged rollout (internal test -> beta -> prod)
   - Monitor crash analytics and permission-related errors

Notes/risks
- Replacing the module is mostly a drop-in change at JS level if you keep the facade API stable.
- Android may show different battery/permission characteristics; test background scenarios if used.
