import React from 'react';
import { View } from 'react-native';
import LoginScreen from '../screens/LoginScreen';
import MainScreen from '../screens/MainScreen';
import { useAuthStore } from '../../stores/authStore';

// Lightweight navigator for web/native without react-navigation to avoid
// dependency pre-bundling issues on Vite development server.
export default function AppNavigator() {
  const isLoggedIn = useAuthStore(state => state.isLoggedIn);

  return <View style={{ flex: 1 }}>{isLoggedIn ? <MainScreen /> : <LoginScreen />}</View>;
}
