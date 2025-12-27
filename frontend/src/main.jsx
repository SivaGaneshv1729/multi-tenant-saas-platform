import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline /> {/* This automatically handles dark mode background */}
      <App />
    </ThemeProvider>
  </React.StrictMode>,
)