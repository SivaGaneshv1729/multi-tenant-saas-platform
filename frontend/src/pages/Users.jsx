import { useEffect, useState } from 'react';
import api from '../api';
import { Link } from 'react-router-dom';

function Users() {
    const [users, setUsers] = useState([]);
    const [formData, setFormData] = useState({ fullName: '', email: '', password: '', role: 'user' });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = () => {
        api.get('/users').then(res => setUsers(res.data.data)).catch(console.error);
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        try {
            await api.post('/users', formData);
            alert('User added successfully');
            setFormData({ fullName: '', email: '', password: '', role: 'user' });
            fetchUsers();
        } catch (err) {
            alert('Error adding user: ' + (err.response?.data?.message || err.message));
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '0 1rem' }}>
            <Link to="/dashboard" style={{ color: '#2563eb', textDecoration: 'none', marginBottom: '1rem', display: 'inline-block' }}>← Back to Dashboard</Link>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                {/* Add User Form */}
                <div className="card" style={{ maxWidth: '100%' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Add Team Member</h3>
                    <form onSubmit={handleAddUser}>
                        <input className="input-field" placeholder="Full Name" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} required />
                        <input className="input-field" placeholder="Email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                        <input className="input-field" type="password" placeholder="Password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required />
                        <select className="input-field" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                            <option value="user">Regular User</option>
                            <option value="tenant_admin">Tenant Admin</option>
                        </select>
                        <button className="btn btn-primary">Add User</button>
                    </form>
                </div>

                {/* User List */}
                <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Team Members</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {users.map(u => (
                            <div key={u.id} style={{ padding: '1rem', background: 'white', border: '1px solid #e5e7eb', borderRadius: '0.375rem' }}>
                                <div style={{ fontWeight: '600' }}>{u.full_name}</div>
                                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{u.email}</div>
                                <div style={{ fontSize: '0.75rem', color: '#2563eb', marginTop: '0.25rem' }}>{u.role}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Users;