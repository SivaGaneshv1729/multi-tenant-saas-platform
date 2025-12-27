import { useEffect, useState } from 'react';
import api from '../api';
import {
    Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Chip, IconButton, Dialog, DialogTitle, DialogContent, TextField,
    DialogActions, Select, MenuItem, InputLabel, FormControl, CircularProgress, Stack
} from '@mui/material';
import { Delete, Add, Edit } from '@mui/icons-material';
import Layout from '../components/Layout';

function Users() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);

    // Forms
    const [form, setForm] = useState({ fullName: '', email: '', password: '', role: 'user' });
    const [editForm, setEditForm] = useState({ id: '', fullName: '', role: '' });

    useEffect(() => { fetchUsers(); }, []);

    const fetchUsers = () => {
        setLoading(true);
        api.get('/users').then(res => setUsers(res.data.data)).finally(() => setLoading(false));
    };

    const handleAddUser = async () => {
        try {
            await api.post('/users', form);
            setOpen(false); setForm({ fullName: '', email: '', password: '', role: 'user' });
            fetchUsers();
        } catch (err) { alert(err.response?.data?.message || 'Error'); }
    };

    const handleUpdateUser = async () => {
        try {
            await api.put(`/users/${editForm.id}`, { fullName: editForm.fullName, role: editForm.role });
            setEditOpen(false);
            fetchUsers();
        } catch (err) { alert('Error updating user'); }
    };

    const handleDelete = async (userId) => {
        if (!confirm("Are you sure?")) return;
        try { await api.delete(`/users/${userId}`); fetchUsers(); } catch (err) { alert("Failed"); }
    };

    const openEdit = (user) => {
        setEditForm({ id: user.id, fullName: user.full_name, role: user.role });
        setEditOpen(true);
    };

    return (
        <Layout title="Team Management" actions={<Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}>Add Member</Button>}>
            {loading ? <CircularProgress /> : (
                <TableContainer component={Paper} sx={{ border: '1px solid #334155' }}>
                    <Table>
                        <TableHead sx={{ bgcolor: 'action.hover' }}>
                            <TableRow>
                                <TableCell>Name</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell>Role</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {users.map((row) => (
                                <TableRow key={row.id}>
                                    <TableCell sx={{ fontWeight: 'bold' }}>{row.full_name}</TableCell>
                                    <TableCell>{row.email}</TableCell>
                                    <TableCell>
                                        <Chip label={row.role.replace('_', ' ')} color={row.role === 'tenant_admin' ? 'primary' : 'default'} size="small" />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                                            <IconButton size="small" onClick={() => openEdit(row)}><Edit fontSize="small" /></IconButton>
                                            <IconButton size="small" color="error" onClick={() => handleDelete(row.id)}><Delete fontSize="small" /></IconButton>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* ADD USER MODAL */}
            <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>Invite Team Member</DialogTitle>
                <DialogContent>
                    <TextField margin="dense" label="Full Name" fullWidth value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} />
                    <TextField margin="dense" label="Email" fullWidth value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                    <TextField margin="dense" label="Password" type="password" fullWidth value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                    <FormControl fullWidth margin="dense">
                        <InputLabel>Role</InputLabel>
                        <Select value={form.role} label="Role" onChange={e => setForm({ ...form, role: e.target.value })}>
                            <MenuItem value="user">User</MenuItem>
                            <MenuItem value="tenant_admin">Admin</MenuItem>
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleAddUser}>Invite</Button>
                </DialogActions>
            </Dialog>

            {/* EDIT USER MODAL */}
            <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>Edit User Role</DialogTitle>
                <DialogContent>
                    <TextField margin="dense" label="Full Name" fullWidth value={editForm.fullName} onChange={e => setEditForm({ ...editForm, fullName: e.target.value })} />
                    <FormControl fullWidth margin="dense">
                        <InputLabel>Role</InputLabel>
                        <Select value={editForm.role} label="Role" onChange={e => setEditForm({ ...editForm, role: e.target.value })}>
                            <MenuItem value="user">User</MenuItem>
                            <MenuItem value="tenant_admin">Admin</MenuItem>
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setEditOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleUpdateUser}>Save Changes</Button>
                </DialogActions>
            </Dialog>
        </Layout>
    );
}
export default Users;