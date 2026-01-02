import { useEffect, useState } from 'react';
import api from '../api';
import {
    Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Button, IconButton, Chip, Dialog, DialogTitle, DialogContent, TextField,
    DialogActions, MenuItem, Checkbox, FormControlLabel, InputAdornment, Stack, Typography
} from '@mui/material';
import { Add, Edit, Delete, Search, Person } from '@mui/icons-material';
import Layout from '../components/Layout';

function Users() {
    const [users, setUsers] = useState([]);
    const [open, setOpen] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [search, setSearch] = useState('');

    const [formData, setFormData] = useState({
        id: '', email: '', password: '', fullName: '', role: 'user', isActive: true
    });

    useEffect(() => { fetchUsers(); }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users');
            setUsers(res.data.data);
        } catch (err) { console.error(err); }
    };

    const handleOpen = (user = null) => {
        if (user) {
            setIsEdit(true);
            setFormData({ id: user.id, email: user.email, password: '', fullName: user.full_name, role: user.role, isActive: true });
        } else {
            setIsEdit(false);
            setFormData({ id: '', email: '', password: '', fullName: '', role: 'user', isActive: true });
        }
        setOpen(true);
    };

    const handleSubmit = async () => {
        try {
            if (isEdit) {
                await api.put(`/users/${formData.id}`, formData);
            } else {
                await api.post('/users', formData);
            }
            setOpen(false);
            fetchUsers();
        } catch (err) { alert(err.response?.data?.message || "Error"); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure?")) return;
        try { await api.delete(`/users/${id}`); fetchUsers(); } catch (err) { alert(err.response?.data?.message); }
    };

    const filteredUsers = users.filter(u =>
        u.full_name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Layout
            title="Team Members"
            actions={<Button variant="contained" startIcon={<Add />} onClick={() => handleOpen(null)}>Add Member</Button>}
        >
            <Paper sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center' }}>
                <InputAdornment position="start" sx={{ mr: 1 }}><Search color="action" /></InputAdornment>
                <TextField
                    variant="standard" placeholder="Search by name or email..." fullWidth
                    InputProps={{ disableUnderline: true }} value={search} onChange={(e) => setSearch(e.target.value)}
                />
            </Paper>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'action.hover' }}>
                            <TableCell>Name</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Role</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredUsers.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell>
                                    <Stack direction="row" alignItems="center" spacing={2}>
                                        <Person color="action" />
                                        <Typography variant="body2" fontWeight="500">{user.full_name}</Typography>
                                    </Stack>
                                </TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={user.role.replace('_', ' ')}
                                        color={user.role === 'tenant_admin' ? 'primary' : 'default'}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell align="right">
                                    <IconButton size="small" onClick={() => handleOpen(user)}><Edit fontSize="small" /></IconButton>
                                    <IconButton size="small" color="error" onClick={() => handleDelete(user.id)}><Delete fontSize="small" /></IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
                <DialogTitle>{isEdit ? 'Edit User' : 'Add New Member'}</DialogTitle>
                <DialogContent>
                    <TextField margin="dense" label="Full Name" fullWidth value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} />
                    <TextField margin="dense" label="Email" fullWidth disabled={isEdit} value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                    {!isEdit && (
                        <TextField margin="dense" label="Password" type="password" fullWidth value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                    )}
                    <TextField select margin="dense" label="Role" fullWidth value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                        <MenuItem value="user">User</MenuItem>
                        <MenuItem value="tenant_admin">Tenant Admin</MenuItem>
                    </TextField>
                    {isEdit && (
                        <FormControlLabel control={<Checkbox checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} />} label="Active Account" sx={{ mt: 1 }} />
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleSubmit}>{isEdit ? 'Update' : 'Add User'}</Button>
                </DialogActions>
            </Dialog>
        </Layout>
    );
}

export default Users;