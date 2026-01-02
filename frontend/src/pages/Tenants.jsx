import { useEffect, useState } from 'react';
import api from '../api';
import {
    Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    IconButton, Chip, Tooltip, TextField, InputAdornment, Box, MenuItem, Dialog,
    DialogTitle, DialogContent, DialogActions, Button
} from '@mui/material';
import { Search, Block, CheckCircle, Edit } from '@mui/icons-material';
import Layout from '../components/Layout';

function Tenants() {
    const [tenants, setTenants] = useState([]);
    const [search, setSearch] = useState('');
    const [planFilter, setPlanFilter] = useState('all');

    const [openModal, setOpenModal] = useState(false);
    const [selectedTenant, setSelectedTenant] = useState(null);
    const [newPlan, setNewPlan] = useState('free');

    useEffect(() => { fetchTenants(); }, []);

    const fetchTenants = async () => {
        try {
            // Use the proper endpoint for management
            const res = await api.get('/tenants'); // API 7 (Super Admin List)
            setTenants(res.data.data.tenants);
        } catch (err) { console.error(err); }
    }

    const handleStatusChange = async (tenant) => {
        const newStatus = tenant.status === 'active' ? 'suspended' : 'active';
        if (!window.confirm(`Are you sure you want to ${newStatus} ${tenant.name}?`)) return;

        try {
            await api.put(`/tenants/${tenant.id}`, { status: newStatus });
            fetchTenants();
        } catch (err) { alert("Update failed"); }
    };

    const openPlanModal = (tenant) => {
        setSelectedTenant(tenant);
        setNewPlan(tenant.subscription_plan);
        setOpenModal(true);
    };

    const handleUpdatePlan = async () => {
        try {
            await api.put(`/tenants/${selectedTenant.id}`, { subscriptionPlan: newPlan });
            setOpenModal(false);
            fetchTenants();
        } catch (err) { alert("Failed to update plan"); }
    };

    const filtered = tenants.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase()) &&
        (planFilter === 'all' || t.subscription_plan === planFilter)
    );

    return (
        <Layout title="Tenant Management">
            <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
                <TextField
                    size="small" placeholder="Search organization..." sx={{ flexGrow: 1 }}
                    value={search} onChange={(e) => setSearch(e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
                />
                <TextField
                    select size="small" value={planFilter} onChange={(e) => setPlanFilter(e.target.value)}
                    sx={{ width: 200 }} label="Filter Plan"
                >
                    <MenuItem value="all">All Plans</MenuItem>
                    <MenuItem value="free">Free</MenuItem>
                    <MenuItem value="pro">Pro</MenuItem>
                    <MenuItem value="enterprise">Enterprise</MenuItem>
                </TextField>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'action.hover' }}>
                            <TableCell>Organization</TableCell>
                            <TableCell>Subdomain</TableCell>
                            <TableCell>Plan</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filtered.map((tenant) => (
                            <TableRow key={tenant.id}>
                                <TableCell fontWeight="bold">{tenant.name}</TableCell>
                                <TableCell>{tenant.subdomain}</TableCell>
                                <TableCell>
                                    <Chip label={tenant.subscription_plan} size="small" color={tenant.subscription_plan === 'enterprise' ? 'secondary' : 'default'} variant="outlined" sx={{ textTransform: 'capitalize' }} />
                                </TableCell>
                                <TableCell>
                                    <Chip label={tenant.status} size="small" color={tenant.status === 'active' ? 'success' : 'error'} />
                                </TableCell>
                                <TableCell align="right">
                                    <Tooltip title="Change Plan">
                                        <IconButton onClick={() => openPlanModal(tenant)} size="small" color="primary"><Edit /></IconButton>
                                    </Tooltip>
                                    {tenant.status === 'active' ? (
                                        <Tooltip title="Suspend">
                                            <IconButton onClick={() => handleStatusChange(tenant)} size="small" color="error"><Block /></IconButton>
                                        </Tooltip>
                                    ) : (
                                        <Tooltip title="Activate">
                                            <IconButton onClick={() => handleStatusChange(tenant)} size="small" color="success"><CheckCircle /></IconButton>
                                        </Tooltip>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* UPDATE PLAN MODAL */}
            <Dialog open={openModal} onClose={() => setOpenModal(false)}>
                <DialogTitle>Update Subscription Plan</DialogTitle>
                <DialogContent sx={{ minWidth: 300, pt: 2 }}>
                    <TextField select fullWidth label="Select Plan" value={newPlan} onChange={(e) => setNewPlan(e.target.value)} margin="dense">
                        <MenuItem value="free">Free (5 Users)</MenuItem>
                        <MenuItem value="pro">Pro (25 Users)</MenuItem>
                        <MenuItem value="enterprise">Enterprise (100 Users)</MenuItem>
                    </TextField>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenModal(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleUpdatePlan}>Update</Button>
                </DialogActions>
            </Dialog>
        </Layout>
    );
}
export default Tenants;