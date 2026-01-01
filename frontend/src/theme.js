import { createTheme } from '@mui/material/styles';

export const getTheme = (mode) => createTheme({
    palette: {
        mode, // 'light' or 'dark'
        primary: {
            main: '#2563eb', // Blue
        },
        secondary: {
            main: '#475569', // Slate
        },
        background: {
            default: mode === 'light' ? '#f1f5f9' : '#0f172a', // Light Gray vs Dark Navy
            paper: mode === 'light' ? '#ffffff' : '#1e293b',   // White vs Dark Slate
        },
        text: {
            primary: mode === 'light' ? '#1e293b' : '#f8fafc',
            secondary: mode === 'light' ? '#64748b' : '#cbd5e1',
        },
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: { fontWeight: 700 },
        h2: { fontWeight: 700 },
        h3: { fontWeight: 700 },
        h4: { fontWeight: 600 },
        h5: { fontWeight: 600 },
        h6: { fontWeight: 600 },
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 8,
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none', // Fix for dark mode elevation overlay in MUI
                }
            }
        }
    },
});