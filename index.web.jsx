import * as React from 'react';
import { createRoot } from 'react-dom/client';
import '@mdi/font/css/materialdesignicons.css';
import App from './App';

const rootTag = document.getElementById('root');
createRoot(rootTag).render(<App />);
