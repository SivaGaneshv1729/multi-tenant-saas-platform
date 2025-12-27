import { useEffect, useState } from 'react';
import api from '../api';
import {
    Grid, Paper, Typography, Box, Chip, Button, Stack, CircularProgress,
    Tabs, Tab, MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import {
    Bolt, CheckCircle, PlayArrow, Undo, AssignmentInd, Assignment, Stop
} from '@mui/icons-material';
import Layout from '../components/Layout';

function Tasks() {
    const [myTasks, setMyTasks] = useState([]);
    const [openTasks, setOpenTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState(0); // 0 = Assigned, 1 = Open Pool
    const [filter, setFilter] = useState('all'); // Priority Filter

    useEffect(() => { fetchTasks(); }, []);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const res = await api.get('/my-tasks');
            setMyTasks(res.data.data.myTasks);
            setOpenTasks(res.data.data.openTasks);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleClaim = async (taskId) => {
        try {
            await api.patch(`/tasks/${taskId}/claim`);
            fetchTasks(); // Refresh to move task from Open -> Assigned
        } catch (err) {
            alert("Error claiming task");
        }
    };

    const handleStatus = async (taskId, status) => {
        try {
            await api.patch(`/tasks/${taskId}/status`, { status });
            fetchTasks();
        } catch (err) {
            alert("Error updating status");
        }
    };

    // Filter Logic: Only applies to "My Tasks"
    const filteredMyTasks = myTasks.filter(t => filter === 'all' ? true : t.priority === filter);

    // --- INTERNAL COMPONENT: TASK CARD ---
    const TaskCard = ({ task, isClaimable }) => (
        <Paper sx={{ p: 2.5, height: '100%', border: '1px solid #334155', display: 'flex', flexDirection: 'column', position: 'relative', '&:hover': { borderColor: 'primary.main' } }}>

            {/* HEADER: Project Name & Priority */}
            <Stack direction="row" justifyContent="space-between" mb={1}>
                <Typography variant="caption" color="primary" fontWeight="bold" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {task.project_name}
                </Typography>
                <Chip
                    label={task.priority}
                    size="small"
                    color={task.priority === 'high' ? 'error' : task.priority === 'medium' ? 'warning' : 'default'}
                    variant="outlined"
                    sx={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 'bold' }}
                />
            </Stack>

            {/* BODY: Title & Due Date */}
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ lineHeight: 1.3 }}>
                {task.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1, mb: 3 }}>
                Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No Deadline'}
            </Typography>

            {/* FOOTER: Actions */}
            <Box sx={{ mt: 'auto', pt: 2, borderTop: '1px solid #1e293b' }}>
                {isClaimable ? (
                    <Button fullWidth variant="contained" size="small" startIcon={<Bolt />} onClick={() => handleClaim(task.id)}>
                        Claim This Task
                    </Button>
                ) : (
                    <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">

                        {/* 1. STATUS: TODO -> IN PROGRESS */}
                        {task.status === 'todo' && (
                            <Button size="small" variant="outlined" startIcon={<PlayArrow />} onClick={() => handleStatus(task.id, 'in_progress')}>
                                In Progress
                            </Button>
                        )}

                        {/* 2. STATUS: IN PROGRESS -> TODO or DONE */}
                        {task.status === 'in_progress' && (
                            <>
                                <Button size="small" variant="outlined" color="warning" startIcon={<Stop />} onClick={() => handleStatus(task.id, 'todo')}>
                                    To Do
                                </Button>
                                <Button size="small" variant="contained" color="success" startIcon={<CheckCircle />} onClick={() => handleStatus(task.id, 'completed')}>
                                    Done
                                </Button>
                            </>
                        )}

                        {/* 3. STATUS: COMPLETED -> REVERT */}
                        {task.status === 'completed' && (
                            <Stack direction="row" spacing={1} alignItems="center" width="100%" justifyContent="space-between">
                                <Chip label="Completed" color="success" size="small" icon={<CheckCircle />} />
                                <Button size="small" variant="text" color="secondary" startIcon={<Undo />} onClick={() => handleStatus(task.id, 'in_progress')}>
                                    Revert
                                </Button>
                            </Stack>
                        )}

                    </Stack>
                )}
            </Box>
        </Paper>
    );

    return (
        <Layout title="My Work">

            {/* CONTROLS BAR */}
            <Paper sx={{ mb: 3, p: 1, border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Tabs value={tab} onChange={(e, v) => setTab(v)} indicatorColor="primary" textColor="primary">
                    <Tab icon={<AssignmentInd fontSize="small" />} iconPosition="start" label={`Assigned (${myTasks.length})`} />
                    <Tab icon={<Assignment fontSize="small" />} iconPosition="start" label={`Open Pool (${openTasks.length})`} />
                </Tabs>

                {/* Priority Filter (Only show on Assigned tab) */}
                {tab === 0 && (
                    <FormControl size="small" sx={{ width: 150, mr: 1 }}>
                        <InputLabel>Priority</InputLabel>
                        <Select value={filter} label="Priority" onChange={(e) => setFilter(e.target.value)}>
                            <MenuItem value="all">All Priorities</MenuItem>
                            <MenuItem value="high">High</MenuItem>
                            <MenuItem value="medium">Medium</MenuItem>
                            <MenuItem value="low">Low</MenuItem>
                        </Select>
                    </FormControl>
                )}
            </Paper>

            {/* LOADING STATE */}
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>
            ) : (
                <Grid container spacing={3}>
                    {/* RENDER TASKS */}
                    {(tab === 0 ? filteredMyTasks : openTasks).map(task => (
                        <Grid item xs={12} md={6} lg={4} key={task.id}>
                            <TaskCard task={task} isClaimable={tab === 1} />
                        </Grid>
                    ))}

                    {/* EMPTY STATE */}
                    {(tab === 0 ? filteredMyTasks : openTasks).length === 0 && (
                        <Grid item xs={12}>
                            <Paper sx={{ p: 4, textAlign: 'center', borderStyle: 'dashed', borderColor: 'divider' }}>
                                <Typography color="text.secondary">
                                    {tab === 0
                                        ? "You're all caught up! No active tasks found."
                                        : "No unassigned tasks available in the pool."}
                                </Typography>
                            </Paper>
                        </Grid>
                    )}
                </Grid>
            )}
        </Layout>
    );
}

export default Tasks;