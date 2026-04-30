import * as React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const rootTag = document.getElementById('root');
createRoot(rootTag).render(<App />);
