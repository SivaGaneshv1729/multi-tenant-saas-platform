import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import {
    Grid, Paper, Button, Chip, Avatar, Stack, Dialog, DialogTitle, DialogContent,
    TextField, DialogActions, Typography, Box, CircularProgress, InputAdornment
} from '@mui/material';
import { Add, Search, FolderOpen } from '@mui/icons-material';
import Layout from '../components/Layout';

function Projects() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [newProject, setNewProject] = useState({ name: '', description: '' });
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));

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

    const handleCreateProject = async () => {
        try {
            await api.post('/projects', newProject);
            setOpen(false); setNewProject({ name: '', description: '' });
            fetchProjects();
        } catch (err) { alert(err.response?.data?.message || "Error"); }
    };

    const filteredProjects = projects.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <Layout
            title="Projects"
            actions={
                // RESTRICTION: Only Admin can see this button
                user?.role === 'tenant_admin' && (
                    <Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}>New Project</Button>
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
                <Paper sx={{ p: 6, textAlign: 'center', borderStyle: 'dashed', borderColor: 'divider' }}>
                    <FolderOpen sx={{ fontSize: 40, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.primary" gutterBottom>No projects found</Typography>
                </Paper>
            ) : (
                <Grid container spacing={3}>
                    {filteredProjects.map((item) => (
                        <Grid item xs={12} md={6} lg={4} key={item.id}>
                            <Paper sx={{ p: 3, border: '1px solid #334155', '&:hover': { boxShadow: 6, borderColor: 'primary.main' } }}>
                                <Stack direction="row" justifyContent="space-between" mb={2}>
                                    <Avatar variant="rounded" sx={{ bgcolor: 'primary.main' }}>{item.name[0]}</Avatar>
                                    <Chip label={item.status} size="small" color="success" variant="outlined" sx={{ textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: 'bold' }} />
                                </Stack>
                                <Typography variant="h6" fontWeight="bold" gutterBottom>{item.name}</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                    {item.description || 'No description provided.'}
                                </Typography>
                                <Box sx={{ borderTop: '1px solid #334155', pt: 2 }}>
                                    <Button size="small" fullWidth variant="outlined" onClick={() => navigate(`/projects/${item.id}`)}>
                                        Open Workspace
                                    </Button>
                                </Box>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            )}

            <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>Create New Project</DialogTitle>
                <DialogContent>
                    <TextField autoFocus margin="dense" label="Project Name" fullWidth value={newProject.name} onChange={(e) => setNewProject({ ...newProject, name: e.target.value })} />
                    <TextField margin="dense" label="Description" fullWidth multiline rows={3} value={newProject.description} onChange={(e) => setNewProject({ ...newProject, description: e.target.value })} />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreateProject} variant="contained">Create</Button>
                </DialogActions>
            </Dialog>
        </Layout>
    );
}

export default Projects;