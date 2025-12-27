import { useEffect, useState } from 'react';
import api from '../api';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box, Button, Typography, Paper, Grid, TextField,
    MenuItem, Chip, Stack, IconButton, Avatar, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { ArrowBack, Delete, AccessTime, Add, FilterList } from '@mui/icons-material';
import Layout from '../components/Layout';

function ProjectDetails() {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));

    const [tasks, setTasks] = useState([]);
    const [users, setUsers] = useState([]);
    const [filter, setFilter] = useState('all'); // all, todo, in_progress, completed
    const [open, setOpen] = useState(false); // Modal State

    const [form, setForm] = useState({ title: '', priority: 'medium', dueDate: '', assignedTo: '' });

    useEffect(() => { fetchTasks(); fetchUsers(); }, [projectId]);

    const fetchTasks = () => {
        api.get(`/projects/${projectId}/tasks`).then(res => setTasks(res.data.data));
    };

    const fetchUsers = () => {
        api.get('/users').then(res => setUsers(res.data.data));
    };

    const handleAddTask = async () => {
        try {
            await api.post(`/projects/${projectId}/tasks`, { ...form, assignedTo: form.assignedTo || null });
            setForm({ title: '', priority: 'medium', dueDate: '', assignedTo: '' });
            setOpen(false);
            fetchTasks();
        } catch (err) { alert("Failed to add task"); }
    };

    const handleDelete = async (taskId) => {
        if (!confirm("Are you sure you want to delete this task?")) return;
        try {
            await api.delete(`/tasks/${taskId}`);
            fetchTasks(); // Refresh list immediately
        } catch (err) {
            alert(err.response?.data?.message || "Failed to delete task");
        }
    };

    const filteredTasks = tasks.filter(t => filter === 'all' ? true : t.status === filter);

    const stats = {
        total: tasks.length,
        completed: tasks.filter(t => t.status === 'completed').length,
        inProgress: tasks.filter(t => t.status === 'in_progress').length,
        todo: tasks.filter(t => t.status === 'todo').length,
    };

    return (
        <Layout
            title="Project Workspace"
            actions={
                <Stack direction="row" spacing={2}>
                    <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate('/dashboard')}>Back</Button>
                    {/* Only Admin can add tasks */}
                    {user?.role === 'tenant_admin' && (
                        <Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}>New Task</Button>
                    )}
                </Stack>
            }
        >
            {/* STATUS FILTER CHIPS */}
            <Stack direction="row" spacing={1} mb={3} alignItems="center">
                <FilterList color="action" />
                <Chip label={`All (${stats.total})`} onClick={() => setFilter('all')} color={filter === 'all' ? 'primary' : 'default'} clickable />
                <Chip label={`To Do (${stats.todo})`} onClick={() => setFilter('todo')} color={filter === 'todo' ? 'primary' : 'default'} clickable />
                <Chip label={`In Progress (${stats.inProgress})`} onClick={() => setFilter('in_progress')} color={filter === 'in_progress' ? 'info' : 'default'} clickable />
                <Chip label={`Completed (${stats.completed})`} onClick={() => setFilter('completed')} color={filter === 'completed' ? 'success' : 'default'} clickable />
            </Stack>

            <Grid container spacing={2}>
                {filteredTasks.map(task => {
                    const assignee = users.find(u => u.id === task.assigned_to);
                    return (
                        <Grid item xs={12} key={task.id}>
                            <Paper sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #334155', '&:hover': { bgcolor: 'action.hover' } }}>
                                <Box>
                                    <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                                        <Typography variant="subtitle1" fontWeight="bold">{task.title}</Typography>
                                        <Chip label={task.priority} size="small" color={task.priority === 'high' ? 'error' : 'default'} variant="outlined" sx={{ height: 20, fontSize: '0.6rem' }} />
                                    </Stack>
                                    <Stack direction="row" spacing={2} alignItems="center">
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <AccessTime fontSize="inherit" /> {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No Date'}
                                        </Typography>
                                        {assignee ? (
                                            <Chip avatar={<Avatar sx={{ width: 16, height: 16 }}>{assignee.full_name[0]}</Avatar>} label={assignee.full_name} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
                                        ) : (
                                            <Typography variant="caption" color="text.disabled">Unassigned</Typography>
                                        )}
                                    </Stack>
                                </Box>

                                <Stack direction="row" alignItems="center" spacing={2}>
                                    <Chip label={task.status.replace('_', ' ')} color={task.status === 'completed' ? 'success' : task.status === 'in_progress' ? 'info' : 'default'} size="small" />
                                    {/* Only Admin can delete */}
                                    {user?.role === 'tenant_admin' && (
                                        <IconButton size="small" color="error" onClick={() => handleDelete(task.id)}><Delete fontSize="small" /></IconButton>
                                    )}
                                </Stack>
                            </Paper>
                        </Grid>
                    );
                })}
                {filteredTasks.length === 0 && (
                    <Grid item xs={12}><Typography color="text.secondary" textAlign="center" py={4}>No tasks match this filter.</Typography></Grid>
                )}
            </Grid>

            {/* CREATE TASK MODAL */}
            <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>Create New Task</DialogTitle>
                <DialogContent>
                    <TextField autoFocus margin="dense" label="Task Title" fullWidth value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                    <Grid container spacing={2} mt={0.5}>
                        <Grid item xs={6}>
                            <TextField select fullWidth label="Priority" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                                <MenuItem value="low">Low</MenuItem>
                                <MenuItem value="medium">Medium</MenuItem>
                                <MenuItem value="high">High</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={6}>
                            <TextField type="date" fullWidth label="Due Date" InputLabelProps={{ shrink: true }} value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
                        </Grid>
                    </Grid>
                    <TextField select fullWidth label="Assign To" margin="dense" value={form.assignedTo} onChange={e => setForm({ ...form, assignedTo: e.target.value })} sx={{ mt: 2 }}>
                        <MenuItem value=""><em>Unassigned</em></MenuItem>
                        {users.map(u => <MenuItem key={u.id} value={u.id}>{u.full_name}</MenuItem>)}
                    </TextField>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleAddTask}>Create Task</Button>
                </DialogActions>
            </Dialog>
        </Layout>
    );
}

export default ProjectDetails;