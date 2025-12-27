import { useState } from 'react';
import api from '../api';
import { useNavigate, Link } from 'react-router-dom';
import { Box, Button, TextField, Typography, Paper, Alert, Grid, InputAdornment } from '@mui/material';
import { Business, Person, Email, Lock, Domain } from '@mui/icons-material';

function Register() {
    const [form, setForm] = useState({
        tenantName: '',
        subdomain: '',
        fullName: '',
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Regex: lowercase letters and numbers only
        if (!/^[a-z0-9]+$/.test(form.subdomain)) {
            setError('Subdomain must be lowercase letters and numbers only (no spaces).');
            setLoading(false);
            return;
        }

        try {
            // FIX: Mapping 'email' to 'adminEmail' to match backend expectation
            await api.post('/auth/register-tenant', {
                tenantName: form.tenantName,
                subdomain: form.subdomain,
                adminEmail: form.email,
                adminPassword: form.password,
                adminFullName: form.fullName
            });
            alert('Registration Successful! Please Login.');
            navigate('/login');
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Grid container component="main" sx={{ height: '100vh' }}>
            {/* Left Panel - Form */}
            <Grid item xs={12} md={5} component={Paper} elevation={6} square sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', p: 4 }}>
                <Box sx={{ my: 4, mx: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Typography component="h1" variant="h4" fontWeight="bold" gutterBottom>Start Your Trial</Typography>
                    <Typography color="text.secondary" mb={4}>Create your organization workspace</Typography>

                    <Box component="form" onSubmit={handleRegister} sx={{ width: '100%' }}>
                        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                        <TextField margin="dense" required fullWidth label="Company Name" placeholder="Acme Corp" value={form.tenantName} onChange={(e) => setForm({ ...form, tenantName: e.target.value })} InputProps={{ startAdornment: (<InputAdornment position="start"><Business fontSize="small" /></InputAdornment>) }} />
                        <TextField margin="dense" required fullWidth label="Workspace Subdomain" placeholder="acme" helperText={`Your URL: ${form.subdomain || 'company'}.nexus.com`} value={form.subdomain} onChange={(e) => setForm({ ...form, subdomain: e.target.value })} InputProps={{ startAdornment: (<InputAdornment position="start"><Domain fontSize="small" /></InputAdornment>) }} />

                        <TextField margin="dense" required fullWidth label="Admin Name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} InputProps={{ startAdornment: (<InputAdornment position="start"><Person fontSize="small" /></InputAdornment>) }} />
                        <TextField margin="dense" required fullWidth label="Admin Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} InputProps={{ startAdornment: (<InputAdornment position="start"><Email fontSize="small" /></InputAdornment>) }} />
                        <TextField margin="dense" required fullWidth label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} InputProps={{ startAdornment: (<InputAdornment position="start"><Lock fontSize="small" /></InputAdornment>) }} />

                        <Button type="submit" fullWidth variant="contained" disabled={loading} sx={{ mt: 4, mb: 2, py: 1.5, fontWeight: 'bold' }}>{loading ? 'Creating...' : 'Create Account'}</Button>
                        <Grid container justifyContent="center"><Grid item><Link to="/login" style={{ color: '#3b82f6', textDecoration: 'none' }}>Already have an account? Sign In</Link></Grid></Grid>
                    </Box>
                </Box>
            </Grid>

            {/* Right Panel - Visuals */}
            <Grid item xs={false} md={7} sx={{ backgroundImage: 'radial-gradient(circle at center, #1e293b 0%, #0f172a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Box sx={{ textAlign: 'center', color: 'white', p: 4 }}>
                    <Typography variant="h2" fontWeight="800">Scale Faster</Typography>
                    <Typography variant="h5" sx={{ opacity: 0.8 }}>Multi-tenant SaaS Platform</Typography>
                </Box>
            </Grid>
        </Grid>
    );
}
export default Register;