import { useState, useMemo, createContext, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, useMediaQuery } from '@mui/material';
import { getTheme } from './theme';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetails from './pages/ProjectDetails';
import Users from './pages/Users';
import Tasks from './pages/Tasks';
import Tenants from './pages/Tenants'; // --- IMPORT NEW PAGE ---

export const ColorModeContext = createContext({ toggleColorMode: () => { } });

function App() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [mode, setMode] = useState(prefersDarkMode ? 'dark' : 'light');

  useEffect(() => { setMode(prefersDarkMode ? 'dark' : 'light'); }, [prefersDarkMode]);

  const theme = useMemo(() => getTheme(mode), [mode]);
  const colorMode = useMemo(() => ({ toggleColorMode: () => setMode((prev) => (prev === 'light' ? 'dark' : 'light')) }), []);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:projectId" element={<ProjectDetails />} />
            <Route path="/users" element={<Users />} />
            <Route path="/tasks" element={<Tasks />} />

            {/* --- NEW ROUTE --- */}
            <Route path="/tenants" element={<Tenants />} />

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default App;