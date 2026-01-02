import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import {
    Container, Paper, TextField, Button, Typography, Box,
    InputAdornment, Alert, CircularProgress, IconButton
} from '@mui/material';
import { Business, Email, Lock, Visibility, VisibilityOff } from '@mui/icons-material';

function Login() {
    const [formData, setFormData] = useState({ email: '', password: '', subdomain: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await api.post('/auth/login', formData);
            localStorage.setItem('token', res.data.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.data.user));
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="xs" sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Paper elevation={6} sx={{ p: 4, width: '100%', borderRadius: 2 }}>
                <Typography variant="h5" align="center" fontWeight="bold" gutterBottom color="primary">
                    Welcome Back
                </Typography>
                <Typography variant="body2" align="center" color="text.secondary" mb={3}>
                    Sign in to your workspace
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <Box component="form" onSubmit={handleSubmit}>
                    {/* SUBDOMAIN INPUT - NO 'required' */}
                    <TextField
                        fullWidth
                        label="Workspace Subdomain"
                        name="subdomain"
                        placeholder="e.g. acme"
                        value={formData.subdomain}
                        onChange={handleChange}
                        margin="normal"
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><Business color="action" /></InputAdornment>,
                        }}
                        helperText="Leave empty if you are a System Admin"
                    />

                    <TextField
                        fullWidth
                        required
                        label="Email Address"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        margin="normal"
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><Email color="action" /></InputAdornment>,
                        }}
                    />

                    <TextField
                        fullWidth
                        required
                        label="Password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={handleChange}
                        margin="normal"
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

                    <Button
                        fullWidth
                        type="submit"
                        variant="contained"
                        size="large"
                        sx={{ mt: 3, mb: 2, height: 48, fontWeight: 'bold' }}
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
                    </Button>

                    <Box textAlign="center" mt={2}>
                        <Link to="/register" style={{ textDecoration: 'none', color: '#1976d2', fontSize: '0.9rem' }}>
                            Register new organization
                        </Link>
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
}

export default Login;