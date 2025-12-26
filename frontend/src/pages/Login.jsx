import { useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';

function Login() {
    const [email, setEmail] = useState('admin@demo.com'); // Pre-filled for demo
    const [password, setPassword] = useState('Demo@123'); // Pre-filled for demo
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/auth/login', { email, password });

            // Save Token and User info
            localStorage.setItem('token', res.data.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.data.user));

            // Go to Dashboard
            navigate('/dashboard');
        } catch (err) {
            setError('Invalid Credentials');
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc' }}>
            <h2>SaaS Login</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <form onSubmit={handleLogin}>
                <div style={{ marginBottom: '10px' }}>
                    <label>Email:</label><br />
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{ width: '100%', padding: '8px' }}
                    />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label>Password:</label><br />
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ width: '100%', padding: '8px' }}
                    />
                </div>
                <button type="submit" style={{ width: '100%', padding: '10px', background: 'blue', color: 'white' }}>
                    Login
                </button>
            </form>
        </div>
    );
}

export default Login;