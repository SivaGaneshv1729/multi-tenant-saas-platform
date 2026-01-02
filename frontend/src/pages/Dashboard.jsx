import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import {
    Grid, Paper, Typography, Box, Stack, CircularProgress, Chip, Button, Tooltip,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Divider
} from '@mui/material';
import { Folder, People, Business, Layers, ArrowForward } from '@mui/icons-material';
import Layout from '../components/Layout';

function Dashboard() {
    const [stats, setStats] = useState(null);
    const [listData, setListData] = useState([]);
    const [myTasks, setMyTasks] = useState([]);
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

            if (userData.role !== 'super_admin') {
                const res = await api.get('/projects');
                setListData(res.data.data || []);
                const tasksRes = await api.get('/my-tasks');
                setMyTasks(tasksRes.data.data.myTasks.filter(t => t.status !== 'completed').slice(0, 5));
            }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const StatCard = ({ title, value, icon, color }) => (
        <Paper sx={{ p: 3, height: '100%', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
                <Typography color="text.secondary" variant="subtitle2" textTransform="uppercase">{title}</Typography>
                <Typography variant="h3" fontWeight="700" sx={{ mt: 1 }}>{value}</Typography>
            </Box>
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: `${color}15`, color: color }}>
                {icon}
            </Box>
        </Paper>
    );

    const TaskStatBar = ({ tasks }) => {
        if (!tasks || tasks.total === 0) return <Typography variant="body2" color="text.secondary">No active tasks tracked.</Typography>;
        const todoPct = (tasks.todo / tasks.total) * 100;
        const inpPct = (tasks.in_progress / tasks.total) * 100;
        const donePct = (tasks.completed / tasks.total) * 100;

        return (
            <Box sx={{ width: '100%', mt: 2 }}>
                <Box sx={{ display: 'flex', height: 12, borderRadius: 4, overflow: 'hidden', bgcolor: '#e2e8f0' }}>
                    <Tooltip title={`Todo: ${tasks.todo}`}><Box sx={{ width: `${todoPct}%`, bgcolor: '#3b82f6' }} /></Tooltip>
                    <Tooltip title={`In Progress: ${tasks.in_progress}`}><Box sx={{ width: `${inpPct}%`, bgcolor: '#f59e0b' }} /></Tooltip>
                    <Tooltip title={`Done: ${tasks.completed}`}><Box sx={{ width: `${donePct}%`, bgcolor: '#10b981' }} /></Tooltip>
                </Box>
                <Stack direction="row" spacing={3} mt={2} justifyContent="center">
                    <Stack alignItems="center"><Typography variant="h6" fontWeight="bold" color="primary.main">{tasks.todo}</Typography><Typography variant="caption">To Do</Typography></Stack>
                    <Stack alignItems="center"><Typography variant="h6" fontWeight="bold" color="warning.main">{tasks.in_progress}</Typography><Typography variant="caption">In Progress</Typography></Stack>
                    <Stack alignItems="center"><Typography variant="h6" fontWeight="bold" color="success.main">{tasks.completed}</Typography><Typography variant="caption">Completed</Typography></Stack>
                </Stack>
            </Box>
        );
    };

    if (loading || !stats) return <Layout title="Dashboard"><Box sx={{ p: 5, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box></Layout>;

    // --- SUPER ADMIN VIEW ---
    if (user?.role === 'super_admin') {
        return (
            <Layout title="System Overview">
                {/* STATS ROW */}
                <Grid container spacing={3} mb={4}>
                    <Grid item xs={12} md={4}>
                        <StatCard title="Total Tenants" value={stats.overview.tenants} icon={<Business fontSize="large" />} color="#3b82f6" />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <StatCard title="Total Users" value={stats.overview.users} icon={<People fontSize="large" />} color="#10b981" />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <StatCard title="Total Projects" value={stats.overview.projects} icon={<Layers fontSize="large" />} color="#f59e0b" />
                    </Grid>
                </Grid>

                {/* RECENT REGISTRATIONS (Only shows top 5, no actions) */}
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" fontWeight="bold">Recent Registrations</Typography>
                    <Button endIcon={<ArrowForward />} onClick={() => navigate('/tenants')}>View All Tenants</Button>
                </Stack>

                <TableContainer component={Paper} sx={{ border: '1px solid #e2e8f0' }}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'action.hover' }}>
                                <TableCell>Organization</TableCell>
                                <TableCell>Plan</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell align="center">Users</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {stats.tenantDetails.slice(0, 5).map((tenant, idx) => (
                                <TableRow key={idx}>
                                    <TableCell fontWeight="bold">{tenant.name}</TableCell>
                                    <TableCell>
                                        <Chip label={tenant.subscription_plan} size="small" variant="outlined" sx={{ textTransform: 'capitalize' }} />
                                    </TableCell>
                                    <TableCell>
                                        <Chip label={tenant.status} size="small" color={tenant.status === 'active' ? 'success' : 'default'} />
                                    </TableCell>
                                    <TableCell align="center">{tenant.user_count}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Layout>
        );
    }

    // --- TENANT ADMIN / USER VIEW ---
    return (
        <Layout title="Dashboard">
            <Grid container spacing={3} mb={4}>
                <Grid item xs={12} md={4}>
                    <StatCard title="Projects" value={stats.totalProjects} icon={<Folder fontSize="large" />} color="#3b82f6" />
                </Grid>
                <Grid item xs={12} md={4}>
                    <StatCard title="Team Members" value={stats.totalUsers} icon={<People fontSize="large" />} color="#10b981" />
                </Grid>
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, height: '100%', border: '1px solid #e2e8f0' }}>
                        <Typography variant="subtitle2" color="text.secondary">Task Overview</Typography>
                        <TaskStatBar tasks={stats.tasks} />
                    </Paper>
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                    <Typography variant="h6" fontWeight="bold" mb={2}>Recent Projects</Typography>
                    {listData.length === 0 ? <Paper sx={{ p: 3 }}><Typography>No projects yet.</Typography></Paper> : (
                        <Grid container spacing={2}>
                            {listData.slice(0, 4).map((item) => (
                                <Grid item xs={12} md={6} key={item.id}>
                                    <Paper sx={{ p: 2, border: '1px solid #e2e8f0', '&:hover': { borderColor: 'primary.main' } }}>
                                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                                            <Typography variant="subtitle1" fontWeight="bold">{item.name}</Typography>
                                            <Chip label={item.status} size="small" color="success" variant="outlined" />
                                        </Stack>
                                        <Typography variant="body2" color="text.secondary" noWrap sx={{ my: 1 }}>{item.description}</Typography>
                                        {user?.role !== 'super_admin' && (
                                            <Button size="small" onClick={() => navigate(`/projects/${item.id}`)}>View Workspace</Button>
                                        )}
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </Grid>
                {user?.role !== 'super_admin' && (
                    <Grid item xs={12} md={4}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                            <Typography variant="h6" fontWeight="bold">My Pending Tasks</Typography>
                            <Button size="small" onClick={() => navigate('/tasks')}>View All</Button>
                        </Stack>
                        <Paper sx={{ border: '1px solid #e2e8f0', p: 0, overflow: 'hidden' }}>
                            {myTasks.length === 0 ? (
                                <Box p={3} textAlign="center"><Typography variant="body2" color="text.secondary">No pending tasks.</Typography></Box>
                            ) : (
                                myTasks.map((task, index) => (
                                    <Box key={task.id}>
                                        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Box>
                                                <Typography variant="subtitle2" fontWeight="600">{task.title}</Typography>
                                                <Typography variant="caption" color="text.secondary">{task.project_name}</Typography>
                                            </Box>
                                            <Chip label={task.priority} size="small" color={task.priority === 'high' ? 'error' : 'default'} sx={{ height: 20, fontSize: '0.6rem' }} />
                                        </Box>
                                        {index < myTasks.length - 1 && <Divider />}
                                    </Box>
                                ))
                            )}
                        </Paper>
                    </Grid>
                )}
            </Grid>
        </Layout>
    );
}
export default Dashboard;