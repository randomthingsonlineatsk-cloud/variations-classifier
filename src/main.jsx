import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
// Fonts are bundled with the app (SIL Open Font License) so it looks the same offline.
import '@fontsource/public-sans/400.css';
import '@fontsource/public-sans/600.css';
import '@fontsource/public-sans/700.css';
import '@fontsource/public-sans/800.css';
import '@fontsource/jetbrains-mono/400.css';
import './styles.css';

createRoot(document.getElementById('root')).render(<App />);
