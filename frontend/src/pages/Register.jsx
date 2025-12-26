import { useState } from 'react';
import api from '../api';
import { useNavigate, Link } from 'react-router-dom';

function Register() {
    const [formData, setFormData] = useState({
        tenantName: '',
        subdomain: '',
        fullName: '',
        email: '',
        password: ''
    });
    const navigate = useNavigate();

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/auth/register-tenant', formData);
            alert('Registration Successful! Please Login.');
            navigate('/login');
        } catch (err) {
            alert('Registration Failed: ' + (err.response?.data?.message || err.message));
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="card">
                <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 'bold' }}>
                    Start Your Free Trial
                </h2>

                <form onSubmit={handleSubmit}>
                    <div>
                        <label className="label">Company Name</label>
                        <input name="tenantName" className="input-field" placeholder="Acme Inc." onChange={handleChange} required />
                    </div>

                    <div>
                        <label className="label">Subdomain</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <input name="subdomain" className="input-field" placeholder="acme" style={{ marginBottom: '1rem' }} onChange={handleChange} required />
                            <span style={{ color: '#6b7280', marginBottom: '1rem' }}>.sys.com</span>
                        </div>
                    </div>

                    <div>
                        <label className="label">Admin Name</label>
                        <input name="fullName" className="input-field" placeholder="John Doe" onChange={handleChange} required />
                    </div>

                    <div>
                        <label className="label">Email Address</label>
                        <input name="email" type="email" className="input-field" placeholder="john@acme.com" onChange={handleChange} required />
                    </div>

                    <div>
                        <label className="label">Password</label>
                        <input name="password" type="password" className="input-field" placeholder="••••••••" onChange={handleChange} required />
                    </div>

                    <button type="submit" className="btn btn-primary">Create Account</button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                    Already have an account? <Link to="/login" style={{ color: '#2563eb', fontWeight: '500' }}>Login</Link>
                </p>
            </div>
        </div>
    );
}

export default Register;