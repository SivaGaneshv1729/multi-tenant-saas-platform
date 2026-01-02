import { useEffect, useState } from 'react';
import api from '../api';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box, Button, Typography, Paper, Grid, TextField, MenuItem, Chip, Stack, IconButton,
    Avatar, Dialog, DialogTitle, DialogContent, DialogActions, Menu
} from '@mui/material';
import { ArrowBack, Delete, AccessTime, Add, FilterList, Edit, MoreVert } from '@mui/icons-material';
import Layout from '../components/Layout';

function ProjectDetails() {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [user] = useState(JSON.parse(localStorage.getItem('user')));

    const [tasks, setTasks] = useState([]);
    const [project, setProject] = useState(null);
    const [users, setUsers] = useState([]);
    const [filter, setFilter] = useState('all');

    // Modals
    const [openTask, setOpenTask] = useState(false);
    const [openEditProject, setOpenEditProject] = useState(false);

    // Edit Task State
    const [isEditTask, setIsEditTask] = useState(false);
    const [editingTaskId, setEditingTaskId] = useState(null);

    // Status Menu State
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedTaskForStatus, setSelectedTaskForStatus] = useState(null);

    // Forms
    const [taskForm, setTaskForm] = useState({ title: '', priority: 'medium', dueDate: '', assignedTo: '' });
    const [projectForm, setProjectForm] = useState({ name: '', description: '', status: '' });

    useEffect(() => { fetchProjectData(); fetchUsers(); }, [projectId]);

    const fetchProjectData = async () => {
        try {
            const pRes = await api.get(`/projects`);
            const current = pRes.data.data.find(p => p.id === projectId);
            setProject(current);
            if (current) setProjectForm({ name: current.name, description: current.description, status: current.status });

            const tRes = await api.get(`/projects/${projectId}/tasks`);
            setTasks(tRes.data.data);
        } catch (err) { console.error(err); }
    };

    const fetchUsers = () => { api.get('/users').then(res => setUsers(res.data.data)); };

    const handleUpdateProject = async () => {
        try {
            await api.put(`/projects/${projectId}`, projectForm);
            setOpenEditProject(false);
            fetchProjectData();
        } catch (err) { alert("Failed to update project"); }
    };

    // Open Modal for Create
    const handleOpenCreateTask = () => {
        setIsEditTask(false);
        setTaskForm({ title: '', priority: 'medium', dueDate: '', assignedTo: '' });
        setOpenTask(true);
    };

    // Open Modal for Edit
    const handleOpenEditTask = (task) => {
        setIsEditTask(true);
        setEditingTaskId(task.id);
        setTaskForm({
            title: task.title,
            priority: task.priority,
            dueDate: task.due_date ? task.due_date.split('T')[0] : '',
            assignedTo: task.assigned_to || ''
        });
        setOpenTask(true);
    };

    const handleTaskSubmit = async () => {
        try {
            const payload = { ...taskForm, assignedTo: taskForm.assignedTo || null };
            if (isEditTask) {
                await api.put(`/tasks/${editingTaskId}`, payload);
            } else {
                await api.post(`/projects/${projectId}/tasks`, payload);
            }
            setOpenTask(false);
            fetchProjectData();
        } catch (err) { alert("Failed to save task"); }
    };

    const handleDeleteTask = async (id) => {
        if (!window.confirm("Delete task?")) return;
        try { await api.delete(`/tasks/${id}`); fetchProjectData(); } catch (err) { alert("Failed"); }
    };

    // Status Change Logic
    const handleStatusClick = (event, task) => {
        setAnchorEl(event.currentTarget);
        setSelectedTaskForStatus(task);
    };
    const handleStatusClose = () => {
        setAnchorEl(null);
        setSelectedTaskForStatus(null);
    };
    const handleStatusChange = async (newStatus) => {
        if (selectedTaskForStatus) {
            try {
                await api.patch(`/tasks/${selectedTaskForStatus.id}/status`, { status: newStatus });
                fetchProjectData();
            } catch (err) { alert("Error updating status"); }
        }
        handleStatusClose();
    };

    const filteredTasks = tasks.filter(t => filter === 'all' ? true : t.status === filter);

    return (
        <Layout
            title={project ? project.name : "Project Workspace"}
            actions={
                <Stack direction="row" spacing={1}>
                    <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate('/projects')}>Back</Button>
                    {user?.role === 'tenant_admin' && (
                        <Button variant="outlined" startIcon={<Edit />} onClick={() => setOpenEditProject(true)}>Edit Project</Button>
                    )}
                    <Button variant="contained" startIcon={<Add />} onClick={handleOpenCreateTask}>New Task</Button>
                </Stack>
            }
        >
            <Box mb={3}>
                <Typography variant="body1" color="text.secondary">{project?.description}</Typography>
            </Box>

            {/* FILTERS */}
            <Stack direction="row" spacing={1} mb={3} alignItems="center">
                <FilterList color="action" />
                <Chip label="All" onClick={() => setFilter('all')} color={filter === 'all' ? 'primary' : 'default'} clickable />
                <Chip label="Todo" onClick={() => setFilter('todo')} color={filter === 'todo' ? 'primary' : 'default'} clickable />
                <Chip label="In Progress" onClick={() => setFilter('in_progress')} color={filter === 'in_progress' ? 'info' : 'default'} clickable />
                <Chip label="Completed" onClick={() => setFilter('completed')} color={filter === 'completed' ? 'success' : 'default'} clickable />
            </Stack>

            <Grid container spacing={2}>
                {filteredTasks.map(task => {
                    const assignee = users.find(u => u.id === task.assigned_to);
                    return (
                        <Grid item xs={12} key={task.id}>
                            <Paper sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #334155' }}>
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
                                        ) : <Typography variant="caption" color="text.disabled">Unassigned</Typography>}
                                    </Stack>
                                </Box>

                                {/* ACTIONS */}
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    {/* Status Button (Clickable) */}
                                    <Chip
                                        label={task.status.replace('_', ' ')}
                                        color={task.status === 'completed' ? 'success' : task.status === 'in_progress' ? 'info' : 'default'}
                                        size="small"
                                        onClick={(e) => handleStatusClick(e, task)}
                                        onDelete={(e) => handleStatusClick(e, task)}
                                        deleteIcon={<MoreVert />}
                                    />

                                    {/* Edit Button */}
                                    <IconButton size="small" onClick={() => handleOpenEditTask(task)}>
                                        <Edit fontSize="small" />
                                    </IconButton>

                                    {/* Delete Button (Admin Only) */}
                                    {user?.role === 'tenant_admin' && (
                                        <IconButton size="small" color="error" onClick={() => handleDeleteTask(task.id)}>
                                            <Delete fontSize="small" />
                                        </IconButton>
                                    )}
                                </Stack>
                            </Paper>
                        </Grid>
                    );
                })}
            </Grid>

            {/* STATUS MENU */}
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleStatusClose}>
                <MenuItem onClick={() => handleStatusChange('todo')}>Todo</MenuItem>
                <MenuItem onClick={() => handleStatusChange('in_progress')}>In Progress</MenuItem>
                <MenuItem onClick={() => handleStatusChange('completed')}>Completed</MenuItem>
            </Menu>

            {/* CREATE / EDIT TASK MODAL */}
            <Dialog open={openTask} onClose={() => setOpenTask(false)} fullWidth maxWidth="sm">
                <DialogTitle>{isEditTask ? 'Edit Task' : 'Create New Task'}</DialogTitle>
                <DialogContent>
                    <TextField autoFocus margin="dense" label="Task Title" fullWidth value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} />
                    <Grid container spacing={2} mt={0.5}>
                        <Grid item xs={6}>
                            <TextField select fullWidth label="Priority" value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}>
                                <MenuItem value="low">Low</MenuItem><MenuItem value="medium">Medium</MenuItem><MenuItem value="high">High</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={6}>
                            <TextField type="date" fullWidth label="Due Date" InputLabelProps={{ shrink: true }} value={taskForm.dueDate} onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })} />
                        </Grid>
                    </Grid>
                    <TextField select fullWidth label="Assign To" margin="dense" value={taskForm.assignedTo} onChange={e => setTaskForm({ ...taskForm, assignedTo: e.target.value })} sx={{ mt: 2 }}>
                        <MenuItem value=""><em>Unassigned</em></MenuItem>
                        {users.map(u => <MenuItem key={u.id} value={u.id}>{u.full_name}</MenuItem>)}
                    </TextField>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setOpenTask(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleTaskSubmit}>{isEditTask ? 'Update Task' : 'Create Task'}</Button>
                </DialogActions>
            </Dialog>

            {/* EDIT PROJECT MODAL */}
            <Dialog open={openEditProject} onClose={() => setOpenEditProject(false)} fullWidth maxWidth="sm">
                <DialogTitle>Edit Project Details</DialogTitle>
                <DialogContent>
                    <TextField margin="dense" label="Project Name" fullWidth value={projectForm.name} onChange={e => setProjectForm({ ...projectForm, name: e.target.value })} />
                    <TextField margin="dense" label="Description" fullWidth multiline rows={3} value={projectForm.description} onChange={e => setProjectForm({ ...projectForm, description: e.target.value })} />
                    <TextField select margin="dense" label="Status" fullWidth value={projectForm.status} onChange={e => setProjectForm({ ...projectForm, status: e.target.value })}>
                        <MenuItem value="active">Active</MenuItem><MenuItem value="archived">Archived</MenuItem><MenuItem value="completed">Completed</MenuItem>
                    </TextField>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setOpenEditProject(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleUpdateProject}>Save Changes</Button>
                </DialogActions>
            </Dialog>
        </Layout>
    );
}

export default ProjectDetails;