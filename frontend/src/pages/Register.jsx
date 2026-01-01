import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import {
    Container, Paper, TextField, Button, Typography, Box,
    InputAdornment, Alert, CircularProgress, Stack, IconButton
} from '@mui/material';
import { Business, Email, Lock, Person, Dns, Visibility, VisibilityOff } from '@mui/icons-material';

function Register() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Visibility States
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [formData, setFormData] = useState({
        tenantName: '',
        subdomain: '',
        adminFullName: '',
        adminEmail: '',
        adminPassword: '',
        confirmPassword: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Client-side validation
        if (formData.adminPassword !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);
        try {
            // Remove confirmPassword before sending to API
            const { confirmPassword, ...payload } = formData;

            await api.post('/auth/register-tenant', payload);
            alert("Registration successful! Please login.");
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.message || "Registration failed. Subdomain or Email might be taken.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="xs" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
            <Paper elevation={6} sx={{ p: 4, width: '100%', borderRadius: 2 }}>

                <Box textAlign="center" mb={3}>
                    <Typography variant="h5" fontWeight="bold" color="primary">
                        Create Workspace
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Get started with your new organization
                    </Typography>
                </Box>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <Box component="form" onSubmit={handleSubmit}>

                    <Stack spacing={2}>
                        {/* ORGANIZATION NAME */}
                        <TextField
                            fullWidth
                            required
                            label="Organization Name"
                            name="tenantName"
                            placeholder="e.g. Acme Corp"
                            value={formData.tenantName}
                            onChange={handleChange}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><Business color="action" /></InputAdornment>,
                            }}
                        />

                        {/* SUBDOMAIN */}
                        <TextField
                            fullWidth
                            required
                            label="Workspace Subdomain"
                            name="subdomain"
                            placeholder="acme"
                            helperText={`Your address will be: ${formData.subdomain || '...'}.saas.com`}
                            value={formData.subdomain}
                            onChange={handleChange}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><Dns color="action" /></InputAdornment>,
                            }}
                        />

                        {/* ADMIN NAME */}
                        <TextField
                            fullWidth
                            required
                            label="Admin Full Name"
                            name="adminFullName"
                            placeholder="John Doe"
                            value={formData.adminFullName}
                            onChange={handleChange}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><Person color="action" /></InputAdornment>,
                            }}
                        />

                        {/* EMAIL */}
                        <TextField
                            fullWidth
                            required
                            label="Admin Email"
                            name="adminEmail"
                            type="email"
                            value={formData.adminEmail}
                            onChange={handleChange}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><Email color="action" /></InputAdornment>,
                            }}
                        />

                        {/* PASSWORD */}
                        <TextField
                            fullWidth
                            required
                            label="Password"
                            name="adminPassword"
                            type={showPassword ? 'text' : 'password'}
                            value={formData.adminPassword}
                            onChange={handleChange}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><Lock color="action" /></InputAdornment>,
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />

                        {/* CONFIRM PASSWORD */}
                        <TextField
                            fullWidth
                            required
                            label="Confirm Password"
                            name="confirmPassword"
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><Lock color="action" /></InputAdornment>,
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />
                    </Stack>

                    <Button
                        fullWidth
                        type="submit"
                        variant="contained"
                        size="large"
                        sx={{ mt: 4, mb: 2, height: 48, fontWeight: 'bold' }}
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Register Organization'}
                    </Button>

                    <Box textAlign="center" mt={2}>
                        <Typography variant="body2" color="text.secondary">
                            Already have an account?{' '}
                            <Link to="/login" style={{ textDecoration: 'none', color: '#1976d2', fontWeight: 'bold' }}>
                                Sign In
                            </Link>
                        </Typography>
                    </Box>

                </Box>
            </Paper>
        </Container>
    );
}

export default Register;