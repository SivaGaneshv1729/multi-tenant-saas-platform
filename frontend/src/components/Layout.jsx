import { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Box, Drawer, AppBar, Toolbar, List, Typography, Divider, IconButton,
    ListItem, ListItemButton, ListItemIcon, ListItemText, Menu, MenuItem,
    Avatar, Tooltip, useTheme, useMediaQuery
} from '@mui/material';
import {
    Menu as MenuIcon, Dashboard, Folder, Assignment, Group,
    Business, AccountCircle, Logout, ChevronLeft, DarkMode, LightMode
} from '@mui/icons-material';
import api from '../api';
import { ColorModeContext } from '../App';

const drawerWidth = 240;

function Layout({ children, title, actions }) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [open, setOpen] = useState(!isMobile);
    const [anchorEl, setAnchorEl] = useState(null);

    const navigate = useNavigate();
    const location = useLocation();
    const colorMode = useContext(ColorModeContext);
    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        if (isMobile) setOpen(false);
    }, [location, isMobile]);

    const handleLogout = () => {
        api.post('/auth/logout');
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        navigate('/login');
    };

    const toggleDrawer = () => {
        setOpen(!open);
    };

    const menuItems = [
        { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard', roles: ['super_admin', 'tenant_admin', 'user'] },
        // --- FIX: Point to the new Tenants page ---
        { text: 'Tenants', icon: <Business />, path: '/tenants', roles: ['super_admin'] },
        { text: 'Projects', icon: <Folder />, path: '/projects', roles: ['tenant_admin', 'user'] },
        { text: 'My Tasks', icon: <Assignment />, path: '/tasks', roles: ['tenant_admin', 'user'] },
        { text: 'Team', icon: <Group />, path: '/users', roles: ['tenant_admin'] },
    ];

    return (
        <Box sx={{ display: 'flex' }}>
            <AppBar position="absolute" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                <Toolbar sx={{ pr: '24px' }}>
                    <IconButton edge="start" color="inherit" onClick={toggleDrawer} sx={{ marginRight: '36px' }}>
                        <MenuIcon />
                    </IconButton>

                    <Typography component="h1" variant="h6" color="inherit" noWrap sx={{ flexGrow: 1 }}>
                        {title || 'SaaS Platform'}
                    </Typography>

                    {actions && <Box sx={{ mr: 2 }}>{actions}</Box>}

                    <Tooltip title="Switch Theme">
                        <IconButton onClick={colorMode.toggleColorMode} color="inherit">
                            {theme.palette.mode === 'dark' ? <LightMode /> : <DarkMode />}
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Account settings">
                        <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="small" sx={{ ml: 2 }}>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                                {user?.fullName?.[0]?.toUpperCase() || 'U'}
                            </Avatar>
                        </IconButton>
                    </Tooltip>
                    <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
                        <MenuItem disabled><AccountCircle sx={{ mr: 1 }} /> {user?.fullName}</MenuItem>
                        <Divider />
                        <MenuItem onClick={handleLogout}><Logout sx={{ mr: 1 }} /> Logout</MenuItem>
                    </Menu>
                </Toolbar>
            </AppBar>

            <Drawer
                variant={isMobile ? "temporary" : "permanent"}
                open={open}
                onClose={isMobile ? toggleDrawer : undefined}
                sx={{
                    '& .MuiDrawer-paper': {
                        position: 'relative',
                        whiteSpace: 'nowrap',
                        width: isMobile ? drawerWidth : (open ? drawerWidth : 72),
                        transition: theme.transitions.create('width', {
                            easing: theme.transitions.easing.sharp,
                            duration: theme.transitions.duration.enteringScreen,
                        }),
                        boxSizing: 'border-box',
                        overflowX: 'hidden'
                    },
                }}
            >
                <Toolbar sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', px: [1] }}>
                    <IconButton onClick={toggleDrawer}>
                        <ChevronLeft />
                    </IconButton>
                </Toolbar>
                <Divider />
                <List component="nav">
                    {menuItems.map((item) => (
                        (!item.roles || item.roles.includes(user?.role)) && (
                            <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
                                <ListItemButton
                                    selected={location.pathname === item.path}
                                    onClick={() => navigate(item.path)}
                                    sx={{
                                        minHeight: 48,
                                        justifyContent: (open && !isMobile) || isMobile ? 'initial' : 'center',
                                        px: 2.5
                                    }}
                                >
                                    <ListItemIcon sx={{
                                        minWidth: 0,
                                        mr: (open && !isMobile) || isMobile ? 3 : 'auto',
                                        justifyContent: 'center'
                                    }}>
                                        {item.icon}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={item.text}
                                        sx={{ opacity: (open && !isMobile) || isMobile ? 1 : 0 }}
                                    />
                                </ListItemButton>
                            </ListItem>
                        )
                    ))}
                </List>
            </Drawer>

            <Box component="main" sx={{
                backgroundColor: (theme) => theme.palette.mode === 'light' ? theme.palette.grey[100] : theme.palette.background.default,
                flexGrow: 1,
                height: '100vh',
                overflow: 'auto'
            }}>
                <Toolbar />
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            </Box>
        </Box>
    );
}

export default Layout;