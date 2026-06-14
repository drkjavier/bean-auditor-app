import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Use ordered alias array so more specific matches are applied before broad ones
    alias: [
      {
        find: 'react-native/Libraries/Utilities/codegenNativeComponent',
        replacement: path.resolve(__dirname, 'src/web-shims/codegenNativeComponent.js'),
      },
      {
        find: 'react-native-web/Libraries/Utilities/codegenNativeComponent',
        replacement: path.resolve(__dirname, 'src/web-shims/codegenNativeComponent.js'),
      },
      {
        find: 'react-native',
        replacement: path.resolve(__dirname, 'node_modules/react-native-web'),
      },
      {
        find: 'react-native-quick-sqlite',
        replacement: path.resolve(__dirname, 'src/web-shims/react-native-quick-sqlite.js'),
      },
      {
        find: 'react-native-maps',
        replacement: path.resolve(__dirname, 'src/web-shims/react-native-maps.js'),
      },
      {
        find: 'react-native-keychain',
        replacement: path.resolve(__dirname, 'src/web-shims/react-native-keychain.js'),
      },
      {
        find: 'react-native-safe-area-context',
        replacement: path.resolve(__dirname, 'src/web-shims/react-native-safe-area-context.js'),
      },
      {
        find: 'react-native-nfc-manager',
        replacement: path.resolve(__dirname, 'src/web-shims/react-native-nfc-manager.js'),
      },
    ],
    extensions: ['.web.tsx', '.web.ts', '.web.jsx', '.web.js', '.tsx', '.ts', '.jsx', '.js'],
  },
  // Avoid Vite trying to pre-bundle react-navigation native modules (they target react-native, not web)
  optimizeDeps: {
    exclude: ['@react-navigation/native', '@react-navigation/native-stack', '@react-navigation/bottom-tabs'],
  },
  server: {
    port: 3100,
  },
  // Ensure WASM files are served with correct MIME type
  assetsInclude: ['**/*.wasm'],
});
