import { useEffect, useState } from 'react';
import api from '../api';
import {
    Grid, Paper, Typography, Box, Chip, Stack, Button
} from '@mui/material';
import { AccessTime, AssignmentInd, CheckCircle } from '@mui/icons-material';
import Layout from '../components/Layout';

function Tasks() {
    const [data, setData] = useState({ myTasks: [], openTasks: [] });

    useEffect(() => { fetchTasks(); }, []);

    const fetchTasks = async () => {
        try {
            const res = await api.get('/my-tasks');
            setData(res.data.data);
        } catch (err) { console.error(err); }
    };

    const handleClaim = async (taskId) => {
        try { await api.patch(`/tasks/${taskId}/claim`); fetchTasks(); } catch (err) { alert("Error claiming task"); }
    };

    const handleComplete = async (taskId) => {
        try { await api.patch(`/tasks/${taskId}/status`, { status: 'completed' }); fetchTasks(); } catch (err) { alert("Error"); }
    };

    const TaskCard = ({ task, type }) => (
        <Paper sx={{ p: 2, mb: 2, borderLeft: `4px solid ${task.priority === 'high' ? '#ef4444' : '#3b82f6'}` }}>
            <Stack direction="row" justifyContent="space-between" alignItems="start">
                <Box>
                    <Typography variant="subtitle1" fontWeight="bold">{task.title}</Typography>
                    <Typography variant="caption" color="text.secondary">{task.project_name}</Typography>
                </Box>
                <Chip label={task.priority} size="small" color={task.priority === 'high' ? 'error' : 'default'} sx={{ height: 20, fontSize: '0.6rem' }} />
            </Stack>

            <Typography variant="body2" sx={{ my: 1, color: 'text.secondary' }}>
                {task.description || 'No description'}
            </Typography>

            <Stack direction="row" alignItems="center" justifyContent="space-between" mt={2}>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <AccessTime fontSize="small" color="action" />
                    <Typography variant="caption">{task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No date'}</Typography>
                </Stack>
                {type === 'open' ? (
                    <Button size="small" startIcon={<AssignmentInd />} onClick={() => handleClaim(task.id)}>Claim</Button>
                ) : (
                    task.status !== 'completed' && (
                        <Button size="small" color="success" startIcon={<CheckCircle />} onClick={() => handleComplete(task.id)}>Done</Button>
                    )
                )}
            </Stack>
        </Paper>
    );

    return (
        <Layout title="My Tasks">
            <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                    <Typography variant="h6" fontWeight="bold" mb={2} color="primary">Assigned to Me</Typography>
                    {data.myTasks.length === 0 && <Typography color="text.secondary">No tasks assigned.</Typography>}
                    {data.myTasks.map(task => <TaskCard key={task.id} task={task} type="my" />)}
                </Grid>

                <Grid item xs={12} md={6}>
                    <Typography variant="h6" fontWeight="bold" mb={2} color="text.secondary">Unassigned / Open Tasks</Typography>
                    {data.openTasks.length === 0 && <Typography color="text.secondary">No open tasks available.</Typography>}
                    {data.openTasks.map(task => <TaskCard key={task.id} task={task} type="open" />)}
                </Grid>
            </Grid>
        </Layout>
    );
}

export default Tasks;