import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import {
    Grid, Paper, Button, Chip, Avatar, Stack, Dialog, DialogTitle, DialogContent,
    TextField, DialogActions, Typography, CircularProgress, InputAdornment, IconButton, MenuItem
} from '@mui/material';
import { Add, Search, Edit, Delete } from '@mui/icons-material';
import Layout from '../components/Layout';

function Projects() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [isEdit, setIsEdit] = useState(false); // Track if editing
    const [search, setSearch] = useState('');

    // Unified Form State
    const [formData, setFormData] = useState({ id: '', name: '', description: '', status: 'active' });
    const [user] = useState(JSON.parse(localStorage.getItem('user')));

    const navigate = useNavigate();

    useEffect(() => { fetchProjects(); }, []);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const res = await api.get('/projects');
            setProjects(res.data.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleOpen = (project = null) => {
        if (project) {
            setIsEdit(true);
            setFormData({ id: project.id, name: project.name, description: project.description, status: project.status });
        } else {
            setIsEdit(false);
            setFormData({ id: '', name: '', description: '', status: 'active' });
        }
        setOpen(true);
    };

    const handleSubmit = async () => {
        try {
            if (isEdit) {
                await api.put(`/projects/${formData.id}`, formData);
            } else {
                await api.post('/projects', formData);
            }
            setOpen(false);
            fetchProjects();
        } catch (err) { alert(err.response?.data?.message || "Error"); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure? This will delete all tasks in this project.")) return;
        try { await api.delete(`/projects/${id}`); fetchProjects(); } catch (err) { alert("Error deleting"); }
    };

    const filteredProjects = projects.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <Layout
            title="Projects"
            actions={
                user?.role === 'tenant_admin' && (
                    <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen(null)}>New Project</Button>
                )
            }
        >
            <Paper sx={{ p: 2, mb: 4, display: 'flex', alignItems: 'center', border: '1px solid #334155' }}>
                <InputAdornment position="start" sx={{ mr: 1 }}><Search color="action" /></InputAdornment>
                <TextField
                    variant="standard" placeholder="Search projects..." fullWidth
                    InputProps={{ disableUnderline: true }} value={search} onChange={(e) => setSearch(e.target.value)}
                />
            </Paper>

            {loading ? <CircularProgress /> : filteredProjects.length === 0 ? (
                <Paper sx={{ p: 6, textAlign: 'center', borderStyle: 'dashed' }}><Typography>No projects found</Typography></Paper>
            ) : (
                <Grid container spacing={3}>
                    {filteredProjects.map((item) => (
                        <Grid item xs={12} md={6} lg={4} key={item.id}>
                            <Paper sx={{ p: 3, border: '1px solid #334155', '&:hover': { boxShadow: 6, borderColor: 'primary.main' } }}>
                                <Stack direction="row" justifyContent="space-between" mb={2}>
                                    <Avatar variant="rounded" sx={{ bgcolor: 'primary.main' }}>{item.name[0]}</Avatar>
                                    <Stack direction="row" spacing={1}>
                                        {/* REQ SATISFIED: Edit Button */}
                                        {user?.role === 'tenant_admin' && (
                                            <IconButton size="small" onClick={() => handleOpen(item)}><Edit fontSize="small" /></IconButton>
                                        )}
                                        <Chip label={item.status} size="small" color="success" variant="outlined" sx={{ textTransform: 'uppercase', fontSize: '0.7rem' }} />
                                    </Stack>
                                </Stack>
                                <Typography variant="h6" fontWeight="bold" gutterBottom>{item.name}</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, height: 40, overflow: 'hidden' }}>
                                    {item.description || 'No description provided.'}
                                </Typography>

                                <Stack direction="row" spacing={1}>
                                    <Button size="small" fullWidth variant="outlined" onClick={() => navigate(`/projects/${item.id}`)}>Open Workspace</Button>
                                    {user?.role === 'tenant_admin' && (
                                        <IconButton size="small" color="error" onClick={() => handleDelete(item.id)}><Delete /></IconButton>
                                    )}
                                </Stack>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* CREATE / EDIT MODAL */}
            <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>{isEdit ? 'Edit Project' : 'Create New Project'}</DialogTitle>
                <DialogContent>
                    <TextField margin="dense" label="Project Name" fullWidth value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                    <TextField margin="dense" label="Description" fullWidth multiline rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                    {isEdit && (
                        <TextField select margin="dense" label="Status" fullWidth value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                            <MenuItem value="active">Active</MenuItem>
                            <MenuItem value="archived">Archived</MenuItem>
                            <MenuItem value="completed">Completed</MenuItem>
                        </TextField>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained">{isEdit ? 'Update' : 'Create'}</Button>
                </DialogActions>
            </Dialog>
        </Layout>
    );
}
export default Projects;