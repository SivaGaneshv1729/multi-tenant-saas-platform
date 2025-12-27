import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#3b82f6', // Premium Blue
            dark: '#2563eb',
        },
        secondary: {
            main: '#10b981', // Emerald Green
        },
        background: {
            default: '#0f172a', // Deep Slate (App Background)
            paper: '#1e293b',   // Lighter Slate (Cards/Sidebar)
        },
        text: {
            primary: '#f8fafc',
            secondary: '#94a3b8',
        },
        divider: '#334155',
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: { fontWeight: 700 },
        h2: { fontWeight: 700 },
        h3: { fontWeight: 700 },
        button: { textTransform: 'none', fontWeight: 600 },
    },
    shape: {
        borderRadius: 12,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: { boxShadow: 'none' },
                containedPrimary: {
                    '&:hover': { boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)' },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: { backgroundImage: 'none' },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    backgroundColor: '#1e293b',
                    borderBottom: '1px solid #334155',
                    boxShadow: 'none',
                },
            },
        },
    },
});

export default theme;