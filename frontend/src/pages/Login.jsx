import { useState } from 'react';
import api from '../api';
import { useNavigate, Link } from 'react-router-dom';
import { Box, Button, TextField, Typography, Paper, Alert, Grid } from '@mui/material';

function Login() {
    const [email, setEmail] = useState('admin@demo.com');
    const [password, setPassword] = useState('Demo@123');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/auth/login', { email, password });
            localStorage.setItem('token', res.data.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.data.user));
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid credentials');
        }
    };

    return (
        <Grid container component="main" sx={{ height: '100vh' }}>
            <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', p: 4 }}>
                <Box sx={{ my: 8, mx: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Typography component="h1" variant="h4" fontWeight="bold" gutterBottom>
                        Nexus SaaS
                    </Typography>
                    <Typography color="text.secondary" mb={4}>Sign in to your dashboard</Typography>

                    <Box component="form" onSubmit={handleLogin} sx={{ mt: 1, width: '100%' }}>
                        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                        <TextField
                            margin="normal" required fullWidth label="Email Address"
                            autoFocus value={email} onChange={(e) => setEmail(e.target.value)}
                        />
                        <TextField
                            margin="normal" required fullWidth label="Password" type="password"
                            value={password} onChange={(e) => setPassword(e.target.value)}
                        />
                        <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2, py: 1.5 }}>
                            Sign In
                        </Button>
                        <Grid container>
                            <Grid item xs>
                                <Link to="/register" style={{ color: '#3b82f6', textDecoration: 'none' }}>
                                    Don't have an account? Sign Up
                                </Link>
                            </Grid>
                        </Grid>
                    </Box>
                </Box>
            </Grid>
            <Grid item xs={false} sm={4} md={7} sx={{
                backgroundImage: 'radial-gradient(circle at center, #1e293b 0%, #0f172a 100%)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
                <Box sx={{ color: 'white', textAlign: 'center' }}>
                    <Typography variant="h3" fontWeight="bold">Enterprise Grade</Typography>
                    <Typography variant="h6" sx={{ opacity: 0.7 }}>Multi-tenant Architecture</Typography>
                </Box>
            </Grid>
        </Grid>
    );
}

export default Login;