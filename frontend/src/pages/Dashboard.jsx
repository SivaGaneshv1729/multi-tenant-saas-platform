import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import {
    Grid, Paper, Typography, Box, Stack, CircularProgress, Avatar, Chip, Button, Tooltip, LinearProgress
} from '@mui/material';
import { Business, CheckCircle, Folder, People, AssignmentTurnedIn } from '@mui/icons-material';
import Layout from '../components/Layout';

function Dashboard() {
    const [stats, setStats] = useState(null);
    const [listData, setListData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem('user'));
        if (!userData) { navigate('/login'); return; }
        setUser(userData);
        fetchData(userData);
    }, [navigate]);

    const fetchData = async (userData) => {
        try {
            setLoading(true);
            const statsRes = await api.get('/dashboard/stats');
            setStats(statsRes.data.data);

            if (userData.role === 'super_admin') {
                const res = await api.get('/tenants');
                setListData(res.data.data.tenants || []);
            } else {
                const res = await api.get('/projects');
                setListData(res.data.data || []);
            }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    // --- COMPONENT: Interactive Stat Bar ---
    const TaskStatBar = ({ tasks }) => {
        if (!tasks || tasks.total === 0) return <Typography variant="body2" color="text.secondary">No active tasks tracked.</Typography>;

        // Calculate Percentages
        const todoPct = (tasks.todo / tasks.total) * 100;
        const inpPct = (tasks.in_progress / tasks.total) * 100;
        const donePct = (tasks.completed / tasks.total) * 100;

        return (
            <Box sx={{ width: '100%', mt: 2 }}>
                {/* The Visual Bar */}
                <Box sx={{ display: 'flex', height: 12, borderRadius: 4, overflow: 'hidden', bgcolor: '#e2e8f0' }}>
                    <Tooltip title={`Todo: ${tasks.todo}`}><Box sx={{ width: `${todoPct}%`, bgcolor: '#3b82f6', transition: 'width 0.5s' }} /></Tooltip>
                    <Tooltip title={`In Progress: ${tasks.in_progress}`}><Box sx={{ width: `${inpPct}%`, bgcolor: '#f59e0b', transition: 'width 0.5s' }} /></Tooltip>
                    <Tooltip title={`Done: ${tasks.completed}`}><Box sx={{ width: `${donePct}%`, bgcolor: '#10b981', transition: 'width 0.5s' }} /></Tooltip>
                </Box>

                {/* The Legend */}
                <Stack direction="row" spacing={3} mt={2} justifyContent="center">
                    <Stack alignItems="center">
                        <Typography variant="h6" fontWeight="bold" color="primary.main">{tasks.todo}</Typography>
                        <Typography variant="caption" color="text.secondary">To Do</Typography>
                    </Stack>
                    <Stack alignItems="center">
                        <Typography variant="h6" fontWeight="bold" color="warning.main">{tasks.in_progress}</Typography>
                        <Typography variant="caption" color="text.secondary">In Progress</Typography>
                    </Stack>
                    <Stack alignItems="center">
                        <Typography variant="h6" fontWeight="bold" color="success.main">{tasks.completed}</Typography>
                        <Typography variant="caption" color="text.secondary">Completed</Typography>
                    </Stack>
                </Stack>
            </Box>
        );
    };

    if (loading || !stats) return <Layout title="Dashboard"><Box sx={{ p: 5, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box></Layout>;

    return (
        <Layout title={user?.role === 'super_admin' ? 'System Overview' : 'Dashboard'}>

            {/* SUPER ADMIN VIEW */}
            {user?.role === 'super_admin' ? (
                <Grid container spacing={3} mb={4}>
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 4, border: '1px solid #334155' }}>
                            <Stack direction="row" alignItems="center" spacing={2} mb={1}>
                                <Business fontSize="large" color="primary" />
                                <Typography variant="h6" color="text.secondary">Total Tenants</Typography>
                            </Stack>
                            <Typography variant="h2" fontWeight="800">{stats.tenants}</Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 4, border: '1px solid #334155' }}>
                            <Stack direction="row" alignItems="center" spacing={2} mb={1}>
                                <CheckCircle fontSize="large" color="success" />
                                <Typography variant="h6" color="text.secondary">System Health</Typography>
                            </Stack>
                            <Typography variant="h2" fontWeight="800" color="success.main">100%</Typography>
                        </Paper>
                    </Grid>
                </Grid>
            ) : (
                /* USER / TENANT ADMIN VIEW */
                <Grid container spacing={3} mb={4}>
                    <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 3, border: '1px solid #334155', height: '100%' }}>
                            <Stack direction="row" justifyContent="space-between" mb={2}>
                                <Typography variant="subtitle1" color="text.secondary">Total Projects</Typography>
                                <Folder color="primary" />
                            </Stack>
                            <Typography variant="h3" fontWeight="700">{stats.totalProjects}</Typography>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 3, border: '1px solid #334155', height: '100%' }}>
                            <Stack direction="row" justifyContent="space-between" mb={2}>
                                <Typography variant="subtitle1" color="text.secondary">Team Members</Typography>
                                <People color="info" />
                            </Stack>
                            <Typography variant="h3" fontWeight="700">{stats.totalUsers}</Typography>
                        </Paper>
                    </Grid>

                    {/* DYNAMIC TASK CHART */}
                    <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 3, border: '1px solid #334155', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                                <AssignmentTurnedIn color="action" />
                                <Typography variant="subtitle1" fontWeight="bold">
                                    {user.role === 'tenant_admin' ? 'All Project Tasks' : 'My Task Status'}
                                </Typography>
                            </Stack>
                            <TaskStatBar tasks={stats.tasks} />
                        </Paper>
                    </Grid>
                </Grid>
            )}

            {/* RECENT LIST */}
            <Typography variant="h6" fontWeight="bold" mb={2}>
                {user?.role === 'super_admin' ? 'All Organizations' : 'Recent Projects'}
            </Typography>

            {listData.length === 0 ? (
                <Paper sx={{ p: 6, textAlign: 'center', borderStyle: 'dashed', borderColor: 'divider' }}>
                    <Typography color="text.secondary">No items found.</Typography>
                </Paper>
            ) : (
                <Grid container spacing={3}>
                    {listData.map((item) => (
                        <Grid item xs={12} md={6} lg={4} key={item.id}>
                            <Paper sx={{ p: 3, border: '1px solid #334155', '&:hover': { boxShadow: 6, borderColor: 'primary.main' } }}>
                                <Stack direction="row" justifyContent="space-between" mb={2}>
                                    <Avatar variant="rounded" sx={{ bgcolor: 'primary.main' }}>{item.name[0]}</Avatar>
                                    <Chip label={item.status} size="small" color="success" variant="outlined" sx={{ textTransform: 'uppercase', fontSize: '0.6rem' }} />
                                </Stack>
                                <Typography variant="h6" fontWeight="bold" gutterBottom>{item.name}</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    {item.description || (item.subdomain ? `Domain: ${item.subdomain}` : 'No description')}
                                </Typography>
                                {user?.role !== 'super_admin' ? (
                                    <Button size="small" variant="outlined" onClick={() => navigate(`/projects/${item.id}`)}>Open Workspace</Button>
                                ) : (
                                    <Typography variant="caption" color="text.secondary">ID: {item.id.substring(0, 8)}</Typography>
                                )}
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            )}
        </Layout>
    );
}

export default Dashboard;