import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Create the root element
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render the App
// Note: We do NOT import ThemeProvider here anymore. 
// It is handled inside App.jsx
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);