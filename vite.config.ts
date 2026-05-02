import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'react-native': path.resolve(__dirname, 'node_modules/react-native-web'),
    },
    extensions: ['.web.tsx', '.web.ts', '.web.jsx', '.web.js', '.tsx', '.ts', '.jsx', '.js'],
  },
  // Avoid Vite trying to pre-bundle react-navigation native modules (they target react-native, not web)
  optimizeDeps: {
    exclude: ['@react-navigation/native', '@react-navigation/native-stack', '@react-navigation/bottom-tabs'],
  },
  server: {
    port: 3100,
  },
});
