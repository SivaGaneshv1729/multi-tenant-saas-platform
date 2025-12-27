import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Box, Drawer, Toolbar, Typography, List, ListItem, ListItemButton,
    ListItemIcon, ListItemText, Stack, Avatar, IconButton, Divider
} from '@mui/material';
import {
    Dashboard as DashIcon, Assignment, Group, Logout, Business, Folder
} from '@mui/icons-material';

const drawerWidth = 260;

const Layout = ({ children, title, actions }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const user = JSON.parse(localStorage.getItem('user')) || {};

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    // DYNAMIC MENU BASED ON ROLE
    const menuItems = [
        { text: 'Dashboard', icon: <DashIcon />, path: '/dashboard', roles: ['super_admin', 'tenant_admin', 'user'] },
        { text: 'Tenants', icon: <Business />, path: '/dashboard', roles: ['super_admin'] },

        // UPDATE THIS LINE: path is now '/projects'
        { text: 'Projects', icon: <Folder />, path: '/projects', roles: ['tenant_admin', 'user'] },

        { text: 'My Tasks', icon: <Assignment />, path: '/tasks', roles: ['tenant_admin', 'user'] },
        { text: 'Team', icon: <Group />, path: '/users', roles: ['tenant_admin'] },
    ];

    return (
        <Box sx={{ display: 'flex' }}>
            <Drawer
                variant="permanent"
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box', borderRight: '1px solid #334155', bgcolor: 'background.paper' },
                }}
            >
                <Toolbar sx={{ px: 2, gap: 1.5 }}>
                    <Box sx={{ width: 32, height: 32, bgcolor: 'primary.main', borderRadius: 1 }} />
                    <Box>
                        <Typography variant="h6" fontWeight="bold" lineHeight={1}>Nexus</Typography>
                        <Typography variant="caption" color="text.secondary">Enterprise</Typography>
                    </Box>
                </Toolbar>

                <List sx={{ mt: 2 }}>
                    {menuItems.map((item) => {
                        // Filter by Role
                        if (!item.roles.includes(user?.role)) return null;

                        return (
                            <ListItem key={item.text} disablePadding>
                                <ListItemButton
                                    selected={location.pathname === item.path && item.text !== 'Tenants' && item.text !== 'Projects'}
                                    // Note: Tenants/Projects link to dashboard for now, so we don't highlight them to avoid confusion
                                    onClick={() => navigate(item.path)}
                                    sx={{ mx: 1, borderRadius: 2, mb: 0.5, '&.Mui-selected': { bgcolor: 'rgba(59, 130, 246, 0.12)', color: 'primary.main' } }}
                                >
                                    <ListItemIcon sx={{ color: 'text.secondary' }}>{item.icon}</ListItemIcon>
                                    <ListItemText primary={item.text} primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }} />
                                </ListItemButton>
                            </ListItem>
                        );
                    })}
                </List>

                <Box sx={{ mt: 'auto', p: 2, borderTop: '1px solid #334155' }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar sx={{ bgcolor: 'text.secondary', width: 36, height: 36 }}>{user?.email?.[0]?.toUpperCase()}</Avatar>
                        <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                            <Typography variant="subtitle2" noWrap fontWeight="bold">{user?.fullName || 'User'}</Typography>
                            <Typography variant="caption" color="text.secondary" display="block" noWrap>{user?.role?.replace('_', ' ')}</Typography>
                        </Box>
                        <IconButton onClick={handleLogout} color="error" size="small"><Logout fontSize="small" /></IconButton>
                    </Stack>
                </Box>
            </Drawer>

            <Box component="main" sx={{ flexGrow: 1, p: 4, height: '100vh', overflow: 'auto', bgcolor: 'background.default', color: 'text.primary' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
                    <Box>
                        <Typography variant="h4" fontWeight="800" gutterBottom>{title}</Typography>
                    </Box>
                    <Box>{actions}</Box>
                </Stack>
                {children}
            </Box>
        </Box>
    );
};

export default Layout;