// Expose Vite env vars BEFORE the app tree loads: authStore/config evaluate
// env reads at module load and would otherwise capture __VITE_ENV__ undefined.
import './src/infrastructure/config/webEnv';

import * as React from 'react';
import { createRoot } from 'react-dom/client';
import '@mdi/font/css/materialdesignicons.css';
import App from './App';

const rootTag = document.getElementById('root');
createRoot(rootTag).render(<App />);
